import { ExampleConversation, ViviMood } from '../types/personality';

export interface ExampleEngineResult {
  selectedExamples: ExampleConversation[];
  examplesPromptSegment: string;
}

/**
 * FEW-SHOT BEHAVIORAL EXAMPLE RETRIEVAL ENGINE
 * Dynamically retrieves top-K representative example turns matching the user's current topic intent and active mood.
 */
export function retrieveRelevantExamples(
  userMessage: string,
  mood: ViviMood,
  allExamples: ExampleConversation[] = [],
  topK: number = 3
): ExampleEngineResult {
  if (!allExamples || allExamples.length === 0) {
    return { selectedExamples: [], examplesPromptSegment: 'No specific behavioral examples configured.' };
  }

  const lower = userMessage.toLowerCase();

  // Score examples based on category match & text overlap
  const scored = allExamples.map((ex) => {
    let score = 0;

    // Mood & category match bonus
    if (mood === 'pouty' && ex.category === 'pouty') score += 10;
    if (mood === 'excited' && ex.category === 'excitement') score += 10;
    if (mood === 'empathetic' && ex.category === 'comfort') score += 10;
    if (mood === 'playful' && (ex.category === 'teasing' || ex.category === 'casual')) score += 8;

    // Language switch bonus
    if (ex.category === 'german_english_switch' && /[äöüß]/i.test(userMessage) && /[a-z]/i.test(userMessage)) {
      score += 5;
    }

    // Keyword match in user prompt or AI response
    const exUserLower = ex.user_prompt.toLowerCase();
    const words = lower.split(/\s+/).filter((w) => w.length > 2);
    words.forEach((w) => {
      if (exUserLower.includes(w)) score += 3;
    });

    return { example: ex, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selectedExamples = scored.slice(0, topK).map((s) => s.example);

  const examplesPromptSegment = selectedExamples
    .map((ex) => `[Category: ${ex.category}]\nUser: "${ex.user_prompt}"\nVivi: "${ex.ai_response}"`)
    .join('\n\n');

  return {
    selectedExamples,
    examplesPromptSegment,
  };
}
