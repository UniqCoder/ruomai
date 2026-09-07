# Ruom

Ruom is an AI content repurposing app for Indian creators, coaches, founders, and D2C brands.

## What it does
- Turn one long-form idea into platform-native outputs
- Generate X threads, LinkedIn posts, Reel scripts, newsletter intros, and WhatsApp broadcasts
- Keep the tone tuned for Indian audiences and Hinglish-friendly language
- Fall back to local draft generation if the backend is unavailable

## Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn-style UI
- Supabase Edge Function for AI generation
- Supabase Auth and database tables for usage tracking and preferences

## Local setup
1. Install dependencies:
   `npm install`
2. Add your Supabase values to `.env.local`:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_PUBLISHABLE_KEY`
   `GEMINI_API_KEY` for the edge function
3. Start the app:
   `npm run dev`

## Scripts
- `npm run dev` - start the app in development mode
- `npm run build` - build the app for production
- `npm run lint` - run ESLint
- `npm test` - run the test suite
