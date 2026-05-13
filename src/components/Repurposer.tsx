import { useState, useEffect } from "react";
import { ArrowUpRight, Sparkles, Eye, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { OutputCard, SkeletonCard } from "@/components/OutputCard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { PlatformPreview } from "@/components/PlatformPreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FORMATS = [
  { key: "tweet_thread", label: "Tweet thread" },
  { key: "linkedin_post", label: "LinkedIn post" },
  { key: "reel_script", label: "Reel script" },
  { key: "newsletter_intro", label: "Newsletter intro" },
  { key: "whatsapp_broadcast", label: "WhatsApp broadcast" },
] as const;

const TONES = ["Professional", "Casual", "Witty", "Inspirational"] as const;

const FREE_LIMIT = 5;

interface UserPreferences {
  preferred_tone: string;
  preferred_language: "EN" | "HI";
  preferred_formats: string[];
}

export const Repurposer = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [content, setContent] = useState("");
  const [tone, setTone] = useState<string>("Casual");
  const [language, setLanguage] = useState<"EN" | "HI">("EN");
  const [selected, setSelected] = useState<string[]>(FORMATS.map((f) => f.key));
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, any> | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [overLimit, setOverLimit] = useState(false);
  const [usesRemaining, setUsesRemaining] = useState(FREE_LIMIT);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [viewMode, setViewMode] = useState<"raw" | "preview">("preview");
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Fetch usage and preferences from database on mount
  useEffect(() => {
    if (user) {
      fetchUsage();
      fetchUserPreferences();
    } else {
      setUsesRemaining(FREE_LIMIT);
      setLoadingUsage(false);
    }
  }, [user]);

  const fetchUsage = async () => {
    try {
      const { data: usage } = await supabase
        .rpc('get_current_month_usage' as any, { p_user_id: user?.id });
      const count = usage || 0;
      setUsesRemaining(Math.max(0, FREE_LIMIT - count));
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const { data: prefs } = await supabase
        .from('user_preferences' as any)
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (prefs) {
        // Apply saved preferences
        if (prefs.preferred_tone) setTone(prefs.preferred_tone);
        if (prefs.preferred_language) setLanguage(prefs.preferred_language);
        if (prefs.preferred_formats?.length > 0) setSelected(prefs.preferred_formats);
        toast.success("Loaded your brand voice preferences!", { duration: 2000 });
      }
    } catch (error) {
      // No preferences saved yet, use defaults
      console.log('No preferences found');
    }
  };

  const saveUserPreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);
    try {
      await (supabase.from('user_preferences' as any) as any)
        .upsert({
          user_id: user.id,
          preferred_tone: tone,
          preferred_language: language,
          preferred_formats: selected,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      toast.success("Brand voice saved! We'll remember your style.", { duration: 3000 });
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSavingPrefs(false);
    }
  };

  const toggleFormat = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleSubmit = async () => {
    if (authLoading) {
      return;
    }
    if (!user) {
      navigate("/signup");
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      toast.error("Paste some content first (at least 5 characters)");
      return;
    }
    if (selected.length === 0) {
      toast.error("Select at least one output format");
      return;
    }

    // Check usage limit
    if (usesRemaining <= 0) {
      setOverLimit(true);
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setOutputs(null);
    try {
      const { data, error } = await supabase.functions.invoke("repurpose", {
        body: { content, tone, language, formats: selected },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setOutputs((data as any).outputs);

      // Increment usage in database
      if (user) {
        await supabase.rpc('increment_usage' as any, { p_user_id: user.id });

        // Save to usage history
        await (supabase.from('usage_history' as any) as any).insert({
          user_id: user.id,
          input_content: content,
          tone,
          language,
          outputs: (data as any).outputs,
        });
      }

      // Update local state
      setUsesRemaining((prev) => Math.max(0, prev - 1));
      
      // Auto-save preferences after successful repurpose
      if (user) {
        saveUserPreferences();
      }
      
      if (usesRemaining - 1 === 0) {
        toast.success("That was your last free repurpose! Upgrade for unlimited.");
        setOverLimit(true);
      } else {
        toast.success(`${usesRemaining - 1} free ${usesRemaining - 1 === 1 ? 'repurpose' : 'repurposes'} remaining`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderOutput = (key: string, value: any) => {
    const label = FORMATS.find((f) => f.key === key)?.label || key;
    const text = Array.isArray(value) ? value.map((t, i) => `${i + 1}. ${t}`).join("\n\n") : String(value);
    return <OutputCard key={key} label={label} text={text} blurred={overLimit} />;
  };

  return (
    <section className="container max-w-3xl py-12 md:py-20">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          One piece of content.
          <br />
          <span className="text-primary">Ruom it everywhere.</span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
          Paste anything. Get tweets, reels, LinkedIn posts and more in 10 seconds.
        </p>
      </div>

      {/* Uses remaining badge */}
      <div className="flex justify-center mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          usesRemaining === 0 
            ? "bg-destructive/10 text-destructive border border-destructive/20" 
            : usesRemaining <= 2 
              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
              : "bg-primary/10 text-primary border border-primary/20"
        }`}>
          <span>{usesRemaining === 0 ? "No free uses left" : `${usesRemaining} free ${usesRemaining === 1 ? 'use' : 'uses'} remaining`}</span>
          {usesRemaining === 0 && <span className="text-[10px] opacity-75">— Upgrade to continue</span>}
        </div>
      </div>

      {/* Input area */}
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
          placeholder="Paste your blog post, YouTube transcript, podcast notes, or raw idea here..."
          className="min-h-[180px] resize-y bg-background border-border text-base focus-visible:ring-primary"
        />

        {/* Format chips */}
        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Output formats</div>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => {
              const active = selected.includes(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFormat(f.key)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    active
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone selector */}
        <div className="mt-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tone</div>
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border p-1 bg-background">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  tone === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-orange"
        >
          {loading ? "Ruoming..." : (<>Ruom It <ArrowUpRight className="ml-1 h-4 w-4" /></>)}
        </Button>
      </div>

      {/* Results */}
      {(loading || outputs) && (
        <div className="mt-8">
          {loading && (
            <div className="space-y-3">
              {selected.map((k) => <SkeletonCard key={k} />)}
            </div>
          )}
          
          {outputs && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "raw" | "preview")} className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Your repurposed content</span>
                </div>
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="preview" className="flex items-center gap-1.5 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="flex items-center gap-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    Raw
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="raw" className="space-y-3">
                {Object.entries(outputs).map(([k, v]) => renderOutput(k, v))}
              </TabsContent>
              
              <TabsContent value="preview">
                <PlatformPreview 
                  content={Object.values(outputs).join('\n\n')} 
                  userName={user?.user_metadata?.full_name || 'You'}
                  userHandle={user?.email?.split('@')[0] || 'creator'}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </section>
  );
};
