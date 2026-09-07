import { MemoryItem } from '../types/memory';
import { scoreAndRankMemories, ScoredMemory, MEMORY_CONFIG } from './scoring-engine';
import { selectMemoriesWithAco } from './aco-engine';
import { extractMemoryFromTurn } from './memories-service';

export interface MemoryEngineResult {
  retrievedMemories: MemoryItem[];
  scoredMemories: ScoredMemory[];
  memoryPromptSegment: string;
}

/**
 * MEMORY ENGINE
 * Executes hybrid semantic memory search (similarity + importance + recency + confidence)
 */
export async function processMemories(
  userMessage: string,
  allMemories: MemoryItem[] = []
): Promise<MemoryEngineResult> {
  const scoredMemories = scoreAndRankMemories(userMessage, allMemories, MEMORY_CONFIG.TOP_K);
  const retrievedMemories = selectMemoriesWithAco(scoredMemories, {
    topK: MEMORY_CONFIG.TOP_K,
    iterations: 10,
    antsPerIteration: 12,
    evaporation: 0.22,
  });

  const memoryPromptSegment = retrievedMemories.length > 0
    ? retrievedMemories
        .map((m) => `- [${m.category.toUpperCase()} | Score: ${m.importance}/5]: ${m.content}`)
        .join('\n')
    : 'No prior memories retrieved for this prompt.';

  return {
    retrievedMemories,
    scoredMemories,
    memoryPromptSegment,
  };
}

export { extractMemoryFromTurn };
