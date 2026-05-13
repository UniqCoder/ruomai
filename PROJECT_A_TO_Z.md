# RUOM Project A to Z

## 1) Snapshot
- Product: Ruom, an AI content repurposing web app for Indian creators, coaches, and entrepreneurs.
- Core promise: 1 long-form input -> multiple platform-native outputs in seconds.
- Primary users: creators, coaches, consultants, and D2C founders who publish on LinkedIn, X, Instagram, WhatsApp, and newsletters.

## 2) What Problem It Solves
- Manual repurposing takes 2-4 hours per input.
- Voice consistency breaks across platforms.
- Most AI tools are USD priced and not tailored for Hinglish/Indian contexts.

## 3) What It Produces (Current Formats)
- X/Twitter thread (5 tweets)
- LinkedIn post
- Instagram Reel script (30s)
- Newsletter intro
- WhatsApp broadcast

## 4) Current User Flow (MVP)
1. User opens landing page.
2. Pastes content into a textarea.
3. Selects formats, tone, and language.
4. Clicks Generate.
5. Receives output cards with copy buttons.
6. If free usage limit is reached, an upgrade modal appears.

## 5) What Is Implemented
### Frontend
- React + Vite + TypeScript setup
- Tailwind CSS + shadcn/ui component system
- Landing page and pricing page
- Format selection, tone selection, language toggle
- Generate button with loading/skeleton states
- Output cards with copy actions
- Upgrade modal for paywall messaging
- Responsive layout

### Backend
- Supabase Edge Function in Deno
- Google Gemini API call (model: gemini-2.0-flash in code)
- Prompt assembly using a system prompt + user content
- JSON parsing with markdown cleanup
- CORS, validation, and error handling

### Business Logic
- Free tier usage tracking via localStorage
- Format filtering based on user selection

## 6) What Is Not Implemented (Gaps)
### Revenue & Payments
- No live payment gateway integration (Razorpay/Stripe)
- No subscription lifecycle or webhook handling
- No plan-based access control

### Accounts & Persistence
- No real auth or user accounts
- No server-side usage tracking
- No saved history of generated outputs

### Product Depth
- No brand voice training or style memory
- Limited format coverage (no carousel, Shorts, summaries, quote cards)
- No team/collaboration features

### Compliance & Trust
- No Terms/Privacy pages wired in
- No rate limiting tied to real user IDs

## 7) Architecture (A to Z)
- UI: Vite + React SPA
- API: Supabase Edge Function (Deno)
- AI: Google Gemini API via generateContent
- State: client-side only (localStorage)
- Data: no persisted DB tables used yet

## 8) How Content Generation Works (Current)
1. Client sends content, tone, language, formats to edge function.
2. Edge function builds a system prompt + user prompt.
3. Gemini returns JSON formatted outputs.
4. Server filters to selected formats and returns response.

Note: The system prompt was recently expanded. The user prompt still requires JSON output. If the model starts returning non-JSON, parsing will fail. Align these to avoid runtime errors.

## 9) Local Dev Setup
- Install: npm install
- Run: npm run dev
- Build: npm run build
- Test: npm run test

## 10) Deployment Plan (Frontend + Backend)
### Frontend
- Host on Vercel or Netlify
- Set environment variables for Supabase URL and key
- Ensure build command is `npm run build` and output is `dist/`

### Backend
- Deploy Supabase Edge Function
- Configure `GEMINI_API_KEY` in Supabase environment
- Add rate limiting and logs for production

### To Start Earning
- Integrate Razorpay or Stripe for INR subscriptions
- Add auth (Supabase auth or email OTP)
- Gate output generation based on subscription state
- Store usage and outputs in Supabase DB

## 11) Why People Would Pay
- Saves 2-4 hours per content piece
- Indian context output (Hinglish, local references)
- Multi-platform outputs in one click
- Faster content velocity = more growth and leads
- INR pricing that feels affordable vs USD tools

## 12) Weaknesses / Risks
- No server-side usage tracking (easy to bypass)
- No auth means no cross-device continuity
- AI output quality depends on prompt alignment
- Limited format options compared to competitors
- Reliance on single AI provider and model

## 13) Improvements (Short-Term)
- Implement payments + plan enforcement
- Add real auth with user accounts
- Store output history for reuse
- Expand format options (carousel, Shorts, summaries)
- Add quality guardrails (min length, style checks)

## 14) Improvements (Medium-Term)
- Brand voice training and custom prompt layers
- Team workspace with shared templates
- Analytics: usage metrics and best-performing formats
- Auto-scheduler integrations (Buffer, Hootsuite)

## 15) Goated Features to Consider
1. Creator Voice Clone
   - Train on past posts and enforce tone and phrase patterns.
2. Festival Timing Engine
   - Auto suggests best posting days based on Indian calendar and trends.
3. WhatsApp Broadcast Generator + Templates
   - Ready-to-send CTA layouts and follow-up sequences.
4. Content-to-Offer Mapper
   - Converts content into offer pitch variants with pricing anchors.
5. UGC Hook Library
   - Auto-suggests 10 hooks in the creator's niche every time.

## 16) Pricing & Monetization Ideas
- Free: 5 repurposes/month
- Starter: Rs 399/month, 50 repurposes
- Pro: Rs 999/month, unlimited + brand voice
- Agency: Rs 2999/month, team seats + analytics

## 17) What To Validate Next
- Conversion from free to paid (target 5-10%)
- Output quality satisfaction (ask for thumbs up/down)
- Top 2 formats that drive most value for users

## 18) Actionable Next Steps
1. Align prompt output format with JSON response requirement.
2. Add auth + subscriptions.
3. Store usage and output history.
4. Add 2 new formats (carousel + Shorts) to expand perceived value.
