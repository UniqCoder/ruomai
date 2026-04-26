const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { content, tone, language, formats } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Please provide content (min 5 chars)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const langLabel = language === "HI" ? "Hindi (natural Hinglish, not formal)" : "English";

    const systemPrompt = `You are a content repurposing expert for Indian creators and coaches. Write like a real human creator, not a corporate marketer. Use simple conversational language. For Hindi output use natural Hinglish where appropriate — not formal textbook Hindi.`;

    const userPrompt = `User content:\n${content}\n\nTone: ${tone}\nOutput language: ${langLabel}\n\nGenerate repurposed content in ALL these formats. Return ONLY valid JSON:

{
  "tweet_thread": ["tweet 1", "tweet 2", "tweet 3", "tweet 4", "tweet 5"],
  "linkedin_post": "full linkedin post text",
  "reel_script": "30-second script with hook, body, CTA",
  "newsletter_intro": "newsletter opening paragraph",
  "whatsapp_broadcast": "short message under 200 words"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) throw new Error("No content generated");
    
    // Parse the JSON response
    let args: any;
    try {
      // Gemini might wrap JSON in markdown code blocks, clean it up
      const cleanJson = generatedText.replace(/```json\n?|\n?```/g, "").trim();
      args = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Gemini response:", generatedText);
      throw new Error("Invalid response format from AI");
    }

    // Filter to selected formats
    const selected = Array.isArray(formats) && formats.length ? formats : Object.keys(args);
    const filtered: Record<string, unknown> = {};
    for (const k of selected) if (k in args) filtered[k] = args[k];

    return new Response(JSON.stringify({ outputs: filtered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("repurpose error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
