export type ThemeMode = 'light' | 'dark' | 'system';
export type LanguagePreference = 'mixed' | 'deutsch' | 'english';
export type ResponseLengthPreference = 'short' | 'medium' | 'long';

export interface UserSettings {
  theme: ThemeMode;
  language: LanguagePreference;
  response_length: ResponseLengthPreference;
  memory_enabled: boolean;
  user_name: string;
  openai_api_key?: string;
  openai_base_url?: string; // e.g. http://localhost:11434/v1 for Ollama or https://openrouter.ai/api/v1
  openai_model?: string; // e.g. gpt-4o, llama3, qwen2.5, mistral
}
