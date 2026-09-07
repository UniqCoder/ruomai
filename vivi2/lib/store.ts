import { PersonalityProfile } from './types/personality';
import { MemoryItem, MemoryCategory } from './types/memory';
import { ChatMessage, Conversation } from './types/chat';
import { UserSettings } from './types/user';
import {
  INITIAL_PERSONALITY,
  INITIAL_MEMORIES,
  INITIAL_CONVERSATION,
  INITIAL_USER_SETTINGS,
} from './mock-data';

const STORAGE_KEYS = {
  PERSONALITY: 'vivi_personality_profile',
  MEMORIES: 'vivi_memories_list',
  CONVERSATION: 'vivi_active_conversation',
  SETTINGS: 'vivi_user_settings',
};

// Helper for local storage reading with fallback
export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.warn(`Failed to read ${key} from localStorage`, err);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write ${key} to localStorage`, err);
  }
}

export const ViviStore = {
  getPersonality(): PersonalityProfile {
    return loadFromStorage(STORAGE_KEYS.PERSONALITY, INITIAL_PERSONALITY);
  },

  savePersonality(profile: PersonalityProfile): PersonalityProfile {
    const updated = { ...profile, updated_at: new Date().toISOString() };
    saveToStorage(STORAGE_KEYS.PERSONALITY, updated);
    return updated;
  },

  getMemories(): MemoryItem[] {
    return loadFromStorage(STORAGE_KEYS.MEMORIES, INITIAL_MEMORIES);
  },

  saveMemories(memories: MemoryItem[]): void {
    saveToStorage(STORAGE_KEYS.MEMORIES, memories);
  },

  addMemory(content: string, category: MemoryCategory = 'long_term', importance: number = 3): MemoryItem {
    const current = this.getMemories();
    const newMemory: MemoryItem = {
      id: `mem-${Date.now()}`,
      content,
      category,
      importance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newMemory, ...current];
    this.saveMemories(updated);
    return newMemory;
  },

  updateMemory(id: string, content: string, category: MemoryCategory, importance: number): MemoryItem | null {
    const current = this.getMemories();
    const index = current.findIndex((m) => m.id === id);
    if (index === -1) return null;

    const updatedMemory = {
      ...current[index],
      content,
      category,
      importance,
      updated_at: new Date().toISOString(),
    };

    current[index] = updatedMemory;
    this.saveMemories(current);
    return updatedMemory;
  },

  deleteMemory(id: string): void {
    const current = this.getMemories();
    const filtered = current.filter((m) => m.id !== id);
    this.saveMemories(filtered);
  },

  clearMemories(): void {
    this.saveMemories([]);
  },

  getConversation(): Conversation {
    return loadFromStorage(STORAGE_KEYS.CONVERSATION, INITIAL_CONVERSATION);
  },

  saveConversation(conv: Conversation): void {
    saveToStorage(STORAGE_KEYS.CONVERSATION, conv);
  },

  addMessage(sender: 'user' | 'assistant', content: string): ChatMessage {
    const conv = this.getConversation();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      conversation_id: conv.id,
      sender,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedConv = {
      ...conv,
      updated_at: new Date().toISOString(),
      messages: [...conv.messages, newMsg],
    };

    this.saveConversation(updatedConv);
    return newMsg;
  },

  updateMessage(
    messageId: string,
    updates: Partial<Pick<ChatMessage, 'content' | 'imageDataUrl' | 'imageAlt' | 'imagePrompt'>>
  ): ChatMessage | null {
    const conv = this.getConversation();
    const index = conv.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return null;

    const updatedMessage = {
      ...conv.messages[index],
      ...updates,
    };

    const updatedMessages = [...conv.messages];
    updatedMessages[index] = updatedMessage;
    this.saveConversation({ ...conv, updated_at: new Date().toISOString(), messages: updatedMessages });
    return updatedMessage;
  },

  deleteMessage(messageId: string): void {
    const conv = this.getConversation();
    const filtered = conv.messages.filter((m) => m.id !== messageId);
    this.saveConversation({ ...conv, messages: filtered });
  },

  clearConversation(): void {
    const conv = this.getConversation();
    this.saveConversation({ ...conv, messages: [] });
  },

  getSettings(): UserSettings {
    return loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_USER_SETTINGS);
  },

  saveSettings(settings: UserSettings): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  },
};
