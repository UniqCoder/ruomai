import { describe, it, expect } from "vitest";
import { extractCandidateFeatures } from "@/lib/ml/featureExtractor";
import { scoreContentCandidate, rankContentCandidates } from "@/lib/ml/scoringModel";

describe("ML Feature Extractor & Scoring Model", () => {
  const highQualityPost = `90% of early-stage SaaS founders in India make this pricing mistake:

They convert USD directly to INR instead of localizing.

Here is the 3-step fix:
- Anchor against local tools (₹499 on UPI)
- Add single-seat tiers
- Focus on distribution

Save this post if you found it helpful!`;

  const poorQualityPost = `In today's dynamic paradigm, leveraging holistic synergy is mission-critical to maximize stakeholder bandwidth. We must touch base on our core competencies.`;

  it("extracts all 20 quantitative features accurately", () => {
    const feats = extractCandidateFeatures(highQualityPost, "linkedin_post");

    expect(feats.word_count).toBeGreaterThan(20);
    expect(feats.hook_has_number).toBe(1);
    expect(feats.cta_present).toBe(1);
    expect(feats.flesch_reading_ease).toBeGreaterThan(0);
    expect(feats.platform_length_fitness).toBeGreaterThan(0);
    expect(feats.buzzword_penalty).toBe(0);
  });

  it("scores high quality posts significantly higher than buzzword fluff", () => {
    const highScore = scoreContentCandidate(highQualityPost, "linkedin_post");
    const lowScore = scoreContentCandidate(poorQualityPost, "linkedin_post");

    expect(highScore.score).toBeGreaterThan(lowScore.score);
    expect(highScore.isHighQuality).toBe(true);
    expect(lowScore.features.buzzword_penalty).toBeGreaterThan(0);
  });

  it("accurately ranks candidate variants in descending order", () => {
    const candidates = [
      { text: poorQualityPost, title: "Buzzword Fluff" },
      { text: highQualityPost, title: "High Hook Structure" },
    ];

    const ranked = rankContentCandidates(candidates, "linkedin_post");

    expect(ranked[0].text).toBe(highQualityPost);
    expect(ranked[0].evaluation.score).toBeGreaterThan(ranked[1].evaluation.score);
  });
});
