import { extractCandidateFeatures, FeatureVector, FEATURE_NAMES } from "./featureExtractor";

export interface MLModelWeights {
  model_type: string;
  feature_names: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  coefficients: number[];
  intercept: number;
  threshold: number;
  feature_importances: Record<string, number>;
}

export interface CandidateScoreResult {
  score: number; // 0 - 100
  rating5: number; // 1.0 - 5.0
  probability: number; // 0.0 - 1.0
  isHighQuality: boolean;
  features: FeatureVector;
  topPositiveSignals: { feature: string; label: string; impact: number }[];
  topNegativeSignals: { feature: string; label: string; impact: number }[];
  summaryFeedback: string[];
}

// Fallback robust default weights in case bundle json is loading or running edge
export const DEFAULT_MODEL_WEIGHTS: MLModelWeights = {
  model_type: "LogisticRegression",
  feature_names: [
    "char_count", "word_count", "avg_word_length", "sentence_count", "avg_sentence_length",
    "line_count", "hook_has_question", "hook_has_number", "hook_is_contrarian", "cta_present",
    "hashtag_count", "hashtag_density", "emoji_count", "emoji_density", "flesch_reading_ease",
    "flesch_kincaid_grade", "code_mix_ratio", "buzzword_penalty", "bullet_point_count", "platform_length_fitness"
  ],
  scaler_mean: [
    420.0, 75.0, 4.8, 6.0, 12.5, 7.0, 0.4, 0.45, 0.35, 0.65, 2.0, 2.5, 2.5, 3.0, 68.0, 7.5, 8.0, 0.3, 2.2, 0.72
  ],
  scaler_scale: [
    220.0, 42.0, 0.6, 3.5, 6.0, 4.0, 0.48, 0.50, 0.47, 0.48, 2.2, 3.0, 2.2, 3.2, 16.0, 3.2, 12.0, 0.7, 1.8, 0.28
  ],
  coefficients: [
    0.15, 0.20, -0.35, 0.30, -0.55, 0.45, 0.95, 0.85, 1.10, 1.35, -0.25, -0.30, 0.20, 0.15, 0.75, -0.65, 0.50, -1.85, 0.60, 1.05
  ],
  intercept: 0.42,
  threshold: 0.5,
  feature_importances: {
    hook_is_contrarian: 1.10,
    cta_present: 1.35,
    buzzword_penalty: -1.85,
    platform_length_fitness: 1.05,
    hook_has_question: 0.95,
    hook_has_number: 0.85,
    flesch_reading_ease: 0.75,
    bullet_point_count: 0.60,
    code_mix_ratio: 0.50,
    line_count: 0.45,
  }
};

const FEATURE_HUMAN_LABELS: Record<string, string> = {
  hook_is_contrarian: "Pattern-Interrupt Hook",
  cta_present: "Actionable Call-to-Action",
  buzzword_penalty: "Corporate Jargon / Buzzwords",
  platform_length_fitness: "Platform Length Optimization",
  hook_has_question: "Curiosity Question Hook",
  hook_has_number: "Data & Numbers in Hook",
  flesch_reading_ease: "High Readability Score",
  flesch_kincaid_grade: "Reading Simplicity",
  bullet_point_count: "Skimmable List Structure",
  code_mix_ratio: "Authentic Hinglish / Code-Mix",
  line_count: "Paragraph Spacing & Breaks",
  avg_sentence_length: "Punchy Sentence Length",
  hashtag_density: "Hashtag Spam Penalty",
};

export function scoreContentCandidate(
  text: string,
  platform = "linkedin_post",
  weights: MLModelWeights = DEFAULT_MODEL_WEIGHTS
): CandidateScoreResult {
  const features = extractCandidateFeatures(text, platform);
  const featureValues = FEATURE_NAMES.map((name) => features[name]);

  let logOdds = weights.intercept;
  const contributions: { feature: string; label: string; impact: number }[] = [];

  for (let i = 0; i < FEATURE_NAMES.length; i++) {
    const rawVal = featureValues[i];
    const mean = weights.scaler_mean[i] ?? 0;
    const scale = weights.scaler_scale[i] || 1;
    const coeff = weights.coefficients[i] ?? 0;

    const zScore = (rawVal - mean) / scale;
    const impact = zScore * coeff;
    logOdds += impact;

    const featName = FEATURE_NAMES[i];
    contributions.push({
      feature: featName,
      label: FEATURE_HUMAN_LABELS[featName] || featName,
      impact: Number(impact.toFixed(3)),
    });
  }

  // Sigmoid probability
  const probability = 1 / (1 + Math.exp(-logOdds));
  const score = Math.round(Math.max(15, Math.min(99, 30 + probability * 70)));
  const rating5 = Number((1.6 + probability * 3.4).toFixed(1));
  const isHighQuality = probability >= weights.threshold;

  // Sort signals
  const sorted = [...contributions].sort((a, b) => b.impact - a.impact);
  const topPositiveSignals = sorted.filter((s) => s.impact > 0.15).slice(0, 3);
  const topNegativeSignals = sorted.filter((s) => s.impact < -0.15).reverse().slice(0, 3);

  // Generate actionable summary feedback
  const summaryFeedback: string[] = [];
  if (features.buzzword_penalty > 0) {
    summaryFeedback.push("Remove corporate buzzwords (e.g. synergy, leverage) to boost authenticity.");
  }
  if (features.hook_has_question === 0 && features.hook_has_number === 0 && features.hook_is_contrarian === 0) {
    summaryFeedback.push("Strengthen opening line with a question, statistic, or pattern interrupt.");
  }
  if (features.cta_present === 0) {
    summaryFeedback.push("Add a clear Call-to-Action (e.g. Save this, Comment below, Reply with...).");
  }
  if (features.flesch_reading_ease < 50) {
    summaryFeedback.push("Sentences are too dense. Shorten lines to improve readability.");
  }
  if (features.code_mix_ratio > 0 && platform === "linkedin_post") {
    summaryFeedback.push("Authentic Hinglish markers detected — increases engagement with Indian audiences.");
  }

  return {
    score,
    rating5,
    probability: Number(probability.toFixed(3)),
    isHighQuality,
    features,
    topPositiveSignals,
    topNegativeSignals,
    summaryFeedback,
  };
}

export function rankContentCandidates(
  candidates: { id?: string; text: string; label?: string }[],
  platform = "linkedin_post",
  weights: MLModelWeights = DEFAULT_MODEL_WEIGHTS
) {
  const scored = candidates.map((cand, idx) => {
    const evalResult = scoreContentCandidate(cand.text, platform, weights);
    return {
      ...cand,
      candidateIndex: idx + 1,
      evaluation: evalResult,
    };
  });

  // Rank descending by score
  return scored.sort((a, b) => b.evaluation.score - a.evaluation.score);
}
