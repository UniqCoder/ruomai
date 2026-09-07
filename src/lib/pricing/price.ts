import type { ProductListing } from "@/types/product";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const calculateTruePrice = (listing: ProductListing) => {
  const price = listing.price ?? 0;
  const shipping = listing.shippingCost ?? 0;
  const tax = listing.tax ?? 0;
  return price + shipping + tax;
};

export const calculateDealScore = (listing: ProductListing, observedRange: { min: number; max: number }) => {
  const price = listing.price;
  const center = (observedRange.min + observedRange.max) / 2;
  const distanceFromMedian = center - price;
  const relativeSavings = Math.max(0, (distanceFromMedian / center) * 100);

  let score = 60 + relativeSavings * 0.7 + (listing.trustScore - 50) * 0.4;

  if (price < observedRange.min * 0.8) {
    score -= 18;
  }

  if (listing.matchType === "LOW_CONFIDENCE") {
    score -= 12;
  }

  return clamp(Math.round(score), 0, 100);
};

export const getPriceWarnings = (listing: ProductListing, observedRange: { min: number; max: number }) => {
  const warnings: string[] = [];
  const deviation = ((observedRange.min - listing.price) / observedRange.min) * 100;

  if (listing.price < observedRange.min * 0.9) {
    warnings.push(`Price anomaly: ${Math.abs(Math.round(deviation))}% below the observed market floor.`);
  }

  if (listing.matchType === "LOW_CONFIDENCE") {
    warnings.push("Low-confidence product match; verify before purchasing.");
  }

  return warnings;
};

export const buildPriceHistory = (marketPrice: { min: number; max: number; typical: number }) => {
  const base = marketPrice.typical;
  return [
    { date: "2025-06-20", price: Math.round(base * 1.18) },
    { date: "2025-07-05", price: Math.round(base * 1.12) },
    { date: "2025-07-18", price: Math.round(base * 1.07) },
    { date: "2025-07-29", price: Math.round(base * 1.04) },
    { date: "2025-08-06", price: Math.round(base * 1.01) },
    { date: "2025-08-14", price: Math.round(base * 0.97) },
    { date: "2025-08-17", price: Math.round(base) },
  ];
};
