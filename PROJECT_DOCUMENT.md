# Ruom - Product Documentation

## Overview
**Ruom** is an AI-powered content repurposing tool built specifically for Indian creators, coaches, and influencers. It transforms a single piece of long-form content into multiple platform-native formats instantly.

**Tagline:** *One piece of content. Ruom it everywhere.*

**Website:** [ruom.in](https://ruom.in)

---

## What is Ruom?

Ruom is a content repurposing SaaS that takes any long-form content (blog posts, YouTube transcripts, podcast notes, raw ideas) and automatically generates:

- Tweet threads (5 tweets)
- LinkedIn posts
- Reel scripts (30-second scripts with hook, body, CTA)
- Newsletter intros
- WhatsApp broadcasts (under 200 words)

The tool supports both **English** and **Hindi (Hinglish)** output with multiple tone options: Professional, Casual, Witty, and Inspirational.

---

## The Problem

Indian creators and coaches face several challenges with content distribution:

1. **Time-consuming manual repurposing** - Converting one blog post into 5+ platform-specific formats takes 2-3 hours manually
2. **Inconsistent voice across platforms** - Hard to maintain the same tone when rewriting for different formats
3. **Language barrier** - Most AI tools don't support natural Hinglish ( Hindi + English mix) which is how Indians actually communicate
4. **Expensive international tools** - Tools like Copy.ai, Jasper cost $30-50/month in USD, which is expensive for Indian creators earning in INR
5. **No India-specific pricing** - Existing tools don't offer India-accessible pricing (₹399 vs $39)

**Target Users:**
- Content creators with 10K-500K followers
- Coaches and consultants building personal brands
- Newsletter writers
- Podcasters and YouTubers

---

## The Solution

Ruom provides an **AI-powered, one-click content repurposing** solution:

### Core Features

| Feature | Description |
|---------|-------------|
| **Multi-format Output** | Generate 5 content formats from single input |
| **Bilingual Support** | English + Natural Hinglish (not formal textbook Hindi) |
| **Tone Selection** | Professional, Casual, Witty, Inspirational |
| **One-click Copy** | Copy any output instantly to clipboard |
| **Format Filtering** | Choose which formats to generate |
| **Freemium Model** | 5 free repurposes/month, then upgrade |

### Technical Implementation
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase Edge Functions (Deno runtime)
- **AI Model:** Google Gemini 2.5 Flash via Lovable AI Gateway
- **Authentication:** Anonymous auth via Supabase (localStorage-based usage tracking)
- **Deployment:** Netlify/Vercel-ready

---

## The MVP (Minimum Viable Product)

### Current MVP Includes:

1. **Landing Page** (`/`)
   - Hero section with clear value proposition
   - Input textarea for content
   - Format selection chips (5 formats)
   - Tone selector (4 tones)
   - Language toggle (EN/HI)
   - Generate button with loading state
   - Output cards with copy functionality

2. **Pricing Page** (`/pricing`)
   - 3-tier pricing display
   - Feature comparison

3. **Backend Edge Function** (`/supabase/functions/repurpose`)
   - AI-powered content generation
   - Tool-calling for structured output
   - Error handling (rate limits, credits)
   - CORS support

4. **Usage Tracking**
   - LocalStorage-based free tier counting (5 uses)
   - Upgrade modal trigger at limit

---

## The MOAT (Competitive Advantage)

### 1. **India-First Approach**
- Natural Hinglish output (not formal Hindi)
- INR pricing (₹399 vs $39 international competitors)
- Built by Indian creator for Indian creators

### 2. **Speed & Simplicity**
- 10-second generation time
- No login required for free tier
- One-page interface - no complexity

### 3. **Format Completeness**
- WhatsApp broadcast format (unique - competitors don't have this)
- 30-second reel scripts with structure
- Thread format optimized for Twitter/X

### 4. **Tone Memory (Upcoming)**
- Pro users get brand voice training
- Consistent tone across all outputs

### 5. **Freemium Hook**
- 5 free uses hooks users before asking for payment
- Low friction entry

### Competitor Comparison

| Tool | Price | Hindi Support | India Pricing | WhatsApp Format |
|------|-------|---------------|---------------|-----------------|
| Ruom | ₹399/mo | ✅ Hinglish | ✅ | ✅ |
| Copy.ai | $36/mo | ❌ | ❌ USD | ❌ |
| Jasper | $49/mo | ❌ | ❌ USD | ❌ |
| Buffer | $15/mo | ❌ | ❌ USD | ❌ |

---

## What's Done ✅

### Frontend
- [x] React + Vite + TypeScript setup
- [x] Tailwind CSS + shadcn/ui components
- [x] Top navigation with branding
- [x] Hero section with value proposition
- [x] Content input textarea
- [x] Format selection chips (5 formats)
- [x] Tone selector (4 tones)
- [x] Language toggle (EN/HI)
- [x] Generate button with loading states
- [x] Output cards with copy functionality
- [x] Skeleton loading states
- [x] Upgrade modal for paywall
- [x] Pricing page with 3 tiers
- [x] Footer with branding
- [x] Responsive design (mobile + desktop)

### Backend
- [x] Supabase Edge Function setup
- [x] AI integration (Gemini via Lovable Gateway)
- [x] Tool-calling for structured output
- [x] Error handling (400, 402, 429, 500)
- [x] CORS configuration
- [x] Content filtering by selected formats

### Business Logic
- [x] LocalStorage usage tracking
- [x] Free tier limit (5 repurposes)
- [x] Upgrade modal trigger
- [x] Paywall implementation

### Infrastructure
- [x] Supabase project setup
- [x] Environment variables configured
- [x] Deployment ready

---

## What's Remaining 🚧

### High Priority
- [ ] **Authentication System**
  - User registration/login
  - Persist usage across devices
  - Account management

- [ ] **Payment Integration**
  - Razorpay/Stripe integration
  - Subscription management
  - Webhook handling for payments

- [ ] **Database Schema**
  - Users table
  - Usage tracking (server-side)
  - Subscription status
  - Generated content history

### Medium Priority
- [ ] **Additional Output Formats**
  - Instagram carousel scripts
  - YouTube Shorts scripts
  - Blog post summaries
  - Quote cards

- [ ] **Advanced Features**
  - Tone memory / brand voice training
  - Bulk upload (CSV, text files)
  - Content scheduling (integrations)
  - History/saved outputs

- [ ] **Team Features (Pro Tier)**
  - Team seats (3 users)
  - Shared brand voice
  - Usage analytics dashboard

### Low Priority
- [ ] **Marketing Website Enhancements**
  - Testimonials section
  - Use cases / examples
  - Blog section
  - SEO optimization

- [ ] **API Access**
  - Public API for developers
  - API key management
  - Rate limiting

- [ ] **Mobile App**
  - React Native / PWA
  - Push notifications

### Technical Debt
- [ ] **Testing**
  - Unit tests (Vitest setup exists)
  - Integration tests
  - E2E tests

- [ ] **Monitoring**
  - Error tracking (Sentry)
  - Usage analytics
  - AI cost monitoring

- [ ] **Performance**
  - Edge caching
  - Output caching (don't regenerate same content)
  - Image optimization

---

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React App     │──────▶  Supabase Edge   │──────▶  Lovable AI    │
│   (Vite/TS)     │      │  Function (Deno) │      │  Gateway         │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                                               │
        │                                               ▼
        │                                        ┌─────────────────┐
        │                                        │  Google Gemini  │
        │                                        │  2.5 Flash      │
        │                                        └─────────────────┘
        ▼
┌─────────────────┐
│  LocalStorage   │
│  (Usage Count)  │
└─────────────────┘
```

---

## File Structure

```
d:/ruom/
├── src/
│   ├── components/
│   │   ├── Repurposer.tsx      # Main UI component
│   │   ├── TopNav.tsx          # Navigation
│   │   ├── Footer.tsx          # Footer
│   │   ├── OutputCard.tsx      # Output display
│   │   ├── UpgradeModal.tsx    # Paywall modal
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx           # Landing page
│   │   ├── Pricing.tsx         # Pricing page
│   │   └── NotFound.tsx        # 404 page
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts       # Supabase client
│   ├── App.tsx                 # Router setup
│   └── main.tsx                # Entry point
├── supabase/
│   └── functions/
│       └── repurpose/
│           └── index.ts        # AI edge function
├── .env                        # Environment variables
└── package.json                # Dependencies
```

---

## Environment Variables

```env
VITE_SUPABASE_PROJECT_ID="qzialvaoduwiqknyqhfo"
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="https://qzialvaoduwiqknyqhfo.supabase.co"
```

**Backend (Supabase Secrets):**
```
LOVABLE_API_KEY=<for AI gateway>
```

---

## Next Steps

1. **Immediate:** Set up authentication (Supabase Auth)
2. **Week 1:** Integrate Razorpay for payments
3. **Week 2:** Build user dashboard with history
4. **Week 3:** Add more output formats
5. **Month 2:** Launch on Product Hunt, Indie Hackers

---

**Built by:** Om  
**Made for:** Indian creators  
**Status:** MVP Complete - Ready for Beta Testing
