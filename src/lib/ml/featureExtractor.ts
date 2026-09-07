export interface FeatureVector {
  char_count: number;
  word_count: number;
  avg_word_length: number;
  sentence_count: number;
  avg_sentence_length: number;
  line_count: number;
  hook_has_question: number;
  hook_has_number: number;
  hook_is_contrarian: number;
  cta_present: number;
  hashtag_count: number;
  hashtag_density: number;
  emoji_count: number;
  emoji_density: number;
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  code_mix_ratio: number;
  buzzword_penalty: number;
  bullet_point_count: number;
  platform_length_fitness: number;
}

export const FEATURE_NAMES: (keyof FeatureVector)[] = [
  "char_count",
  "word_count",
  "avg_word_length",
  "sentence_count",
  "avg_sentence_length",
  "line_count",
  "hook_has_question",
  "hook_has_number",
  "hook_is_contrarian",
  "cta_present",
  "hashtag_count",
  "hashtag_density",
  "emoji_count",
  "emoji_density",
  "flesch_reading_ease",
  "flesch_kincaid_grade",
  "code_mix_ratio",
  "buzzword_penalty",
  "bullet_point_count",
  "platform_length_fitness",
];

const HINGLISH_MARKERS = new Set([
  "bhai", "yaar", "matlab", "matlb", "dekho", "hoga", "hogi", "hoge", "hai", "hain",
  "kar", "karo", "kare", "karna", "karne", "nahi", "nhi", "agar", "toh", "to", "paise",
  "paisa", "jugaad", "baat", "sahi", "galat", "dost", "seekho", "samjho", "batao",
  "kyu", "kyun", "kaise", "kitna", "bohot", "bahut", "mast", "chalo", "suno", "log",
  "apna", "apni", "apne", "kya", "ye", "yeh", "wo", "woh", "ab", "abhi", "kabhi",
  "zyada", "jyada", "kam", "accha", "achha", "bura", "sirf", "lekin", "par", "ek",
  "do", "teen", "crore", "lakh", "rupaye", "rupees", "dukaan", "startup", "waale", "wali"
]);

const BUZZWORDS = [
  "synergy", "leverage", "leveraging", "holistic", "paradigm", "disruptive", "game-changer",
  "game changer", "wheelhouse", "circle back", "bandwidth", "low-hanging fruit", "boil the ocean",
  "deep dive", "touch base", "actionable insights", "seamlessly", "revolutionize", "pinnacle"
];

const HOOK_CONTRARIAN_WORDS = new Set([
  "stop", "unpopular", "nobody", "mistake", "mistakes", "truth", "why", "warning",
  "secret", "secrets", "exposed", "don't", "dont", "never", "worst", "failed", "hate",
  "lies", "myth", "myths", "quit", "zero", "reality"
]);

const CTA_KEYWORDS = [
  "save", "share", "comment", "dm", "reply", "repost", "link", "click", "try",
  "follow", "subscribe", "thoughts", "let me know", "what do you think", "tell me",
  "drop a", "bookmark", "send this"
];

const PLATFORM_LENGTH_PRIORS: Record<string, [number, number]> = {
  tweet_thread: [220, 70],
  linkedin_post: [180, 80],
  reel_script: [90, 35],
  newsletter_intro: [140, 50],
  whatsapp_broadcast: [100, 40],
  other: [150, 60],
};

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  const vowels = "aeiouy";
  let count = 0;
  let prevIsVowel = false;

  for (let i = 0; i < clean.length; i++) {
    const isVowel = vowels.includes(clean[i]);
    if (isVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isVowel;
  }

  if (clean.endsWith("e") && !clean.endsWith("le") && count > 1) {
    count--;
  }

  return Math.max(1, count);
}

export function extractCandidateFeatures(text: string, platform = "linkedin_post"): FeatureVector {
  const rawText = text || "";
  const cleanText = rawText.trim();

  // Character & word count
  const charCount = cleanText.length;
  const wordTokens: string[] = cleanText.toLowerCase().match(/\b\w+\b/g) || [];
  const wordCount = wordTokens.length;

  const avgWordLength = wordCount > 0
    ? wordTokens.reduce((acc, w) => acc + w.length, 0) / wordCount
    : 0;

  // Sentences & Line breaks
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const lineCount = lines.length;

  const sentences = rawText.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  const sentenceCount = Math.max(1, sentences.length);
  const avgSentenceLength = wordCount / sentenceCount;

  // Hook analysis (first 1-2 lines)
  const hookText = lines.slice(0, 2).join(" ").toLowerCase();
  const hookHasQuestion = hookText.includes("?") ? 1 : 0;
  const hookHasNumber = /\b\d+(?:%|k|lakh|cr|x)?\b/i.test(hookText) ? 1 : 0;

  const hookWords: string[] = hookText.match(/\b\w+\b/g) || [];
  const hookIsContrarian = hookWords.some((w) => HOOK_CONTRARIAN_WORDS.has(w)) ? 1 : 0;

  // CTA presence
  const tailText = (lines.slice(-3).join(" ") || cleanText).toLowerCase();
  const ctaPresent = CTA_KEYWORDS.some((kw) => tailText.includes(kw)) ? 1 : 0;

  // Hashtags
  const hashtags = rawText.match(/#\w+/g) || [];
  const hashtagCount = hashtags.length;
  const hashtagDensity = (hashtagCount / Math.max(1, wordCount)) * 100;

  // Emojis
  const emojiMatches = rawText.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF\u2300-\u23FF]/g) || [];
  const emojiCount = emojiMatches.length;
  const emojiDensity = (emojiCount / Math.max(1, wordCount)) * 100;

  // Readability
  const totalSyllables = wordTokens.reduce((sum, w) => sum + countSyllables(w), 0);
  const syllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 1;

  let fleschReadingEase = 206.835 - (1.015 * avgSentenceLength) - (84.6 * syllablesPerWord);
  fleschReadingEase = Math.max(0, Math.min(100, fleschReadingEase));

  let fleschKincaidGrade = (0.39 * avgSentenceLength) + (11.8 * syllablesPerWord) - 15.59;
  fleschKincaidGrade = Math.max(1, Math.min(20, fleschKincaidGrade));

  // Code-mixing
  const hinglishCount = wordTokens.filter((w) => HINGLISH_MARKERS.has(w)).length;
  const codeMixRatio = (hinglishCount / Math.max(1, wordCount)) * 100;

  // Buzzword penalty
  const lowerAll = cleanText.toLowerCase();
  const buzzwordPenalty = BUZZWORDS.filter((bw) => lowerAll.includes(bw)).length;

  // Bullet points
  const bulletPointCount = lines.filter((l) => /^[-*•\d+.]\s+/.test(l)).length;

  // Platform length Gaussian fitness
  const [mu, sigma] = PLATFORM_LENGTH_PRIORS[platform] || PLATFORM_LENGTH_PRIORS.other;
  const diff = wordCount - mu;
  const platformLengthFitness = Math.exp(-Math.pow(diff, 2) / (2 * Math.pow(sigma, 2)));

  return {
    char_count: charCount,
    word_count: wordCount,
    avg_word_length: Number(avgWordLength.toFixed(2)),
    sentence_count: sentenceCount,
    avg_sentence_length: Number(avgSentenceLength.toFixed(2)),
    line_count: lineCount,
    hook_has_question: hookHasQuestion,
    hook_has_number: hookHasNumber,
    hook_is_contrarian: hookIsContrarian,
    cta_present: ctaPresent,
    hashtag_count: hashtagCount,
    hashtag_density: Number(hashtagDensity.toFixed(2)),
    emoji_count: emojiCount,
    emoji_density: Number(emojiDensity.toFixed(2)),
    flesch_reading_ease: Number(fleschReadingEase.toFixed(2)),
    flesch_kincaid_grade: Number(fleschKincaidGrade.toFixed(2)),
    code_mix_ratio: Number(codeMixRatio.toFixed(2)),
    buzzword_penalty: buzzwordPenalty,
    bullet_point_count: bulletPointCount,
    platform_length_fitness: Number(platformLengthFitness.toFixed(3)),
  };
}
