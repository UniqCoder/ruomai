import OpenAI from 'openai';
import { PersonalityProfile, ViviMood } from '../types/personality';

export interface PhotoStreamOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  mood: ViviMood;
  emoji: string;
  profile: PersonalityProfile;
  userLanguage?: string;
}

const SEND_COMMAND_PATTERN = /^(?:\/)?send(?:\s*:)?\s+([\s\S]+)$/i;

export function extractPhotoRequest(message: string): string | null {
  const match = message.trim().match(SEND_COMMAND_PATTERN);
  return match ? match[1].trim() : null;
}

function buildPhotoPrompt(
  description: string,
  profile: PersonalityProfile,
  mood: ViviMood,
  emoji: string,
  userLanguage?: string
): string {
  const styleHints = [
    'photorealistic casual selfie',
    'soft natural light',
    `warm ${profile.interests.favorite_color} accents`,
    'realistic smartphone photo',
    'intimate close-friend vibe',
    'clean background, no text, no watermark',
  ];

  const languageHint = userLanguage ? `Match the vibe of a ${userLanguage} text request.` : '';

  return [
    `Create a photorealistic image of Vivi, a young German woman with a warm, playful, INFJ vibe.`,
    `Mood: ${mood}. Emoji cue: ${emoji.trim()}`,
    `Style hints: ${styleHints.join(', ')}.`,
    `User request: ${description}.`,
    languageHint,
    'Keep the subject centered and the result looks like a real photo received from a close friend.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildErrorStream(message: string, mood: ViviMood, emoji: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ mode: 'image', liveAI: false, mood, emoji, error: message })}\n\n`)
      );
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: message })}\n\n`));
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

export async function executePhotoStream(description: string, options: PhotoStreamOptions): Promise<Response> {
  const rawKey = (options.apiKey || process.env.OPENAI_API_KEY || '').trim();
  const rawBaseUrl = (options.baseUrl || process.env.OPENAI_BASE_URL || '').trim();
  const requestedModelInput = (options.model || '').trim();
  const requestedModel =
    requestedModelInput && /gpt-image|dall-e|chatgpt-image/i.test(requestedModelInput)
      ? requestedModelInput
      : (process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1').trim();

  if (!rawKey && !rawBaseUrl) {
    return buildErrorStream('Photo sending needs a live AI provider key or endpoint.', options.mood, options.emoji);
  }

  if (rawBaseUrl.includes('openrouter.ai') || rawBaseUrl.includes('groq.com')) {
    return buildErrorStream(
      'This provider does not support image generation here. Switch to an OpenAI image endpoint.',
      options.mood,
      options.emoji
    );
  }

  const openai = new OpenAI({
    apiKey: rawKey || 'ollama-local',
    baseURL: rawBaseUrl || undefined,
  });

  const prompt = buildPhotoPrompt(description, options.profile, options.mood, options.emoji, options.userLanguage);

  try {
    const response = await openai.images.generate({
      model: requestedModel,
      prompt,
      response_format: 'b64_json',
      size: '1024x1024',
    });

    const image = response.data?.[0];
    const imageDataUrl = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url;

    if (!imageDataUrl) {
      return buildErrorStream('Photo generation returned no image data.', options.mood, options.emoji);
    }

    const caption = `here you go 🤍`;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              mode: 'image',
              liveAI: true,
              mood: options.mood,
              emoji: options.emoji,
              modelUsed: requestedModel,
              caption,
            })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              imageDataUrl,
              imageAlt: description,
              imagePrompt: prompt,
            })}\n\n`
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
  } catch (error: any) {
    return buildErrorStream(error?.message || 'Photo generation failed.', options.mood, options.emoji);
  }
}
