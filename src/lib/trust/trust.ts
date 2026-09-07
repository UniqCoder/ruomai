import type { ProductListing } from "@/types/product";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const calculateTrustScore = (listing: ProductListing, observedMarketRange?: { min: number; max: number }) => {
  let score = 48;

  const domain = listing.retailerDomain.toLowerCase();
  if (domain.includes("amazon") || domain.includes("flipkart") || domain.includes("myntra") || domain.includes("retail") || domain.includes("official")) {
    score += 12;
  }

  if (listing.warranty) score += 12;
  if (listing.returnPolicy) score += 10;
  if (listing.availability && listing.availability.toLowerCase().includes("instock")) score += 6;
  if (listing.evidence.length >= 3) score += 5;

  const priceRatio = observedMarketRange ? (listing.price / observedMarketRange.max) * 100 : 100;
  if (priceRatio < 82) score -= 16;

  if (!listing.retailerName || listing.retailerName.length < 2) score -= 10;

  return clamp(Math.round(score), 0, 100);
};

export const buildTrustReasons = (listing: ProductListing) => {
  const reasons: string[] = [];

  if (listing.retailerDomain.toLowerCase().includes("amazon") || listing.retailerDomain.toLowerCase().includes("flipkart")) {
    reasons.push("Known marketplace retailer");
  } else {
    reasons.push("Official retailer or brand-aligned domain");
  }

  if (listing.warranty) reasons.push("Warranty information available");
  if (listing.returnPolicy) reasons.push("Return policy available");
  if (listing.availability) reasons.push("Stock status available");

  return reasons.length ? reasons : ["Insufficient trust evidence"];
};
