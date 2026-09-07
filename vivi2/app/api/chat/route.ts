import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processPersona } from '@/lib/ai/persona-engine';
import { processMemories } from '@/lib/ai/memory-engine';
import { processHistory } from '@/lib/ai/history-engine';
import { buildUnifiedContext } from '@/lib/ai/context-builder';
import { executeLLMStream } from '@/lib/ai/llm-client';
import { executePhotoStream, extractPhotoRequest } from '@/lib/ai/photo-client';
import { INITIAL_PERSONALITY, INITIAL_MEMORIES } from '@/lib/mock-data';

// Zod Input Validation Schema
const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      sender: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string().optional(),
    })
  ).min(1, 'Messages array cannot be empty'),
  personalityProfile: z.any().optional(),
  memoriesList: z.array(z.any()).optional(),
  userLanguage: z.string().optional(),
  customApiKey: z.string().optional(),
  customBaseUrl: z.string().optional(),
  customModel: z.string().optional(),
});

/**
 * CHAT API / BRAIN ENTRY ORCHESTRATOR
 * Pipeline Flow:
 * Frontend -> Chat API -> Validation -> (Persona Engine + Memory Engine + History Engine) -> Context Builder -> LLM Client -> Response Stream -> Frontend
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = ChatRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const {
      messages,
      personalityProfile,
      memoriesList,
      userLanguage,
      customApiKey,
      customBaseUrl,
      customModel,
    } = parseResult.data;

    const currentProfile = personalityProfile || INITIAL_PERSONALITY;
    const currentMemories = memoriesList || INITIAL_MEMORIES;

    const userMessage = messages[messages.length - 1]?.content || '';
    const photoRequest = extractPhotoRequest(userMessage);

    // 1. PERSONA ENGINE (Resolves INFJ traits, dynamic mood, language behavior)
    const personaResult = processPersona(userMessage, currentProfile, messages);

    // 2. MEMORY ENGINE (Retrieves semantic vector memories)
    const memoryResult = await processMemories(userMessage, currentMemories);

    // 3. CONVERSATION HISTORY ENGINE (Sliding window short-term thread)
    const historyResult = processHistory(messages as any[], 10);

    // 4. CONTEXT BUILDER (Merges Persona + Memory + History into unified prompt)
    const contextPayload = buildUnifiedContext(personaResult, memoryResult, historyResult);

    if (photoRequest) {
      return await executePhotoStream(photoRequest, {
        apiKey: customApiKey,
        baseUrl: customBaseUrl,
        model: customModel,
        mood: personaResult.activeMood,
        emoji: personaResult.moodAnalysis.emoji,
        profile: currentProfile,
        userLanguage,
      });
    }

    // 5. LLM API CLIENT & RESPONSE STREAM
    return await executeLLMStream(contextPayload, {
      apiKey: customApiKey,
      baseUrl: customBaseUrl,
      model: customModel,
      mood: personaResult.activeMood,
      emoji: personaResult.moodAnalysis.emoji,
    });
  } catch (error) {
    console.error('API /chat brain error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat brain pipeline.' },
      { status: 500 }
    );
  }
}
