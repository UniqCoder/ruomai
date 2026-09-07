const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

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
const aiTimeoutMs = 30000;
const aiRetries = 1;

const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: jsonHeaders });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRetryable = (status: number) =>
  status === 429 || (status >= 500 && status < 600);

// ─── Input validation ────────────────────────────────────────────────────────
const validateContent = (content: string): string | null => {
  const trimmed = content.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (trimmed.length < minContentChars || words.length < minContentWords) {
    return `Add a bit more substance — paste at least a short paragraph (${minContentChars}+ characters) so the AI has real material to work with.`;
  }
  if (trimmed.length > maxContentChars) {
    return `That's a lot! Trim it under ${maxContentChars} characters.`;
  }
  return null;
};

// ─── JSON extractor ───────────────────────────────────────────────────────────
const extractJson = (text: string): string | null => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1).trim();
  return null;
};

// ─── Output normalizer ────────────────────────────────────────────────────────
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

// ─── Fetch with retry ─────────────────────────────────────────────────────────
const fetchWithRetry = async (url: string, options: RequestInit) => {
  let lastErr: unknown;
  for (let i = 0; i <= aiRetries; i++) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), aiTimeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok || !isRetryable(res.status) || i === aiRetries) return res;
    } catch (e) {
      clearTimeout(tid);
      lastErr = e;
      if (i === aiRetries) throw e;
    }
    await sleep(400 * 2 ** i);
  }
  throw lastErr ?? new Error("Unknown fetch error");
};

// ─── Prompt builder ───────────────────────────────────────────────────────────
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

// ─── Providers ────────────────────────────────────────────────────────────────
type Provider = {
  name: "xai" | "gemini";
  key: string;
  models: string[];
};

// free-tier Gemini hits intermittent 503/high-demand windows — the caller
// walks this chain (and retries it) until a model answers
const GEMINI_MODEL_CHAIN = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
];

const resolveProviders = (): Provider[] => {
  const providers: Provider[] = [];
  const xaiKey = Deno.env.get("XAI_API_KEY");
  if (xaiKey) {
    providers.push({
      name: "xai",
      key: xaiKey,
      models: [Deno.env.get("XAI_MODEL") ?? "grok-3-mini"],
    });
  }
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey) {
    providers.push({
      name: "gemini",
      key: geminiKey,
      models: Deno.env.get("GEMINI_MODEL") ? [Deno.env.get("GEMINI_MODEL")!] : GEMINI_MODEL_CHAIN,
    });
  }
  return providers;
};

const callXAI = async (
  provider: Provider,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> => {
  const res = await fetchWithRetry("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.models[0],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("xAI error", res.status, errText.slice(0, 500));
    if (res.status === 401 || res.status === 403) {
      throw new Error("xAI key rejected");
    }
    if (res.status === 429) {
      throw new Error("xAI rate limited");
    }
    throw new Error(`xAI error ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("xAI returned no content");
  return text as string;
};

const callGemini = async (
  provider: Provider,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> => {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let lastError: unknown = null;

  // walk the model chain, then retry the whole chain once on high-demand 503s
  for (let round = 0; round < 2; round++) {
    if (round > 0) await sleep(1500);
    for (const model of provider.models) {
      try {
        const res = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 3000,
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error("Gemini error", model, res.status, errText.slice(0, 300));
          lastError = new Error(`Gemini error ${res.status}`);
          if (res.status === 503 || res.status === 429 || res.status >= 500) continue;
          throw lastError;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastError = new Error("Gemini returned no content");
          continue;
        }
        return text as string;
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("Gemini error 4")) throw e;
        lastError = e;
        console.error("model attempt failed:", model, e instanceof Error ? e.message : e);
      }
    }
  }

  throw lastError ?? new Error("Gemini unavailable");
};

const generateWithProvider = async (
  provider: Provider,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> =>
  provider.name === "xai"
    ? callXAI(provider, systemPrompt, userPrompt)
    : callGemini(provider, systemPrompt, userPrompt);

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "Method not allowed." }, 405);

  const requestId = crypto.randomUUID();

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body.", requestId }, 400);
  }

  if (!payload || typeof payload !== "object")
    return jsonResponse({ error: "Invalid request payload.", requestId }, 400);

  const { content, tone, language, formats } = payload as Record<string, unknown>;

  if (!content || typeof content !== "string")
    return jsonResponse({ error: "Please provide content.", requestId }, 400);

  const validationError = validateContent(content);
  if (validationError)
    return jsonResponse({ error: validationError, code: "content_too_short", requestId }, 400);

  const trimmed = content.trim();

  const requestedFormats = Array.isArray(formats)
    ? (formats as string[]).filter((f) => allowedFormats.has(f))
    : [...allowedFormats];

  if (!requestedFormats.length)
    return jsonResponse({ error: "No valid formats requested.", requestId }, 400);

  const providers = resolveProviders();
  if (!providers.length) {
    console.error("No AI provider configured: set XAI_API_KEY or GEMINI_API_KEY");
    return jsonResponse(
      { error: "The AI engine is not configured yet. Please try again shortly.", requestId },
      503,
    );
  }

  const safeTone =
    typeof tone === "string" && tone.trim() ? tone.trim() : "Professional";

  const langLabel =
    language === "HI"
      ? "Hinglish (natural Hindi-English mix, conversational)"
      : "English (conversational)";

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(trimmed, safeTone, langLabel, requestedFormats);

  const providerErrors: string[] = [];

  for (const provider of providers) {
    try {
      const generatedText = await generateWithProvider(provider, systemPrompt, userPrompt);

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(generatedText);
      } catch {
        const extracted = extractJson(generatedText);
        if (!extracted) {
          console.error("Raw AI output (unparseable):", generatedText.slice(0, 300));
          throw new Error("AI returned non-JSON response");
        }
        try {
          parsed = JSON.parse(extracted);
        } catch {
          console.error("Extracted JSON still invalid:", extracted.slice(0, 300));
          throw new Error("AI returned malformed JSON");
        }
      }

      const normalized = normalize(parsed);
      if (!Object.keys(normalized).length)
        throw new Error("AI response missing expected format keys");

      const filtered: Record<string, unknown> = {};
      for (const key of requestedFormats) {
        if (key in normalized) filtered[key] = normalized[key];
      }

      return jsonResponse(
        { outputs: Object.keys(filtered).length ? filtered : normalized, requestId },
        200,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      providerErrors.push(`${provider.name}: ${msg}`);
      console.error(`provider ${provider.name} failed:`, msg);
    }
  }

  return jsonResponse(
    { error: "The AI engine is unreachable right now. Please try again in a moment.", requestId },
    502,
  );
});
