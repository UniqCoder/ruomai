import OpenAI from 'openai';
import { BuiltContextPayload } from './context-builder';
import { ViviMood } from '../types/personality';

export interface LLMStreamOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  mood: ViviMood;
  emoji: string;
}

// Verified live active OpenRouter free model slugs
export const OPENROUTER_FREE_MODELS = [
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'liquid/lfm-2.5-2.6b:free',
  'cohere/north-mini-code:free',
];

export async function executeLLMStream(
  payload: BuiltContextPayload,
  options: LLMStreamOptions
): Promise<Response> {
  const rawKey = (options.apiKey || process.env.OPENAI_API_KEY || '').trim();
  let rawBaseUrl = (options.baseUrl || process.env.OPENAI_BASE_URL || '').trim();
  let model = (options.model || process.env.OPENAI_MODEL || '').trim();

  let defaultHeaders: Record<string, string> = {};

  // Smart Provider Auto-Detection
  if (rawKey.startsWith('sk-or-v1-') || rawBaseUrl.includes('openrouter.ai')) {
    // OpenRouter Provider Configuration
    if (!rawBaseUrl) rawBaseUrl = 'https://openrouter.ai/api/v1';
    if (!model || model === 'gpt-4o' || model.includes('3.2-3b') || model.includes('gemma-2') || model.includes('3.3-70b')) {
      model = 'openai/gpt-oss-20b:free';
    }
    defaultHeaders = {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Vivi AI Companion',
    };
  } else if (rawKey.startsWith('gsk_') || rawBaseUrl.includes('groq.com')) {
    // Groq Provider Configuration
    if (!rawBaseUrl) rawBaseUrl = 'https://api.groq.com/openai/v1';
    if (!model || model === 'gpt-4o') model = 'llama-3.3-70b-versatile';
  } else {
    // Standard OpenAI Configuration
    if (!model) model = 'gpt-4o';
  }

  const isRealKey = rawKey.length > 5 && !rawKey.startsWith('sk-proj-your');
  const isCustomEndpoint = rawBaseUrl.length > 5;

  if (isRealKey || isCustomEndpoint) {
    // Build priority list of models to try
    const modelsToTry = [model];
    if (rawBaseUrl.includes('openrouter.ai')) {
      OPENROUTER_FREE_MODELS.forEach((m) => {
        if (!modelsToTry.includes(m)) modelsToTry.push(m);
      });
    }

    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      try {
        console.log(`[AI Brain] Attempting API call to ${rawBaseUrl || 'OpenAI'} with model "${currentModel}"...`);
        const openai = new OpenAI({
          apiKey: rawKey || 'ollama-local',
          baseURL: rawBaseUrl || undefined,
          defaultHeaders: Object.keys(defaultHeaders).length > 0 ? defaultHeaders : undefined,
        });

        const response = await openai.chat.completions.create({
          model: currentModel,
          messages: payload.apiMessages,
          temperature: options.mood === 'pouty' ? 0.4 : 0.8,
          max_tokens: 500,
          stream: true,
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            // Send mood metadata header frame first
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ mood: options.mood, emoji: options.emoji, liveAI: true, modelUsed: currentModel })}\n\n`
              )
            );

            for await (const chunk of response) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (err: any) {
        lastError = err;
        console.warn(`Model "${currentModel}" returned error:`, err?.message || err);
      }
    }

    // If all model attempts failed, stream clear error notification
    const errorMessage = lastError?.message || 'Invalid API Key or Provider Endpoint';
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ mood: options.mood, emoji: options.emoji, liveAI: false, error: errorMessage })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: `⚠️ OpenRouter API Error: ${errorMessage}. Try selecting 'openai/gpt-oss-20b:free' in Settings.` })}\n\n`
          )
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Fallback Engine Stream
  const lastUserMsg = payload.apiMessages[payload.apiMessages.length - 1]?.content || '';
  const fallbackText = generateFallbackResponse(lastUserMsg, options.mood);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ mood: options.mood, emoji: options.emoji, liveAI: false })}\n\n`
        )
      );

      const tokens = fallbackText.split(' ');
      for (let i = 0; i < tokens.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + tokens[i];
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        await new Promise((res) => setTimeout(res, 30 + Math.random() * 30));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function generateFallbackResponse(userMsg: string, mood: ViviMood): string {
  const lower = userMsg.toLowerCase().trim();
  const isGerman = /[äöüß]|wie|was|bist|hast|wer|warum|und|ich|du|hallo|danke/i.test(userMsg);

  if (mood === 'pouty') {
    return isGerman ? 'ok. wenn du meinst 🙄' : 'ok. if you say so 🙄';
  }
  if (mood === 'excited') {
    return isGerman
      ? 'OH JA! 🏊‍♀️ 100% bahnen ziehen & sauna 🧖‍♀️! ab wann hast du zeit?'
      : 'OH YES! 🏊‍♀️ 100% pool & sauna 🧖‍♀️! when are you free?';
  }
  if (mood === 'empathetic') {
    return isGerman
      ? 'ey, tief durchatmen 🥺 du machst das super. sag mir kurz was dich am meisten stresst ❤️'
      : 'hey, deep breath 🥺 you\'re doing great. tell me what\'s weighing on you ❤️';
  }
  return isGerman
    ? 'ach so! ja voll, sehe ich genauso. hast du das heute schon ausprobiert? ☕️'
    : 'oh totally, i get what you mean! how are you planning to tackle it? ☕️';
}
