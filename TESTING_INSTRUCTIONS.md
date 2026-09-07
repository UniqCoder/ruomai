# Testing Instructions for Bug Fix Verification

## Overview

This document provides step-by-step instructions to verify that the content repurposing engine bug has been fixed and that the Gemini API is working correctly.

## Prerequisites

1. ✅ Gemini API key has been added to `.env.local`
2. ✅ Development server is running (`npm run dev`)
3. ✅ Supabase CLI is installed (for edge function testing)

## Test 1: Frontend Application Test

### Steps:

1. **Open the application**:
   - Navigate to `http://localhost:8081` in your browser

2. **Enter test content**:
   - Paste the following content into the textarea:
   ```
   The biggest mistake Indian SaaS founders make is pricing in USD and converting directly to INR. $29 becomes ₹2400, which feels like an enterprise purchase. Instead, price at ₹499 for impulse buys on UPI. Anchor against local software like Tally and Zoho, not Silicon Valley tools. Enable UPI AutoPay before credit cards. Offer single-seat starter tiers under ₹999.
   ```

3. **Select formats**:
   - Keep all 5 formats selected (tweet_thread, linkedin_post, reel_script, newsletter_intro, whatsapp_broadcast)

4. **Select tone**:
   - Choose "Casual"

5. **Select language**:
   - Choose "EN" (English)

6. **Click "Ruom It"**:
   - Wait for the AI to generate content (should take 5-10 seconds)

### Expected Results:

✅ **Success Criteria**:
- The output should contain 5 different repurposed content formats
- Each format should be tailored to the input content
- No developer bio should appear in any output
- The content should be about SaaS pricing, not about a computer engineering student

❌ **Failure Criteria**:
- Any output contains the developer's bio
- Error message: "AI service is unavailable"
- Generic placeholder text unrelated to the input

## Test 2: Edge Function Direct Test

### Steps:

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Start the edge function locally**:
   ```bash
   cd supabase/functions/repurpose
   supabase functions serve
   ```

3. **Test with curl**:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/repurpose \
     -H "Content-Type: application/json" \
     -d '{
       "content": "The biggest mistake Indian SaaS founders make is pricing in USD and converting directly to INR. $29 becomes ₹2400, which feels like an enterprise purchase. Instead, price at ₹499 for impulse buys on UPI.",
       "tone": "Casual",
       "language": "EN",
       "formats": ["tweet_thread", "linkedin_post"]
     }'
   ```

### Expected Results:

✅ **Success Criteria**:
- HTTP 200 response
- JSON response with `outputs` object
- Each requested format present in outputs
- Content is relevant to SaaS pricing
- No developer bio in the response

❌ **Failure Criteria**:
- HTTP 500 error with "GEMINI_API_KEY not configured"
- Response contains developer bio
- Empty or malformed JSON response

## Test 3: Hinglish Test

### Steps:

1. **Enter Hinglish content**:
   ```
   Bhai, Indian creators ke liye consistency ka matlab daily post nahi hai. Ek sustainable system banana hai: Sunday ko 4 reels batch record karo, ek YouTube video ko 5 tweets, 1 LinkedIn post, aur WhatsApp broadcast mein repurpose karo. Sabko schedule kar do. Matlab 1 ghanta per day spend karke bhi full-time reach mil sakti hai.
   ```

2. **Select language**: "HI" (Hinglish)

3. **Click "Ruom It"**

### Expected Results:

✅ **Success Criteria**:
- Output contains mix of Hindi and English (Hinglish)
- Natural conversational tone
- Content about creator consistency, not developer bio

## Test 4: Error Handling Test

### Steps:

1. **Temporarily remove GEMINI_API_KEY** from `.env.local`

2. **Restart the edge function**

3. **Run the same test as Test 1**

### Expected Results:

✅ **Success Criteria**:
- Warning toast: "AI service is unavailable right now. Showing a local draft instead."
- Fallback content is generated (not empty)
- Fallback content is based on the input (not developer bio)
- No crash or blank screen

## Test 5: Quality Scoring Test

### Steps:

1. **Enter generic content**:
   ```
   Content creation is very important for modern businesses. In today's digital era, everyone needs to build a personal brand. You should post regularly on LinkedIn and Twitter to increase your network and get more leads.
   ```

2. **Click "Ruom It"**

3. **Check the quality note** at the top of the outputs

### Expected Results:

✅ **Success Criteria**:
- Quality note appears: "Quality pass rewrote X draft(s) that felt generic."
- Output content is more specific and actionable
- No corporate buzzwords like "In today's digital era"

## Troubleshooting

### If you see "GEMINI_API_KEY not configured":

1. Verify `.env.local` has the key
2. Restart the edge function
3. Check Supabase Dashboard → Functions → Secrets

### If you see the developer bio:

1. The API key might be invalid - verify it at Google AI Studio
2. The key might have quota issues - check your Gemini API dashboard
3. Clear browser cache and retry

### If you get CORS errors:

1. Ensure you're using the correct Supabase URL
2. Check that the edge function is running

## Success Checklist

- [ ] Frontend generates content without errors
- [ ] No developer bio appears in outputs
- [ ] Content is relevant to input
- [ ] All 5 formats are generated correctly
- [ ] Hinglish works when selected
- [ ] Quality scoring rewrites generic content
- [ ] Fallback works when API key is removed

## Next Steps After Verification

1. Deploy the edge function to Supabase production:
   ```bash
   supabase functions deploy repurpose
   ```

2. Add the GEMINI_API_KEY to Supabase Dashboard → Functions → Secrets

3. Test the production endpoint

4. Monitor for any API quota issues

## Contact

If issues persist, check:
- Supabase Dashboard → Functions → Logs
- Browser console for errors
- Network tab for API responses
