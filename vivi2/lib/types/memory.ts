export type MemoryCategory = 'long_term' | 'episodic' | 'fact' | 'preference';

export interface MemoryItem {
  id: string;
  content: string;
  category: MemoryCategory;
  importance: number; // 1-5
  source_message_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractMemoryParams {
  conversationId: string;
  userMessage: string;
  assistantResponse: string;
}
