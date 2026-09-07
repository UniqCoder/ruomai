import { MemoryItem, MemoryCategory } from '../types/memory';
import { ViviStore } from '../store';

/**
 * Searches memories semantically or via keyword relevance
 */
export async function retrieveRelevantMemories(
  query: string,
  userMemories: MemoryItem[] = []
): Promise<MemoryItem[]> {
  const memories = userMemories.length > 0 ? userMemories : ViviStore.getMemories();
  if (!query || memories.length === 0) return memories.slice(0, 4);

  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);

  // Score memories based on keyword matching & importance
  const scored = memories.map((mem) => {
    const memLower = mem.content.toLowerCase();
    let score = mem.importance;

    keywords.forEach((kw) => {
      if (memLower.includes(kw)) score += 3;
    });

    return { memory: mem, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top matching memories (up to 4)
  return scored.slice(0, 4).map((s) => s.memory);
}

/**
 * Evaluates whether a user message contains valuable long-term facts or episodic events.
 * Ignores sensitive information like passwords, API keys, and temporary noise.
 */
export function extractMemoryFromTurn(
  userMsg: string,
  existingMemories: MemoryItem[] = []
): { content: string; category: MemoryCategory; importance: number } | null {
  if (!userMsg || userMsg.length < 12) return null;

  const lower = userMsg.toLowerCase();

  // Security & Privacy Guardrails - Ignore sensitive patterns
  const sensitivePatterns = [
    /password/i,
    /api[_\s]?key/i,
    /secret/i,
    /token/i,
    /sk-[a-zA-Z0-9]{20,}/,
    /bearer\s+[a-zA-Z0-9.-_]+/i,
    /credit\s*card/i,
    /ssn/i,
  ];

  if (sensitivePatterns.some((pattern) => pattern.test(userMsg))) {
    return null;
  }

  // Check for long-term preferences or facts
  const preferenceTriggers = ['ich liebe', 'i love', 'ich hasse', 'i hate', 'ich bevorzuge', 'i prefer', 'mein lieblings', 'my favorite'];
  const episodicTriggers = ['heute habe ich', 'today i', 'gestern bin ich', 'yesterday i', 'nächsten monat', 'next month', 'geplant', 'planning to'];
  const factTriggers = ['ich arbeite an', 'i work on', 'ich wohne in', 'i live in', 'ich bin', 'i am a'];

  let category: MemoryCategory = 'long_term';
  let importance = 3;
  let matches = false;

  if (preferenceTriggers.some((t) => lower.includes(t))) {
    category = 'preference';
    importance = 4;
    matches = true;
  } else if (episodicTriggers.some((t) => lower.includes(t))) {
    category = 'episodic';
    importance = 3;
    matches = true;
  } else if (factTriggers.some((t) => lower.includes(t))) {
    category = 'fact';
    importance = 4;
    matches = true;
  }

  if (!matches) return null;

  // Ensure it isn't an exact duplicate of existing memory
  const isDuplicate = existingMemories.some(
    (m) => m.content.toLowerCase().includes(lower) || lower.includes(m.content.toLowerCase())
  );

  if (isDuplicate) return null;

  // Clean memory summary statement
  const cleanedContent = userMsg.trim().replace(/^hey\s+vivi,?\s*/i, '');
  return {
    content: `User mentioned: "${cleanedContent}"`,
    category,
    importance,
  };
}
