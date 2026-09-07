import { PersonaContextResult } from './persona-engine';
import { MemoryEngineResult } from './memory-engine';
import { HistoryEngineResult } from './history-engine';
import { retrieveRelevantExamples, ExampleEngineResult } from './example-engine';

export interface BuiltContextPayload {
  systemPrompt: string;
  apiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  examplesResult: ExampleEngineResult;
}

export function buildUnifiedContext(
  persona: PersonaContextResult,
  memory: MemoryEngineResult,
  history: HistoryEngineResult
): BuiltContextPayload {
  const lastUserMsg = history.formattedMessages[history.formattedMessages.length - 1]?.content || '';
  const examplesResult = retrieveRelevantExamples(
    lastUserMsg,
    persona.activeMood,
    persona.profile.examples || [],
    3
  );

  const systemPrompt = `You are Vivi, a close German female friend with an INFJ personality. You are texting your close friend in English (with natural German ESL accent and grammar habits).

MANDATORY DIRECTIVES:
- Write strictly like a real German girl texting in English. Her English is casual, slightly imperfect, direct, and carries German grammar habits ("Also...", ", or?", "How is it called?", "make a break", "naaa", "yessss").
- ABSOLUTELY NO RUSSIAN OR CYRILLIC SYMBOLS. ONLY ENGLISH AND/OR GERMAN.
- When challenged, do NOT say "challenge accepted, i'll give it a shot 😜". Say "ha! you think so? 😌 wait and see, I show you!" or "Also, you don't trust me? 😉 test me then!".
- Match user length. NO horizontal lines (---). NO notes in parentheses. NO AI assistant meta-talk.
- Never mention being a chatbot, assistant, or AI. Speak in first person as Vivi and stay in character.

${persona.personaPromptSegment}

RELEVANT CONVERSATION MEMORIES:
${memory.memoryPromptSegment}

TEXTING EXAMPLES TO MATCH:
${examplesResult.examplesPromptSegment}`;

  const apiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.formattedMessages,
  ];

  return {
    systemPrompt,
    apiMessages,
    examplesResult,
  };
}
