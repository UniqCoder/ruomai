import { ScoredMemory } from './scoring-engine';
import { MemoryItem } from '../types/memory';

export interface AcoSelectionOptions {
  topK: number;
  iterations?: number;
  antsPerIteration?: number;
  evaporation?: number;
}

interface CandidateNode {
  memory: MemoryItem;
  score: number;
  heuristic: number;
  pheromone: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function diversityBonus(selection: MemoryItem[], candidate: MemoryItem): number {
  const seenCategory = selection.some((item) => item.category === candidate.category);
  return seenCategory ? 0.94 : 1.08;
}

function chooseWeighted<T>(items: Array<{ item: T; weight: number }>): T | null {
  const total = items.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) return null;

  let roll = Math.random() * total;
  for (const entry of items) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry.item;
  }

  return items[items.length - 1]?.item || null;
}

function buildObjective(selection: MemoryItem[], map: Map<string, CandidateNode>): number {
  if (selection.length === 0) return 0;

  let total = 0;
  for (const item of selection) {
    const node = map.get(item.id);
    if (!node) continue;
    total += node.score * diversityBonus(selection, item);
  }
  return total;
}

export function selectMemoriesWithAco(
  scoredMemories: ScoredMemory[],
  options: AcoSelectionOptions
): MemoryItem[] {
  const topK = Math.max(1, options.topK);
  if (scoredMemories.length <= topK) {
    return scoredMemories.slice(0, topK).map((m) => m.memory);
  }

  const iterations = options.iterations ?? 12;
  const antsPerIteration = options.antsPerIteration ?? Math.max(6, topK * 3);
  const evaporation = clamp01(options.evaporation ?? 0.25);

  const nodes = new Map<string, CandidateNode>(
    scoredMemories.map((entry) => [
      entry.memory.id,
      {
        memory: entry.memory,
        score: entry.totalScore,
        heuristic: Math.max(0.01, entry.totalScore),
        pheromone: 1,
      },
    ])
  );

  let globalBest: MemoryItem[] = scoredMemories.slice(0, topK).map((m) => m.memory);
  let globalBestScore = buildObjective(globalBest, nodes);

  for (let iteration = 0; iteration < iterations; iteration++) {
    const iterationSolutions: Array<{ selection: MemoryItem[]; objective: number }> = [];

    for (let ant = 0; ant < antsPerIteration; ant++) {
      const available = [...nodes.values()];
      const selection: MemoryItem[] = [];

      while (selection.length < topK && available.length > 0) {
        const chosen = chooseWeighted(
          available.map((node) => ({
            item: node,
            weight: Math.pow(node.pheromone, 1.1) * Math.pow(node.heuristic, 1.2),
          }))
        );

        if (!chosen) break;

        selection.push(chosen.memory);
        const idx = available.findIndex((node) => node.memory.id === chosen.memory.id);
        if (idx >= 0) available.splice(idx, 1);
      }

      const objective = buildObjective(selection, nodes);
      iterationSolutions.push({ selection, objective });

      if (objective > globalBestScore) {
        globalBest = selection;
        globalBestScore = objective;
      }
    }

    nodes.forEach((node) => {
      node.pheromone = Math.max(0.15, node.pheromone * (1 - evaporation));
    });

    const bestIteration = iterationSolutions.sort((a, b) => b.objective - a.objective)[0];
    if (bestIteration) {
      bestIteration.selection.forEach((item, index) => {
        const node = nodes.get(item.id);
        if (!node) return;
        node.pheromone += Math.max(0.35, bestIteration.objective / (index + 1));
      });
    }
  }

  return globalBest;
}
