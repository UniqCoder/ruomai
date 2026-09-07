import { ChatMessage, Conversation } from '../types/chat';

export interface HistoryEngineResult {
  formattedMessages: { role: 'user' | 'assistant'; content: string }[];
  historyPromptSegment: string;
  totalMessagesCount: number;
}

/**
 * CONVERSATION HISTORY ENGINE
 * Formats short-term sliding window history for immediate conversational continuity.
 */
export function processHistory(
  messages: ChatMessage[] = [],
  maxWindow: number = 12
): HistoryEngineResult {
  // Filter out empty or incomplete draft messages
  const validMessages = messages.filter((m) => m && m.content && m.content.trim().length > 0);

  // Apply sliding window
  const windowed = validMessages.slice(-maxWindow);

  const formattedMessages = windowed.map((m) => ({
    role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
    content: m.content.trim(),
  }));

  const historyPromptSegment = windowed
    .map((m) => `${m.sender === 'user' ? 'User' : 'Vivi'}: "${m.content.trim()}"`)
    .join('\n');

  return {
    formattedMessages,
    historyPromptSegment,
    totalMessagesCount: validMessages.length,
  };
}
