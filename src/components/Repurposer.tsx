import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OutputCard, SkeletonCard } from "@/components/OutputCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

const FORMATS = [
  { key: "tweet_thread", label: "Tweet thread" },
  { key: "linkedin_post", label: "LinkedIn post" },
  { key: "reel_script", label: "Reel script" },
  { key: "newsletter_intro", label: "Newsletter intro" },
  { key: "whatsapp_broadcast", label: "WhatsApp broadcast" },
] as const;

const TONES = ["Professional", "Casual", "Witty", "Inspirational"] as const;

export type CandidateVariant = {
  title?: string;
  text: string;
};

export type FormattedOutput = {
  primary: string;
  candidates: CandidateVariant[];
};

export type OutputValue = FormattedOutput | string | string[];
export type OutputMap = Record<string, OutputValue>;

interface RepurposeResponse {
  outputs?: OutputMap;
  error?: string;
  code?: string;
  failedFormats?: string[];
}

const MIN_CONTENT_CHARS = 60;
const MIN_CONTENT_WORDS = 12;
const MAX_CONTENT_CHARS = 12000;

const validateContent = (content: string): string | null => {
  const trimmed = content.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (trimmed.length < MIN_CONTENT_CHARS || words.length < MIN_CONTENT_WORDS) {
    return `Add a bit more substance — paste at least a short paragraph (${MIN_CONTENT_CHARS}+ characters) so the AI has real material to work with.`;
  }
  if (trimmed.length > MAX_CONTENT_CHARS) {
    return `That's a lot! Trim it under ${MAX_CONTENT_CHARS} characters.`;
  }
  return null;
};

interface UserPreferences {
  preferred_tone: string;
  preferred_language: "EN" | "HI";
  preferred_formats: string[];
}

export const Repurposer = () => {
  const { user, loading: authLoading } = useAuth();
  const [content, setContent] = useState("");
  const [tone, setTone] = useState<string>("Casual");
  const [language, setLanguage] = useState<"EN" | "HI">("EN");
  const [selected, setSelected] = useState<string[]>(FORMATS.map((f) => f.key));
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState<OutputMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchUserPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (prefs) {
        const typedPrefs = prefs as Tables<"user_preferences">;
        if (typedPrefs.preferred_tone) setTone(typedPrefs.preferred_tone);
        if (typedPrefs.preferred_language) setLanguage(typedPrefs.preferred_language as "EN" | "HI");
        if (typedPrefs.preferred_formats?.length > 0) setSelected(typedPrefs.preferred_formats);
      }
    } catch {
      // No saved preferences yet.
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) void fetchUserPreferences();
  }, [user?.id, fetchUserPreferences]);

  const saveUserPreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);
    try {
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          preferred_tone: tone,
          preferred_language: language,
          preferred_formats: selected,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleFormat = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const generate = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody = { content: content.trim(), tone, language, formats: selected };
      let data: RepurposeResponse | null;

      if (import.meta.env.DEV) {
        // Local dev: the Vite server proxies to Gemini with the key kept
        // server-side (see vite.config.ts). The key is never sent to the browser.
        const res = await fetch("/api/repurpose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        data = (await res.json().catch(() => null)) as RepurposeResponse | null;
        if (!res.ok) {
          throw new Error(data?.error || "The AI engine is unreachable right now. Please try again in a moment.");
        }
      } else {
        // Production: the deployed Supabase edge function holds the AI keys.
        const invokeResult = (await supabase.functions.invoke("repurpose", {
          body: requestBody,
        })) as { data: RepurposeResponse | null; error: unknown };

        if (invokeResult.error) {
          // functions.invoke wraps non-2xx responses in FunctionsHttpError;
          // the server's { error } body lives on error.context
          let fnMessage: string | null = null;
          const context = (invokeResult.error as { context?: Response }).context;
          if (context && typeof context.json === "function") {
            try {
              const body = (await context.json()) as { error?: string };
              fnMessage = body?.error ?? null;
            } catch {
              // response body wasn't JSON
            }
          }
          if (!fnMessage && typeof invokeResult.error === "object" && "message" in invokeResult.error) {
            fnMessage = String((invokeResult.error as { message: unknown }).message);
          }
          throw new Error(fnMessage || "The AI engine is unreachable right now. Please try again in a moment.");
        }
        data = invokeResult.data;
      }

      if (data?.error) throw new Error(data.error);
      if (!data?.outputs || Object.keys(data.outputs).length === 0) {
        throw new Error("The AI returned an empty result. Try again or tweak your input.");
      }

      setOutputs(data.outputs);
      setError(null);

      if (data.failedFormats?.length) {
        const labels = data.failedFormats
          .map((f) => FORMATS.find((x) => x.key === f)?.label ?? f)
          .join(", ");
        toast.info(`Some formats are busy right now (${labels}) — run it again in a moment for the rest.`);
      }

      if (user) {
        try {
          const { error: historyError } = await supabase.from("usage_history").insert({
            user_id: user.id,
            input_content: content.trim(),
            tone,
            language,
            outputs: data.outputs,
          });
          if (historyError) throw historyError;
        } catch (persistenceError) {
          console.warn("Could not persist repurpose usage:", persistenceError);
        }

        void saveUserPreferences();
      }
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : "Something went wrong while repurposing. Please try again.";

      if (outputs) {
        // keep previously generated content on screen, surface a toast
        toast.error(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (authLoading && user) {
      toast("Finishing sign-in. Try again in a moment.");
      return;
    }

    const validationError = validateContent(content);
    if (validationError) {
      setError(validationError);
      toast.warning(validationError);
      return;
    }

    if (selected.length === 0) {
      const msg = "Select at least one output format";
      setError(msg);
      toast.error(msg);
      return;
    }

    await generate();
  };

  const renderOutput = (key: string, value: OutputValue) => {
    const label = FORMATS.find((f) => f.key === key)?.label || key;
    if (Array.isArray(value)) {
      return <OutputCard key={key} label={label} blocks={value} text={value.join("\n\n")} />;
    }
    if (value && typeof value === "object" && "primary" in value) {
      return <OutputCard key={key} label={label} text={value.primary} />;
    }
    return <OutputCard key={key} label={label} text={String(value || "")} />;
  };

  return (
    <section className="container max-w-3xl py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          One piece of content.
          <br />
          <span className="text-primary">Ruom it everywhere.</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
          Paste anything. Get tweets, reels, LinkedIn posts and more in seconds.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Your content</span>
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-background">
            {(["EN", "HI"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  language === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your blog post, YouTube transcript, podcast notes, or raw idea here — at least a short paragraph works best..."
          className="min-h-[180px] resize-y bg-background border-border text-base focus-visible:ring-primary"
        />

        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Output formats</div>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((format) => {
              const active = selected.includes(format.key);
              return (
                <button
                  key={format.key}
                  onClick={() => toggleFormat(format.key)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    active
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {format.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tone</div>
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border p-1 bg-background">
            {TONES.map((currentTone) => (
              <button
                key={currentTone}
                onClick={() => setTone(currentTone)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  tone === currentTone ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {currentTone}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-orange"
        >
          {loading ? "Ruoming..." : (
            <>
              Ruom It <ArrowUpRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {(loading || outputs || error) && (
        <div className="mt-8" aria-live="polite">
          {error && !loading && !outputs && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {error.startsWith("Add a bit more substance") || error.startsWith("That's a lot") || error.startsWith("Select at least one")
                      ? "Almost there"
                      : "The AI engine is unreachable"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{error}</p>
                </div>
              </div>
              {!error.startsWith("Add a bit more substance") && !error.startsWith("That's a lot") && !error.startsWith("Select at least one") && (
                <Button size="sm" variant="outline" onClick={generate} className="gap-1.5 shrink-0 border-primary/40 hover:bg-primary/10 hover:text-primary">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              )}
            </motion.div>
          )}

          {loading && (
            <div className="space-y-3">
              {selected.map((format) => (
                <SkeletonCard key={format} />
              ))}
            </div>
          )}

          {outputs && !loading && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">Your repurposed content</span>
              </div>
              <div className="space-y-3">
                {Object.entries(outputs).map(([key, value]) => renderOutput(key, value))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
