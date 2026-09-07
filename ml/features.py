import re
import math
from typing import Dict, List, Any, Optional

# Indic / Hinglish lexicon markers for code-mix detection
HINGLISH_MARKERS = {
    "bhai", "yaar", "matlab", "matlb", "dekho", "hoga", "hogi", "hoge", "hai", "hain",
    "kar", "karo", "kare", "karna", "karne", "nahi", "nhi", "agar", "toh", "to", "paise",
    "paisa", "jugaad", "baat", "sahi", "galat", "dost", "seekho", "samjho", "batao",
    "kyu", "kyun", "kaise", "kitna", "bohot", "bahut", "mast", "chalo", "suno", "log",
    "apna", "apni", "apne", "kya", "ye", "yeh", "wo", "woh", "ab", "abhi", "kabhi",
    "zyada", "jyada", "kam", "accha", "achha", "bura", "sirf", "lekin", "par", "ek",
    "do", "teen", "crore", "lakh", "rupaye", "rupees", "dukaan", "startup", "waale", "wali"
}

# Corporate buzzword fluffs that hurt authenticity & engagement
BUZZWORDS = {
    "synergy", "leverage", "leveraging", "holistic", "paradigm", "disruptive", "game-changer",
    "game changer", "wheelhouse", "circle back", "bandwidth", "low-hanging fruit", "boil the ocean",
    "deep dive", "touch base", "actionable insights", "seamlessly", "revolutionize", "pinnacle"
}

# Strong contrarian / curiosity hook triggers
HOOK_CONTRARIAN_WORDS = {
    "stop", "unpopular", "nobody", "mistake", "mistakes", "truth", "why", "warning",
    "secret", "secrets", "exposed", "don't", "dont", "never", "worst", "failed", "hate",
    "lies", "myth", "myths", "quit", "zero", "reality"
}

# Actionable CTA verbs
CTA_KEYWORDS = {
    "save", "share", "comment", "dm", "reply", "repost", "link", "click", "try",
    "follow", "subscribe", "thoughts", "let me know", "what do you think", "tell me",
    "drop a", "bookmark", "send this"
}

# Platform optimal length priors (mean word count, standard deviation)
PLATFORM_LENGTH_PRIORS = {
    "linkedin_post": (180, 80),
    "reel_script": (90, 35),
    "tweet_thread": (220, 70),
    "whatsapp_broadcast": (100, 40),
    "newsletter_intro": (140, 50),
    "other": (150, 60),
}

def count_syllables(word: str) -> int:
    """Approximate syllable count using vowel grouping heuristics."""
    word = word.lower().strip(".:;?!'\"()[]{}")
    if not word:
        return 0
    if len(word) <= 3:
        return 1
    # Count vowel sequences
    vowels = "aeiouy"
    count = 0
    prev_is_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            count += 1
        prev_is_vowel = is_vowel
    # Adjust for silent e
    if word.endswith("e") and not word.endswith("le") and count > 1:
        count -= 1
    return max(1, count)

def extract_features(text: str, platform: str = "linkedin_post") -> Dict[str, float]:
    """
    Extracts a 20-dimensional feature vector from a given candidate text.
    """
    raw_text = text or ""
    clean_text = raw_text.strip()
    
    # Character & Word count
    char_count = len(clean_text)
    words = re.findall(r"\b\w+\b", clean_text.lower())
    word_count = len(words)
    
    avg_word_length = (sum(len(w) for w in words) / max(1, word_count)) if word_count > 0 else 0.0
    
    # Sentences & Line breaks
    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
    line_count = len(lines)
    
    sentence_delimiters = re.split(r"[.!?\n]+", raw_text)
    sentences = [s.strip() for s in sentence_delimiters if s.strip()]
    sentence_count = max(1, len(sentences))
    avg_sentence_length = word_count / sentence_count
    
    # Hook analysis (first 1-2 lines)
    hook_text = " ".join(lines[:2]).lower() if lines else ""
    hook_has_question = 1.0 if ("?" in hook_text) else 0.0
    hook_has_number = 1.0 if bool(re.search(r"\b\d+(?:%|k|lakh|cr|x)?\b", hook_text)) else 0.0
    hook_words = set(re.findall(r"\b\w+\b", hook_text))
    hook_is_contrarian = 1.0 if bool(hook_words & HOOK_CONTRARIAN_WORDS) else 0.0
    
    # CTA presence (look especially in last 3 lines or overall text)
    tail_text = " ".join(lines[-3:]).lower() if lines else clean_text.lower()
    cta_present = 0.0
    for cta_word in CTA_KEYWORDS:
        if cta_word in tail_text:
            cta_present = 1.0
            break
            
    # Hashtags
    hashtags = re.findall(r"#\w+", raw_text)
    hashtag_count = len(hashtags)
    hashtag_density = (hashtag_count / max(1, word_count)) * 100.0
    
    # Emojis (Unicode regex)
    emoji_matches = re.findall(r"[\U00010000-\U0010ffff\u2600-\u27bf\u2300-\u23ff]", raw_text)
    emoji_count = len(emoji_matches)
    emoji_density = (emoji_count / max(1, word_count)) * 100.0
    
    # Readability (Flesch Reading Ease & Flesch-Kincaid Grade)
    total_syllables = sum(count_syllables(w) for w in words)
    syllables_per_word = (total_syllables / max(1, word_count)) if word_count > 0 else 1.0
    
    # Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
    flesch_reading_ease = 206.835 - (1.015 * avg_sentence_length) - (84.6 * syllables_per_word)
    flesch_reading_ease = max(0.0, min(100.0, flesch_reading_ease))
    
    # Flesch-Kincaid Grade: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
    flesch_kincaid_grade = (0.39 * avg_sentence_length) + (11.8 * syllables_per_word) - 15.59
    flesch_kincaid_grade = max(1.0, min(20.0, flesch_kincaid_grade))
    
    # Code-mix (Hinglish / Indic markers)
    hinglish_token_count = sum(1 for w in words if w in HINGLISH_MARKERS)
    code_mix_ratio = (hinglish_token_count / max(1, word_count)) * 100.0
    
    # Buzzword penalty count
    buzzword_count = sum(1 for bw in BUZZWORDS if bw in clean_text.lower())
    buzzword_penalty = float(buzzword_count)
    
    # Bullet points / list structure count
    bullet_point_count = sum(1 for line in lines if re.match(r"^[-*•\d+.]\s+", line))
    
    # Platform length fitness (Gaussian score 0.0 to 1.0)
    mu, sigma = PLATFORM_LENGTH_PRIORS.get(platform, PLATFORM_LENGTH_PRIORS["other"])
    diff = word_count - mu
    platform_length_fitness = math.exp(- (diff ** 2) / (2 * (sigma ** 2)))
    
    return {
        "char_count": float(char_count),
        "word_count": float(word_count),
        "avg_word_length": round(avg_word_length, 2),
        "sentence_count": float(sentence_count),
        "avg_sentence_length": round(avg_sentence_length, 2),
        "line_count": float(line_count),
        "hook_has_question": hook_has_question,
        "hook_has_number": hook_has_number,
        "hook_is_contrarian": hook_is_contrarian,
        "cta_present": cta_present,
        "hashtag_count": float(hashtag_count),
        "hashtag_density": round(hashtag_density, 2),
        "emoji_count": float(emoji_count),
        "emoji_density": round(emoji_density, 2),
        "flesch_reading_ease": round(flesch_reading_ease, 2),
        "flesch_kincaid_grade": round(flesch_kincaid_grade, 2),
        "code_mix_ratio": round(code_mix_ratio, 2),
        "buzzword_penalty": buzzword_penalty,
        "bullet_point_count": float(bullet_point_count),
        "platform_length_fitness": round(platform_length_fitness, 3),
    }

FEATURE_NAMES = [
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
]
