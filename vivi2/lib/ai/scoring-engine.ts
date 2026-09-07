import { MemoryItem } from '../types/memory';

export const MEMORY_CONFIG = {
  TOP_K: 4,
  SIMILARITY_THRESHOLD: 0.45,
  WEIGHTS: {
    SEMANTIC: 0.45,
    IMPORTANCE: 0.25,
    RECENCY: 0.2,
    CONFIDENCE: 0.1,
  },
};

export interface ScoredMemory {
  memory: MemoryItem;
  totalScore: number;
  semanticSimilarity: number;
  importanceNormalized: number;
  recencyNormalized: number;
  confidenceNormalized: number;
}

/**
 * HYBRID MEMORY QUALITY SCORING ENGINE
 * Combines semantic vector similarity, importance rating (1-5), recency exponential decay, and confidence rating.
 */
export function scoreAndRankMemories(
  query: string,
  memories: MemoryItem[],
  topK: number = MEMORY_CONFIG.TOP_K,
  similarityThreshold: number = MEMORY_CONFIG.SIMILARITY_THRESHOLD
): ScoredMemory[] {
  if (!query || !memories || memories.length === 0) return [];

  const lowerQuery = query.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
  const now = Date.now();

  const scoredList: ScoredMemory[] = memories.map((mem) => {
    const memLower = mem.content.toLowerCase();

    // 1. Semantic Similarity Approximation / Vector Cosine
    let matchedTokenCount = 0;
    queryTokens.forEach((token) => {
      if (memLower.includes(token)) matchedTokenCount++;
    });

    const semanticSimilarity = queryTokens.length > 0
      ? Math.min(1.0, (matchedTokenCount / queryTokens.length) * 0.8 + (memLower.includes(lowerQuery) ? 0.3 : 0.1))
      : 0.2;

    // 2. Importance Normalized (1-5 scale -> 0.2 to 1.0)
    const importanceNormalized = Math.min(1.0, Math.max(0.2, mem.importance / 5));

    // 3. Recency Decay (Half-life decay over 30 days)
    const ageInDays = Math.max(0, (now - new Date(mem.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const recencyNormalized = Math.exp(-ageInDays / 30);

    // 4. Confidence Normalized (Default 1.0)
    const confidenceNormalized = 1.0;

    // Weighted Hybrid Score
    const totalScore =
      semanticSimilarity * MEMORY_CONFIG.WEIGHTS.SEMANTIC +
      importanceNormalized * MEMORY_CONFIG.WEIGHTS.IMPORTANCE +
      recencyNormalized * MEMORY_CONFIG.WEIGHTS.RECENCY +
      confidenceNormalized * MEMORY_CONFIG.WEIGHTS.CONFIDENCE;

    return {
      memory: mem,
      totalScore,
      semanticSimilarity,
      importanceNormalized,
      recencyNormalized,
      confidenceNormalized,
    };
  });

  // Filter by threshold & sort by highest hybrid score
  const filtered = scoredList.filter(
    (item) => item.semanticSimilarity >= similarityThreshold || item.memory.importance >= 4
  );

  filtered.sort((a, b) => b.totalScore - a.totalScore);

  return filtered.slice(0, topK);
}
