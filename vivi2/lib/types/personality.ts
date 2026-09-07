export type ViviMood = 'cheerful' | 'playful' | 'pouty' | 'empathetic' | 'excited';

export interface PersonalityTraits {
  directness: number; // 1-10
  humor: number; // 1-10
  sarcasm: number; // 1-10
  playfulness: number; // 1-10
  emotional_openness: number; // 1-10
  sensitivity: number; // 1-10 (INFJ emotional sensitivity)
  curiosity: number; // 1-10
  formality: number; // 1-10
}

export interface PersonalityCommunication {
  average_message_length: 'short' | 'short-medium' | 'medium' | 'detailed';
  emoji_frequency: 'none' | 'low' | 'medium' | 'high';
  uses_sarcasm: boolean;
  uses_german: boolean;
  uses_english: boolean;
  language_switching: boolean;
  slang_level: 'casual' | 'very-casual' | 'moderate';
  typical_expressions: string[];
}

export interface PersonalityInterests {
  hobbies: string[];
  favorite_topics: string[];
  disliked_topics: string[];
  favorite_color: string;
}

export interface ExampleConversation {
  id: string;
  category: 'casual' | 'teasing' | 'comfort' | 'excitement' | 'disagreement' | 'advice' | 'pouty' | 'german_english_switch';
  user_prompt: string;
  ai_response: string;
}

export interface RelationshipContext {
  relationship_notes: string;
  shared_memories_summary: string;
  disclaimer: string;
}

export interface PersonalityProfile {
  id: string;
  name: string;
  mbti: string; // 'INFJ'
  avatar_url: string;
  tagline: string;
  description: string;
  source_bio?: string;
  current_mood: ViviMood;
  traits: PersonalityTraits;
  communication: PersonalityCommunication;
  interests: PersonalityInterests;
  examples: ExampleConversation[];
  context: RelationshipContext;
  updated_at: string;
}
