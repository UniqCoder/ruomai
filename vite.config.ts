import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const allowedFormats = new Set([
  "tweet_thread",
  "linkedin_post",
  "reel_script",
  "newsletter_intro",
  "whatsapp_broadcast",
]);

const maxContentChars = 12000;
const minContentChars = 60;
const minContentWords = 12;
const aiTimeoutMs = 15000;
const totalBudgetMs = 180000;

// Keep in sync with supabase/functions/repurpose/index.ts — this dev proxy
// exists so the core flow works on localhost while the edge function /
// project access is sorted out. The key never leaves the server process.
const buildSystemPrompt = () => `
You are RUOM AI — a world-class content repurposing engine for Indian creators, coaches, founders and D2C brands. You write like a power user of each platform, never like an AI converting content.

FOLLOW THE USER'S INSTRUCTIONS (TOP PRIORITY):
- The INPUT CONTENT may contain direct instructions about tone, length, style, angle, audience, structure, hashtags, or what to include/avoid
- Those instructions override everything below. Execute them exactly. Never mention or explain them in the output
- Use only the names, numbers, results, mistakes and stories from the input. Never invent facts. Vague = worthless

CRAFT:
- First lines decide everything — curiosity gap, tension, contrarian take, or the single most surprising specific
- Human, direct voice. Punchy short sentences with rhythm. Zero corporate filler and zero AI clichés ("in today's world", "game-changer", "unlock", "delve", "landscape")

PLATFORM PLAYBOOK — how the best creators actually post:

X / TWEET THREAD:
- Tweet 1 is the whole ballgame: under 280 chars, one big claim or curiosity gap, line breaks for rhythm. A weak first tweet kills the thread
- NEVER number tweets (no "1/5", "2/5") — the platform numbers them natively
- One idea per tweet. Fragments allowed. White space is a weapon
- Middle tweets escalate: insight → proof (the real numbers) → twist
- Final tweet: takeaway + soft CTA. Hashtags look desperate on X — 0-2 max
- Emoji: minimal, only when it lands a punch

LINKEDIN POST:
- Only the first ~2 lines show before "...more" — open mid-story or with a counterintuitive line
- Paragraphs of 1-2 lines max, generous white space, no walls of text
- Arc: story → struggle → lesson → max 3 punchy bullets → genuine question
- 3-5 niche hashtags at the very end only, never inline. No links in the body

REEL SCRIPT:
- [HOOK 0-3s]: pattern interrupt + on-screen text (under 6 words) + spoken hook. NEVER "hey guys" or intros
- [PROBLEM 3-10s]: name the exact pain the viewer feels. Cut every 2-3 seconds
- [SOLUTION 10-22s]: the specific method, show don't tell
- [CTA 22-30s]: ONE action ("save this", "comment X"). Hard cut, no fade
- Write spoken lines exactly as they'd be spoken — conversational, not essay prose

NEWSLETTER INTRO:
- Drop the reader into a moment, never a summary. Curiosity gap by line 2
- One unresolved tension, under 200 words, personal voice
- End exactly where the value tease peaks

WHATSAPP BROADCAST:
- Reads like a personal message to ONE person, not an announcement
- One emoji max in the opener, under 130 words, one idea only
- Close with a human reply trigger ("reply 1 if you want the template")

LANGUAGE:
- EN: conversational English with an Indian creator's voice
- HI: natural Hinglish ("Bhai, ye try karo") — never textbook Hindi

You MUST return only valid JSON. No markdown. No explanation. No extra keys.
`.trim();

const buildUserPrompt = (
  content: string,
  tone: string,
  langLabel: string,
  formats: string[],
) => `
INPUT CONTENT (source material, and possibly the user's own instructions — follow any you find):
"""
${content}
"""

Selected tone: ${tone}
Language: ${langLabel}
Generate these formats: ${formats.join(", ")}

Return ONLY this JSON structure, no other text:

{
  "tweet_thread": ["hook tweet under 280 chars", "one idea per tweet, escalating", "proof using the real numbers", "twist or deeper insight", "takeaway + soft CTA (0-2 hashtags max)"],
  "linkedin_post": "Opening line that stops scrolling\\n\\nShort paragraph.\\n\\n- Bullet 1\\n- Bullet 2\\n- Bullet 3\\n\\nClosing question?\\n\\n#hashtag1 #hashtag2 #hashtag3",
  "reel_script": "[HOOK 0-3s]: Visual cue + spoken line\\n\\n[PROBLEM 3-10s]: Pain point\\n\\n[SOLUTION 10-22s]: Insight\\n\\n[CTA 22-30s]: Single action",
  "newsletter_intro": "Scene-setting opening line.\\n\\nCuriosity gap.\\n\\nValue tease.",
  "whatsapp_broadcast": "👋 One line hook\\n\\nKey idea in 2-3 sentences.\\n\\nReply question?"
}

Only include keys for the requested formats: ${formats.join(", ")}
`.trim();

const extractJson = (text: string): string | null => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1).trim();
  return null;
};

const normalize = (raw: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  if (Array.isArray(raw.tweet_thread))
    out.tweet_thread = raw.tweet_thread.filter((t) => typeof t === "string");
  else if (typeof raw.tweet_thread === "string")
    out.tweet_thread = [raw.tweet_thread];

  for (const k of [
    "linkedin_post",
    "reel_script",
    "newsletter_intro",
    "whatsapp_broadcast",
  ] as const) {
    if (typeof raw[k] === "string") out[k] = raw[k];
  }
  return out;
};

const sendJson = (res: import("http").ServerResponse, payload: Record<string, unknown>, status = 200) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

function repurposeAiProxy(geminiKey: string | undefined, geminiModels: string[]): Plugin {
  return {
    name: "repurpose-ai-proxy",
    configureServer(server) {
      if (!geminiKey || !geminiModels.length) {
        console.warn("[ai-proxy] GEMINI_API_KEY not set — /api/repurpose disabled");
        return;
      }
      server.middlewares.use("/api/repurpose", async (req, res) => {
        let raw = "";
        for await (const chunk of req) raw += chunk;
        let body: Record<string, unknown>;
        try {
          body = JSON.parse(raw || "{}");
        } catch {
          return sendJson(res, { error: "Invalid JSON body." }, 400);
        }

        const content = typeof body.content === "string" ? body.content.trim() : "";
        const words = content.split(/\s+/).filter(Boolean);
        if (content.length < minContentChars || words.length < minContentWords) {
          return sendJson(res, { error: `Add a bit more substance — paste at least a short paragraph (${minContentChars}+ characters) so the AI has real material to work with.`, code: "content_too_short" }, 400);
        }
        if (content.length > maxContentChars) {
          return sendJson(res, { error: `That's a lot! Trim it under ${maxContentChars} characters.` }, 400);
        }

        const formats = Array.isArray(body.formats)
          ? (body.formats as string[]).filter((f) => allowedFormats.has(f))
          : [...allowedFormats];
        if (!formats.length) return sendJson(res, { error: "No valid formats requested." }, 400);

        const tone = typeof body.tone === "string" && body.tone.trim() ? body.tone.trim() : "Professional";
        const langLabel = body.language === "HI" ? "Hinglish (natural Hindi-English mix, conversational)" : "English (conversational)";

        try {
          const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
          // free-tier Gemini has intermittent 429/503/high-demand windows: run
          // each format as its own request, walking the model chain once — the
          // sequential retry pass below gives failed formats another chance
          const startedAt = Date.now();
          const generateText = async (userPrompt: string): Promise<string> => {
            let lastError: unknown = null;
            for (const model of geminiModels) {
              try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), aiTimeoutMs);
                const gres = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
                    signal: ctrl.signal,
                    body: JSON.stringify({
                      systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
                      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                      generationConfig: { temperature: 0.75, maxOutputTokens: 1200, responseMimeType: "application/json" },
                    }),
                  },
                );
                clearTimeout(tid);

                if (!gres.ok) {
                  const errText = await gres.text();
                  console.error("[ai-proxy] Gemini error", model, gres.status, errText.slice(0, 150));
                  lastError = new Error(`Gemini error ${gres.status}`);
                  if (gres.status === 429 || gres.status >= 500) continue;
                  throw new Error(`Gemini error ${gres.status}`);
                }

                const data = (await gres.json()) as {
                  candidates?: { content?: { parts?: { text?: string }[] } }[];
                };
                const parts = data?.candidates?.[0]?.content?.parts;
                const text = parts?.map((p) => p?.text ?? "").filter(Boolean).join("");
                if (!text) {
                  // 200 but no usable text (safety block / empty candidates)
                  console.error("[ai-proxy] no text in response:", model, JSON.stringify(data).slice(0, 200));
                  lastError = new Error("Gemini returned no content");
                  continue;
                }
                return text;
              } catch (modelError) {
                lastError = modelError;
                console.error("[ai-proxy] attempt failed:", model, modelError instanceof Error ? modelError.message : modelError);
              }
            }
            throw lastError ?? new Error("Gemini unavailable");
          };

          const outputs: Record<string, unknown> = {};
          const failedFormats: string[] = [];
          const settled: { status: "fulfilled" | "rejected"; value?: readonly [string, unknown]; reason?: unknown }[] = [];
          // free-tier RPM quota is per-KEY — firing requests in parallel burns
          // it instantly, so run formats sequentially with breathing room
          for (const fmt of formats) {
            if (Date.now() - startedAt > totalBudgetMs) {
              failedFormats.push(fmt);
              continue;
            }
            try {
              const userPrompt = buildUserPrompt(content, tone, langLabel, [fmt]);
              const text = await generateText(userPrompt);
              let parsed: Record<string, unknown>;
              try {
                parsed = JSON.parse(text);
              } catch {
                const extracted = extractJson(text);
                if (!extracted) throw new Error("AI returned non-JSON response");
                parsed = JSON.parse(extracted);
              }
              const normalized = normalize(parsed);
              if (!(fmt in normalized)) throw new Error("missing format key");
              settled.push({ status: "fulfilled", value: [fmt, normalized[fmt]] as const });
            } catch (e) {
              settled.push({ status: "rejected", reason: e instanceof Error ? e : new Error(String(e)) });
            }
            await sleep(800);
          }

          for (let i = 0; i < formats.length; i++) {
            const r = settled[i];
            if (r.status === "fulfilled" && r.value) outputs[formats[i]] = r.value[1];
            else {
              failedFormats.push(formats[i]);
              console.error("[ai-proxy] format failed:", formats[i], r.reason instanceof Error ? r.reason.message : r.reason);
            }
          }

          // the parallel burst can trip free-tier rate limits — retry the
          // missing formats sequentially, spaced out
          for (const fmt of [...failedFormats]) {
            for (let attempt = 0; attempt < 2; attempt++) {
              await sleep(1500);
              try {
                const userPrompt = buildUserPrompt(content, tone, langLabel, [fmt]);
                const text = await generateText(userPrompt);
                let parsed: Record<string, unknown>;
                try {
                  parsed = JSON.parse(text);
                } catch {
                  const extracted = extractJson(text);
                  if (!extracted) throw new Error("AI returned non-JSON response");
                  parsed = JSON.parse(extracted);
                }
                const normalized = normalize(parsed);
                if (!(fmt in normalized)) throw new Error("missing format key");
                outputs[fmt] = normalized[fmt];
                failedFormats.splice(failedFormats.indexOf(fmt), 1);
                break;
              } catch (e) {
                console.error("[ai-proxy] retry failed:", fmt, "attempt", attempt + 1, e instanceof Error ? e.message : e);
              }
            }
          }

          if (!Object.keys(outputs).length) {
            console.error("[ai-proxy] all formats failed");
            return sendJson(res, { error: "The AI engine is busy right now. Please try again in a moment." }, 503);
          }
          return sendJson(res, { outputs, ...(failedFormats.length ? { failedFormats } : {}) });
        } catch (e) {
          console.error("[ai-proxy] failed:", e instanceof Error ? e.message : e);
          return sendJson(res, { error: "The AI engine is unreachable right now. Please try again in a moment." }, 502);
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // third arg "" loads every var in .env/.env.local, not just VITE_*
  const env = loadEnv(mode, process.cwd(), "");
  const geminiKey = env.GEMINI_API_KEY;
  const geminiModels = env.GEMINI_MODEL
    ? [env.GEMINI_MODEL]
    : ["gemini-3.6-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      repurposeAiProxy(geminiKey, geminiModels),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
