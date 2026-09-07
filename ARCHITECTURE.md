# Ruom AI - System Architecture

This document describes the complete technical architecture of Ruom AI, a content repurposing platform built for Indian creators.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [AI Integration](#ai-integration)
5. [ML Scoring Pipeline](#ml-scoring-pipeline)
6. [Database Schema](#database-schema)
7. [Authentication Flow](#authentication-flow)
8. [API Reference](#api-reference)
9. [Deployment](#deployment)

---

## System Overview

Ruom is a serverless web application that transforms long-form content into multiple platform-native formats using AI, with an integrated ML quality scoring system.

### Key Design Principles

1. **Serverless-First**: No traditional backend servers; leverages Supabase Edge Functions
2. **Multi-Provider AI**: Automatic failover between xAI and Google Gemini
3. **Edge ML Inference**: Client-side ML model for instant quality scoring
4. **Indian-First**: Built-in Hinglish detection and Indian creator voice optimization

### Request Flow

```
User Input → Validation → Edge Function → AI Provider → JSON Response → ML Scoring → Output Display
     │                                      │                                          │
     └──────────────────────────────────────┴──────────────────────────────────────────┘
                           Tracked in usage_history table
```

---

## Frontend Architecture

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.8 | Type safety |
| Vite | 5.4 | Build tool, dev server |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | - | UI component library |
| React Router | 6.30 | Client-side routing |
| React Query | 5.83 | Server state management |
| Framer Motion | 12.38 | Animations |

### Application Structure

```
src/
├── App.tsx                    # Root component with providers
├── main.tsx                   # Entry point
├── components/
│   ├── Repurposer.tsx         # Main feature component
│   ├── OutputCard.tsx         # Content display cards
│   ├── ScoreBreakdownModal.tsx# ML score visualization
│   ├── TopNav.tsx             # Navigation bar
│   ├── Footer.tsx             # Footer component
│   ├── ComparisonSection.tsx  # Marketing comparison
│   ├── PricingSection.tsx     # Pricing tiers
│   ├── DemoAnimation.tsx      # Demo preview
│   ├── AsciiFluidBg.tsx       # Animated background
│   └── ui/                    # shadcn/ui components (50+)
├── pages/
│   ├── Index.tsx              # Landing page (home)
│   ├── Dashboard.tsx          # User workspace
│   ├── Login.tsx              # Authentication
│   ├── Signup.tsx             # Registration
│   ├── Pricing.tsx            # Pricing page
│   ├── EmailConfirmation.tsx  # Email verification
│   ├── ConfirmEmail.tsx       # Email confirm handler
│   └── NotFound.tsx           # 404 page
├── contexts/
│   └── AuthContext.tsx        # Auth state management
├── hooks/
│   ├── use-mobile.tsx         # Mobile detection hook
│   └── use-toast.ts           # Toast notifications hook
├── lib/
│   ├── ml/
│   │   ├── featureExtractor.ts# Feature extraction (20 features)
│   │   ├── scoringModel.ts    # ML inference model
│   │   └── model_weights.json # Pre-trained weights
│   ├── ai/
│   │   └── identifyProduct.ts # Content classification
│   ├── analysis/
│   │   └── engine.ts          # Analysis engine
│   ├── matching/
│   │   └── matcher.ts         # Content matching
│   ├── recommendations/
│   │   └── ranker.ts          # Content ranking
│   ├── pricing/
│   │   └── price.ts           # Pricing calculations
│   ├── search/
│   │   └── providers.ts       # Search providers
│   ├── trust/
│   │   └── trust.ts           # Trust scoring
│   └── utils.ts               # Utility functions
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client
│       └── types.ts           # Database types
├── types/
│   └── product.ts             # Product types
└── test/
    ├── setup.ts               # Test setup
    ├── example.test.ts        # Example tests
    └── scoringModel.test.ts   # ML model tests
```

### Component Responsibilities

#### Repurposer.tsx (Main Feature)

The core component that orchestrates the entire content generation flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Repurposer.tsx                           │
├─────────────────────────────────────────────────────────────────┤
│ State:                                                          │
│   - content: string         # User input (60-12000 chars)       │
│   - tone: string            # Professional|Casual|Witty|Inspira │
│   - language: "EN" | "HI"   # English or Hinglish               │
│   - selected: string[]      # Selected output formats           │
│   - outputs: OutputMap      # Generated content                 │
│   - loading: boolean        # Generation in progress            │
│                                                                 │
│ Functions:                                                      │
│   - validateContent()       # Input validation                  │
│   - generate()              # API call to edge function         │
│   - handleSubmit()          # Form submission handler           │
│   - toggleFormat()          # Format selection toggle           │
│   - saveUserPreferences()   # Persist user settings             │
│   - fetchUserPreferences()  # Load saved settings               │
│                                                                 │
│ Effects:                                                        │
│   - Load user preferences on mount (if authenticated)           │
│   - Save preferences after successful generation                │
└─────────────────────────────────────────────────────────────────┘
```

#### OutputCard.tsx (Content Display)

```typescript
interface OutputCardProps {
  label: string;           // Format label (e.g., "Tweet thread")
  text?: string;           // Single text output
  blocks?: string[];       // Multi-block output (tweet threads)
  onScoreClick?: () => void; // ML score breakdown trigger
}
```

#### AuthContext.tsx (Authentication State)

```typescript
interface AuthContextType {
  user: User | null;       // Supabase user object
  session: Session | null; // Supabase session
  loading: boolean;        // Auth state loading
  signOut: () => Promise<void>;
}
```

### State Management

| State Type | Tool | Use Case |
|------------|------|----------|
| Server State | React Query | API caching, background refetch |
| Auth State | React Context | User session, authentication |
| Form State | Local useState | Input fields, selections |
| UI State | Local useState | Modals, loading, errors |

### Routing

```typescript
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/pricing" element={<Pricing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/email-confirmation" element={<EmailConfirmation />} />
  <Route path="/confirm-email" element={<ConfirmEmail />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## Backend Architecture

### Supabase Edge Function

The backend runs as a Deno serverless function at `supabase/functions/repurpose/index.ts`.

#### Configuration

```typescript
const maxContentChars = 12000;
const minContentChars = 60;
const minContentWords = 12;
const aiTimeoutMs = 30000;
const aiRetries = 1;
```

#### Request Handling

```typescript
// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Request validation
if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
```

#### Provider Resolution

```typescript
const resolveProviders = (): Provider[] => {
  const providers: Provider[] = [];
  
  // Primary: xAI (Grok)
  const xaiKey = Deno.env.get("XAI_API_KEY");
  if (xaiKey) {
    providers.push({
      name: "xai",
      key: xaiKey,
      models: [Deno.env.get("XAI_MODEL") ?? "grok-3-mini"],
    });
  }
  
  // Fallback: Google Gemini
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey) {
    providers.push({
      name: "gemini",
      key: geminiKey,
      models: ["gemini-3.6-flash", "gemini-flash-latest", "gemini-flash-lite-latest"],
    });
  }
  
  return providers;
};
```

#### Error Handling Strategy

```
Request → Provider Chain → Retry on 429/5xx → Next Provider on Failure
              │
              ├── 401/403: Throw "key rejected" (no retry)
              ├── 429: Retry with exponential backoff
              ├── 5xx: Try next provider
              └── Success: Return JSON response
```

---

## AI Integration

### Provider APIs

#### xAI (Grok)

```typescript
const callXAI = async (provider, systemPrompt, userPrompt) => {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: "grok-3-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });
  // ... error handling
  return data.choices[0].message.content;
};
```

#### Google Gemini

```typescript
const callGemini = async (provider, systemPrompt, userPrompt) => {
  // Walk through model chain on 503/429 errors
  for (const model of ["gemini-3.6-flash", "gemini-flash-latest", "gemini-flash-lite-latest"]) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 3000,
            responseMimeType: "application/json",
          },
        }),
      }
    );
    // ... error handling
  }
};
```

### Prompt Engineering

#### System Prompt (Core Instructions)

```
You are RUOM AI — a world-class content repurposing engine for Indian creators, 
coaches, founders and D2C brands. You write like a power user of each platform, 
never like an AI converting content.

FOLLOW THE USER'S INSTRUCTIONS (TOP PRIORITY):
- The INPUT CONTENT may contain direct instructions about tone, length, style, 
  angle, audience, structure, hashtags, or what to include/avoid
- Those instructions override everything below. Execute them exactly.
- Use only the names, numbers, results, mistakes and stories from the input. 
  Never invent facts.

CRAFT:
- First lines decide everything — curiosity gap, tension, contrarian take
- Human, direct voice. Punchy short sentences with rhythm.
- Zero corporate filler and zero AI clichés

PLATFORM PLAYBOOK — how the best creators actually post:
[Platform-specific instructions...]
```

#### Platform-Specific Playbooks

**X / Tweet Thread:**
```
- Tweet 1 is the whole ballgame: under 280 chars, one big claim or curiosity gap
- NEVER number tweets (no "1/5", "2/5") — the platform numbers them natively
- One idea per tweet. Fragments allowed. White space is a weapon
- Middle tweets escalate: insight → proof (the real numbers) → twist
- Final tweet: takeaway + soft CTA. Hashtags look desperate on X — 0-2 max
```

**LinkedIn Post:**
```
- Only the first ~2 lines show before "...more" — open mid-story or contrarian
- Paragraphs of 1-2 lines max, generous white space, no walls of text
- Arc: story → struggle → lesson → max 3 punchy bullets → genuine question
- 3-5 niche hashtags at the very end only, never inline
```

**Reel Script:**
```
- [HOOK 0-3s]: pattern interrupt + on-screen text (under 6 words) + spoken hook
- [PROBLEM 3-10s]: name the exact pain the viewer feels
- [SOLUTION 10-22s]: the specific method, show don't tell
- [CTA 22-30s]: ONE action ("save this", "comment X"). Hard cut, no fade
```

**WhatsApp Broadcast:**
```
- Reads like a personal message to ONE person, not an announcement
- One emoji max in the opener, under 130 words, one idea only
- Close with a human reply trigger ("reply 1 if you want the template")
```

#### User Prompt Template

```
INPUT CONTENT (source material, and possibly the user's own instructions):
"""
${content}
"""

Selected tone: ${tone}
Language: ${langLabel}
Generate these formats: ${formats.join(", ")}

Return ONLY this JSON structure:
{
  "tweet_thread": ["hook tweet under 280 chars", ...],
  "linkedin_post": "...",
  "reel_script": "[HOOK 0-3s]: ...",
  "newsletter_intro": "...",
  "whatsapp_broadcast": "..."
}
```

### Output Normalization

```typescript
const normalize = (raw: Record<string, unknown>) => {
  const out: Record<string, unknown> = {};
  
  // Tweet thread: ensure array
  if (Array.isArray(raw.tweet_thread)) {
    out.tweet_thread = raw.tweet_thread.filter((t) => typeof t === "string");
  } else if (typeof raw.tweet_thread === "string") {
    out.tweet_thread = [raw.tweet_thread];
  }
  
  // Other formats: ensure string
  for (const k of ["linkedin_post", "reel_script", "newsletter_intro", "whatsapp_broadcast"]) {
    if (typeof raw[k] === "string") out[k] = raw[k];
  }
  
  return out;
};
```

---

## ML Scoring Pipeline

### Overview

The ML scoring system evaluates generated content quality using a logistic regression model trained on engagement patterns from Indian creator content.

### Feature Extraction (`src/lib/ml/featureExtractor.ts`)

#### Feature Vector (20 Features)

```typescript
export interface FeatureVector {
  // Basic Metrics
  char_count: number;
  word_count: number;
  avg_word_length: number;
  sentence_count: number;
  avg_sentence_length: number;
  line_count: number;
  
  // Hook Analysis
  hook_has_question: number;     // First line contains "?"
  hook_has_number: number;       // First line contains digits
  hook_is_contrarian: number;    // Pattern-interrupt words
  
  // Engagement Signals
  cta_present: number;           // Call-to-action detected
  hashtag_count: number;
  hashtag_density: number;
  emoji_count: number;
  emoji_density: number;
  
  // Readability
  flesch_reading_ease: number;   // 0-100, higher = easier
  flesch_kincaid_grade: number;  // US grade level
  
  // Indian Creator Voice
  code_mix_ratio: number;        // Hinglish markers ratio
  
  // Quality Penalties
  buzzword_penalty: number;      // Corporate jargon count
  
  // Structure
  bullet_point_count: number;
  platform_length_fitness: number; // How well length matches platform
}
```

#### Hinglish Detection (60+ Markers)

```typescript
const HINGLISH_MARKERS = new Set([
  "bhai", "yaar", "matlab", "matlb", "dekho", "hoga", "hogi", "hoge", "hai", "hain",
  "kar", "karo", "kare", "karna", "karne", "nahi", "nhi", "agar", "toh", "to", "paise",
  "paisa", "jugaad", "baat", "sahi", "galat", "dost", "seekho", "samjho", "batao",
  "kyu", "kyun", "kaise", "kitna", "bohot", "bahut", "mast", "chalo", "suno", "log",
  "apna", "apni", "apne", "kya", "ye", "yeh", "wo", "woh", "ab", "abhi", "kabhi",
  "zyada", "jyada", "kam", "accha", "achha", "bura", "sirf", "lekin", "par", "ek",
  "do", "teen", "crore", "lakh", "rupaye", "rupees", "dukaan", "startup", "waale", "wali"
]);
```

#### Buzzword Detection (Corporate Jargon)

```typescript
const BUZZWORDS = [
  "synergy", "leverage", "leveraging", "holistic", "paradigm", "disruptive", "game-changer",
  "game changer", "wheelhouse", "circle back", "bandwidth", "low-hanging fruit", "boil the ocean",
  "deep dive", "touch base", "actionable insights", "seamlessly", "revolutionize", "pinnacle"
];
```

#### Contrarian Hook Detection

```typescript
const HOOK_CONTRARIAN_WORDS = new Set([
  "stop", "unpopular", "nobody", "mistake", "mistakes", "truth", "why", "warning",
  "secret", "secrets", "exposed", "don't", "dont", "never", "worst", "failed", "hate",
  "lies", "myth", "myths", "quit", "zero", "reality"
]);
```

#### CTA Detection

```typescript
const CTA_KEYWORDS = [
  "save", "share", "comment", "dm", "reply", "repost", "link", "click", "try",
  "follow", "subscribe", "thoughts", "let me know", "what do you think", "tell me",
  "drop a", "bookmark", "send this"
];
```

### Scoring Model (`src/lib/ml/scoringModel.ts`)

#### Model Architecture

```
Input Text → Feature Extraction → Standardization → Logistic Regression → Sigmoid → Score
                    │                    │                  │
                20 features      (x - mean) / scale    z = Σ(coeff_i * z_i) + intercept
```

#### Pre-trained Weights

```typescript
const DEFAULT_MODEL_WEIGHTS: MLModelWeights = {
  model_type: "LogisticRegression",
  scaler_mean: [420.0, 75.0, 4.8, 6.0, 12.5, 7.0, 0.4, 0.45, 0.35, 0.65, ...],
  scaler_scale: [220.0, 42.0, 0.6, 3.5, 6.0, 4.0, 0.48, 0.50, 0.47, 0.48, ...],
  coefficients: [0.15, 0.20, -0.35, 0.30, -0.55, 0.45, 0.95, 0.85, 1.10, 1.35, ...],
  intercept: 0.42,
  threshold: 0.5,
  feature_importances: {
    hook_is_contrarian: 1.10,
    cta_present: 1.35,
    buzzword_penalty: -1.85,
    platform_length_fitness: 1.05,
    hook_has_question: 0.95,
    // ...
  }
};
```

#### Feature Importance (Ranked)

| Feature | Coefficient | Impact |
|---------|-------------|--------|
| `buzzword_penalty` | -1.85 | Strongest negative (penalizes jargon) |
| `cta_present` | +1.35 | Strongest positive (rewards CTAs) |
| `hook_is_contrarian` | +1.10 | Rewards pattern-interrupt hooks |
| `platform_length_fitness` | +1.05 | Platform length optimization |
| `hook_has_question` | +0.95 | Curiosity hook |
| `hook_has_number` | +0.85 | Data/statistics in hook |
| `flesch_reading_ease` | +0.75 | Readability |
| `bullet_point_count` | +0.60 | Skimmable structure |
| `code_mix_ratio` | +0.50 | Authentic Hinglish |

#### Scoring Function

```typescript
export function scoreContentCandidate(
  text: string,
  platform = "linkedin_post",
  weights: MLModelWeights = DEFAULT_MODEL_WEIGHTS
): CandidateScoreResult {
  // 1. Extract features
  const features = extractCandidateFeatures(text, platform);
  const featureValues = FEATURE_NAMES.map((name) => features[name]);
  
  // 2. Standardize and compute log-odds
  let logOdds = weights.intercept;
  for (let i = 0; i < FEATURE_NAMES.length; i++) {
    const zScore = (featureValues[i] - weights.scaler_mean[i]) / weights.scaler_scale[i];
    logOdds += zScore * weights.coefficients[i];
  }
  
  // 3. Sigmoid to probability
  const probability = 1 / (1 + Math.exp(-logOdds));
  
  // 4. Scale to 0-100
  const score = Math.round(Math.max(15, Math.min(99, 30 + probability * 70)));
  const rating5 = Number((1.6 + probability * 3.4).toFixed(1));
  
  return {
    score,
    rating5,
    probability,
    isHighQuality: probability >= weights.threshold,
    features,
    topPositiveSignals,
    topNegativeSignals,
    summaryFeedback
  };
}
```

#### Output Structure

```typescript
interface CandidateScoreResult {
  score: number;              // 15-99 scale
  rating5: number;            // 1.6-5.0 scale
  probability: number;        // 0.0-1.0 raw probability
  isHighQuality: boolean;     // probability >= 0.5
  features: FeatureVector;    // All 20 extracted features
  topPositiveSignals: {       // Top 3 positive contributors
    feature: string;
    label: string;
    impact: number;
  }[];
  topNegativeSignals: {       // Top 3 negative contributors
    feature: string;
    label: string;
    impact: number;
  }[];
  summaryFeedback: string[];  // Actionable suggestions
}
```

#### Feedback Generation

```typescript
// Example feedback rules
if (features.buzzword_penalty > 0) {
  feedback.push("Remove corporate buzzwords (e.g. synergy, leverage) to boost authenticity.");
}
if (!features.hook_has_question && !features.hook_has_number && !features.hook_is_contrarian) {
  feedback.push("Strengthen opening line with a question, statistic, or pattern interrupt.");
}
if (!features.cta_present) {
  feedback.push("Add a clear Call-to-Action (e.g. Save this, Comment below, Reply with...).");
}
if (features.flesch_reading_ease < 50) {
  feedback.push("Sentences are too dense. Shorten lines to improve readability.");
}
if (features.code_mix_ratio > 0 && platform === "linkedin_post") {
  feedback.push("Authentic Hinglish markers detected — increases engagement with Indian audiences.");
}
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   profiles  │     │  user_preferences   │     │  subscriptions  │
├─────────────┤     ├─────────────────────┤     ├─────────────────┤
│ id (PK)     │──┐  │ user_id (FK→profiles)│──┐  │ user_id (FK)    │
│ email       │  │  │ preferred_tone      │  │  │ plan            │
│ full_name   │  │  │ preferred_language  │  │  │ status          │
│ created_at  │  │  │ preferred_formats   │  │  │ razorpay_id     │
│ updated_at  │  │  │ created_at          │  │  │ period_start    │
└─────────────┘  │  │ updated_at          │  │  │ period_end      │
                 │  └─────────────────────┘  │  └─────────────────┘
                 │                           │
                 │  ┌─────────────────────┐  │  ┌─────────────────┐
                 │  │   usage_history     │  │  │  monthly_usage  │
                 │  ├─────────────────────┤  │  ├─────────────────┤
                 └─▶│ user_id (FK)        │  └─▶│ user_id (FK)    │
                    │ input_content       │     │ year            │
                    │ tone                │     │ month           │
                    │ language            │     │ count           │
                    │ outputs (JSON)      │     └─────────────────┘
                    │ created_at          │
                    └─────────────────────┘
```

### Table Definitions

#### profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_preferences

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  preferred_tone TEXT,
  preferred_language TEXT CHECK (preferred_language IN ('EN', 'HI')),
  preferred_formats TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### usage_history

```sql
CREATE TABLE usage_history (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID REFERENCES profiles(id),
  input_content TEXT NOT NULL,
  tone TEXT NOT NULL,
  language TEXT NOT NULL,
  outputs JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID REFERENCES profiles(id),
  plan TEXT CHECK (plan IN ('free', 'creator', 'pro')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due')),
  razorpay_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### monthly_usage

```sql
CREATE TABLE monthly_usage (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  user_id UUID REFERENCES profiles(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, year, month)
);
```

---

## Authentication Flow

### Overview

Authentication is handled by Supabase Auth with support for:
- Email/password authentication
- Google OAuth
- Email verification
- Session management

### Login Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  User    │────▶│  Login.tsx   │────▶│  Supabase   │────▶│  Dashboard   │
└──────────┘     └──────────────┘     │    Auth     │     └──────────────┘
                      │               └─────────────┘            │
                      │                                           │
                      ▼                                           │
               ┌──────────────┐                                   │
               │ Email/Pass   │                                   │
               │ or Google    │                                   │
               └──────────────┘                                   │
                      │                                           │
                      ▼                                           │
               ┌──────────────┐                                   │
               │ Email        │     ┌──────────────┐              │
               │ Confirmed?   │──NO─▶│EmailConfirm  │──────────────┘
               └──────────────┘     │   Page       │
                      │             └──────────────┘
                      │ YES
                      ▼
               ┌──────────────┐
               │ Navigate to  │
               │  Dashboard   │
               └──────────────┘
```

### Auth Context

```typescript
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## API Reference

### POST /api/repurpose (Development)

Proxied through Vite dev server to avoid CORS issues in development.

**Request:**
```typescript
{
  content: string;      // 60-12000 characters
  tone: "Professional" | "Casual" | "Witty" | "Inspirational";
  language: "EN" | "HI";
  formats: ("tweet_thread" | "linkedin_post" | "reel_script" | "newsletter_intro" | "whatsapp_broadcast")[];
}
```

**Response:**
```typescript
{
  outputs: {
    tweet_thread?: string[];
    linkedin_post?: string;
    reel_script?: string;
    newsletter_intro?: string;
    whatsapp_broadcast?: string;
  };
  error?: string;
  failedFormats?: string[];
}
```

### POST /functions/v1/repurpose (Production)

Supabase Edge Function endpoint.

**Headers:**
```
Authorization: Bearer <supabase_anon_key>
Content-Type: application/json
```

**Request/Response:** Same as development endpoint.

---

## Deployment

### Prerequisites

1. Supabase project created
2. Environment variables configured
3. Edge function deployed
4. Database tables created

### Edge Function Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy edge function
supabase functions deploy repurpose

# Set secrets
supabase secrets set XAI_API_KEY=xai-...
supabase secrets set GEMINI_API_KEY=...
```

### Frontend Deployment

```bash
# Build
npm run build

# Deploy to Vercel/Netlify
# Or use Supabase hosting
```

### Environment Variables

**Frontend (.env.local):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

**Backend (Supabase Secrets):**
```env
XAI_API_KEY=xai-...
GEMINI_API_KEY=...
XAI_MODEL=grok-3-mini  # optional
```

---

## Performance Considerations

### Edge Function

- 30-second timeout per AI request
- 1 retry on 429/5xx errors
- Model chain fallback for Gemini

### Frontend

- React Query for caching
- Lazy loading for routes
- Skeleton loading states

### ML Model

- Client-side inference (no server round-trip)
- Pre-trained weights bundled
- Feature extraction optimized for text

---

## Security

### API Keys

- Never exposed to client (server-side only)
- Environment variables in Supabase secrets
- Vite proxy for local development

### Authentication

- Supabase Auth with JWT tokens
- Row-level security on database tables
- Email verification required

### Input Validation

- Content length: 60-12,000 characters
- Format whitelist validation
- SQL injection prevention via Supabase client

---

## Monitoring

### Logging

- Edge function logs via Supabase dashboard
- Request ID tracking for debugging
- Error telemetry

### Metrics

- AI provider response times
- Generation success rates
- ML score distributions

---

## Future Improvements

1. **Caching**: Redis caching for repeated content
2. **Queue**: Background job processing for large batches
3. **Analytics**: Detailed usage analytics dashboard
4. **A/B Testing**: Model weight experimentation
5. **Rate Limiting**: Per-user rate limiting with Redis
