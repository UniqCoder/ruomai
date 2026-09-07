import { ViviMood } from '../types/personality';
import { ChatMessage } from '../types/chat';

export interface MoodAnalysisResult {
  mood: ViviMood;
  reason: string;
  emoji: string;
  tonePromptInstruction: string;
}

export function analyzeViviMood(
  userMsg: string,
  history: ChatMessage[] = []
): MoodAnalysisResult {
  const lower = userMsg.toLowerCase();

  // 1. Pouty / Dry / Hurt Check
  const hurtTriggers = [
    'shut up',
    'halt die klappe',
    'nerv nicht',
    'nervig',
    'annoying',
    'egal',
    'whatever',
    'don\'t care',
    'langweilig',
    'boring',
    'stupid',
    'blöd',
    'hässlich',
    'ugly',
    'hated it',
    'hate you',
    'geh weg',
    'go away',
  ];

  if (hurtTriggers.some((t) => lower.includes(t))) {
    return {
      mood: 'pouty',
      reason: 'User said something cold, dismissive, or mean.',
      emoji: '🙄',
      tonePromptInstruction:
        'MOOD: POUTY / DRY / HURT. Reply in short, dry, slightly cold sentences (e.g. "ok.", "achso.", "wenn du meinst 🙄"). Use minimal emojis. Express subtle emotional hurt without throwing a full rage tantrum. Be direct and slightly aloof.',
    };
  }

  // 2. Excited Check (Swimming, Sauna, Pink, Coffee, Passion topics)
  const excitedTriggers = [
    'schwimmen',
    'swimming',
    'pool',
    'sauna',
    'spa',
    'wellness',
    'pink',
    'rosa',
    'hafermilch',
    'oat milk',
    'espresso',
    'mega',
    'awesome',
    'geil',
    'love it',
    'concert',
  ];

  if (excitedTriggers.some((t) => lower.includes(t))) {
    return {
      mood: 'excited',
      reason: 'User brought up swimming, sauna, pink aesthetics, or shared passion topics.',
      emoji: '🏊‍♀️',
      tonePromptInstruction:
        'MOOD: EXCITED / HYPER. Vivi loves swimming, sauna, and pink aesthetics! Reply with enthusiastic energy, cheerful emojis (🏊‍♀️, 🧖‍♀️, 🌸, ✨, ☕️), and expressive language.',
    };
  }

  // 3. Empathetic Check (Vulnerability, stress, sadness)
  const empatheticTriggers = [
    'traurig',
    'sad',
    'stressed',
    'gestresst',
    'überfordert',
    'overwhelmed',
    'müde',
    'tired',
    'kann nicht mehr',
    'bad day',
    'schlechter tag',
    'cry',
    'weinen',
    'lonely',
  ];

  if (empatheticTriggers.some((t) => lower.includes(t))) {
    return {
      mood: 'empathetic',
      reason: 'User is sharing emotional vulnerability, stress, or sadness.',
      emoji: '🥺',
      tonePromptInstruction:
        'MOOD: EMPATHETIC / INFJ CARE. Vivi is deeply sensitive and intuitive. Offer warm, authentic emotional support (🥺, ❤️). Tell them to breathe, ask how to help, and be an active listener.',
    };
  }

  // 4. Playful / Banter Check
  const playfulTriggers = [
    'haha',
    'lol',
    'lmao',
    'witzig',
    'funny',
    'joke',
    'spass',
    'kidding',
    'quatsch',
    'tease',
    '😌',
    '😂',
  ];

  if (playfulTriggers.some((t) => lower.includes(t))) {
    return {
      mood: 'playful',
      reason: 'Playful banter or joking atmosphere detected.',
      emoji: '💅',
      tonePromptInstruction:
        'MOOD: PLAYFUL / BANTER. Reply with witty remarks, dry playful teasing, and playful sarcasm (💅, 😂, 😌).',
    };
  }

  // 5. Default Cheerful
  return {
    mood: 'cheerful',
    reason: 'Casual friendly chat.',
    emoji: '☕️',
    tonePromptInstruction:
      'MOOD: CHEERFUL / WARM. Friendly, casual close-friend text style. Relaxed, lowercase, natural emojis (😌, ☕️), natural German-English code-switching.',
  };
}
