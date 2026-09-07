<div align="center">

# Ruom AI

**The AI Content Repurposing Engine Built for Indian Creators**

*One piece of content. Ruom it everywhere.*

</div>

---

## What is Ruom?

Ruom is a content repurposing platform that transforms long-form content into platform-native formats in ~10 seconds. Built specifically for Indian creators, coaches, founders, and D2C brands who need to maintain presence across X/Twitter, LinkedIn, Instagram, WhatsApp, and newsletters.

Unlike generic AI tools, Ruom writes like a power user of each platform—not like an AI converting content. It understands Indian creator voice, supports natural Hinglish, and includes a built-in ML quality scoring system.

---

## Core Features

### Multi-Format Content Generation

| Format | Description | Platform Optimization |
|--------|-------------|----------------------|
| **Tweet Thread** | 5-tweet thread with escalating narrative | First tweet under 280 chars, no numbering (platform does it), 0-2 hashtags |
| **LinkedIn Post** | Professional long-form with story arc | First 2 lines hook, short paragraphs, 3-5 niche hashtags at end |
| **Reel Script** | 30-second structured script | [HOOK 0-3s] → [PROBLEM] → [SOLUTION] → [CTA] with timing markers |
| **Newsletter Intro** | Scene-setting opener under 200 words | Curiosity gap by line 2, personal voice, value tease ending |
| **WhatsApp Broadcast** | Conversational message under 130 words | Reads like personal message to ONE person, reply triggers |

### Bilingual Support

- **English**: Conversational English with Indian creator's voice
- **Hinglish**: Natural Hindi-English mix ("Bhai, ye try karo")—not textbook Hindi

### Tone Customization

- **Professional** — B2B and corporate content
- **Casual** — Relatable, conversational style
- **Witty** — Engaging with humor and personality
- **Inspirational** — Motivational and uplifting

### ML Quality Scoring System

Every generated piece is scored by an in-house ML model trained on content engagement patterns:

- **20 features** extracted: hook analysis, readability, Hinglish detection, CTA presence, buzzword penalty
- **Actionable feedback**: "Add a clear Call-to-Action", "Strengthen opening with a question"
- **Platform-specific optimization**: Length fitness scoring per platform

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Repurposer  │  │   Output    │  │    Auth     │  │   ML Scoring Model  │ │
│  │   Component │──│    Cards    │  │   Context   │  │  (20-feature infer) │ │
│  └──────┬──────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         │                                                                    │
│         │ POST { content, tone, language, formats }                          │
│         ▼                                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE EDGE FUNCTION (Deno)                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          AI Provider Chain                               ││
│  │   ┌─────────────┐                    ┌─────────────────────────────────┐ ││
│  │   │  xAI (Grok) │ ──fallback──────▶  │  Google Gemini                  │ ││
│  │   │ grok-3-mini │                    │  gemini-3.6-flash → flash-lite  │ ││
│  │   └─────────────┘                    └─────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│         │                                                                    │
│         │ JSON { tweet_thread: [...], linkedin_post: "...", ... }           │
│         ▼                                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE DATABASE                                  │
│  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌─────────────────┐ │
│  │    profiles   │ │user_preferences│ │usage_history  │ │  subscriptions  │ │
│  └───────────────┘ └────────────────┘ └───────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI framework |
| **Build** | Vite 5 | Fast dev server, HMR, production builds |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with accessible components |
| **State** | React Query + Context API | Server state + local state management |
| **Auth** | Supabase Auth | Email/password + Google OAuth |
| **Backend** | Supabase Edge Functions | Serverless Deno runtime |
| **AI** | xAI Grok + Google Gemini | Multi-provider with automatic failover |
| **ML** | Custom Logistic Regression | 20-feature content quality model |
| **Database** | Supabase PostgreSQL | User data, preferences, usage history |

---

## Project Structure

```
ruom/
├── src/
│   ├── components/
│   │   ├── Repurposer.tsx          # Main content generation UI
│   │   ├── OutputCard.tsx          # Generated content display
│   │   ├── ScoreBreakdownModal.tsx # ML score visualization
│   │   ├── TopNav.tsx              # Navigation
│   │   └── ui/                     # shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx               # Landing page with Repurposer
│   │   ├── Dashboard.tsx           # User workspace
│   │   ├── Login.tsx               # Authentication
│   │   └── Pricing.tsx             # Pricing tiers
│   ├── lib/
│   │   ├── ml/
│   │   │   ├── featureExtractor.ts # 20-feature extraction + Hinglish detection
│   │   │   └── scoringModel.ts     # ML inference + ranking
│   │   └── ai/
│   │       └── identifyProduct.ts  # Content classification
│   ├── contexts/
│   │   └── AuthContext.tsx         # Supabase auth state
│   └── integrations/
│       └── supabase/
│           ├── client.ts           # Supabase client setup
│           └── types.ts            # Database schema types
├── supabase/
│   └── functions/
│       └── repurpose/
│           └── index.ts            # AI generation edge function
├── ml/                             # ML training pipeline
│   ├── train.py                    # Model training
│   ├── features.py                 # Feature engineering
│   └── artifacts/                  # Trained model weights
└── public/                         # Static assets
```

---

## ML Scoring System

Ruom includes a built-in content quality scoring model trained on engagement patterns from Indian creator content.

### Features Extracted

| Category | Features | Impact |
|----------|----------|--------|
| **Hook Analysis** | `hook_has_question`, `hook_has_number`, `hook_is_contrarian` | +0.95 to +1.10 |
| **Engagement** | `cta_present`, `hashtag_count`, `emoji_count` | +1.35 (CTA) |
| **Readability** | `flesch_reading_ease`, `flesch_kincaid_grade` | +0.75 |
| **Indian Voice** | `code_mix_ratio` (Hinglish detection) | +0.50 |
| **Structure** | `bullet_point_count`, `platform_length_fitness` | +0.60 to +1.05 |
| **Penalties** | `buzzword_penalty` | -1.85 |

### Hinglish Detection

60+ Hinglish markers recognized: `bhai`, `yaar`, `matlab`, `dekho`, `hoga`, `jugaad`, `sahi`, `kya`, etc.

### Output

```typescript
{
  score: 78,                    // 0-100 scale
  rating5: 4.2,                 // 1.0-5.0 scale
  probability: 0.72,            // Raw model probability
  isHighQuality: true,
  topPositiveSignals: [
    { feature: "cta_present", label: "Actionable Call-to-Action", impact: 0.42 }
  ],
  topNegativeSignals: [
    { feature: "buzzword_penalty", label: "Corporate Jargon", impact: -0.28 }
  ],
  summaryFeedback: [
    "Remove corporate buzzwords (e.g. synergy, leverage) to boost authenticity."
  ]
}
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (id, email, full_name) |
| `user_preferences` | Saved tone, language, format preferences |
| `usage_history` | All generated content with inputs/outputs |
| `subscriptions` | Plan (free/creator/pro), status, billing cycle |
| `monthly_usage` | Rate limiting counter per user per month |

---

## Quick Start

```bash
# Clone
git clone https://github.com/UniqCoder/ruomai.git
cd ruomai

# Install
npm install

# Configure environment
cp .env.example .env.local
# Add your Supabase URL and anon key

# Run dev server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

For the edge function, set these as Supabase secrets:
```bash
supabase secrets set XAI_API_KEY=xai-...
supabase secrets set GEMINI_API_KEY=...
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run test suite |

---

## Why Ruom vs Generic AI Tools

| Feature | Ruom | Generic AI |
|---------|------|------------|
| Hinglish Support | 60+ markers, natural code-mix | None |
| WhatsApp Broadcast | Dedicated format with reply triggers | Not supported |
| Platform Playbooks | Specific per-platform optimization | Generic templates |
| Indian Creator Voice | Built into prompts | Western-centric |
| ML Quality Scoring | 20-feature model with actionable feedback | None |
| Buzzword Penalty | Penalizes corporate jargon | No penalties |
| Contrarian Hook Detection | Rewards pattern-interrupt hooks | Not detected |
| Pricing | ₹399/mo | $36-49/mo |

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for Indian creators**

[GitHub](https://github.com/UniqCoder/ruomai) · [Live Demo](https://ruom.in)

</div>
