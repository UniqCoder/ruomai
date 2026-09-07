import type { MatchType, ProductIdentity, ProductListing } from "@/types/product";

const normalize = (value: string = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export const calculateMatchScore = (
  identity: ProductIdentity,
  listing: { brand?: string; model?: string; sku?: string; title?: string },
) => {
  let score = 0;

  if (listing.brand && normalize(listing.brand) === normalize(identity.brand)) score += 28;
  if (listing.model && normalize(listing.model).includes(normalize(identity.model))) score += 24;
  if (listing.model && normalize(listing.model) === normalize(identity.model)) score += 12;
  if (listing.sku && identity.sku && normalize(listing.sku) === normalize(identity.sku)) score += 20;
  if (listing.title && normalize(listing.title).includes(normalize(identity.product_name))) score += 12;

  const sameClass = listing.title && identity.category && normalize(listing.title).includes(normalize(identity.category));
  if (sameClass) score += 8;

  return Math.min(100, Math.max(0, score));
};

export const classifyMatch = (score: number): MatchType => {
  if (score >= 90) return "EXACT";
  if (score >= 72) return "VARIANT";
  if (score >= 55) return "SIMILAR";
  return "LOW_CONFIDENCE";
};

export const getMatchReasons = (identity: ProductIdentity, listing: ProductListing) => {
  const reasons: string[] = [];

  if (normalize(listing.brand ?? "") === normalize(identity.brand)) {
    reasons.push("Brand matched");
  }

  if (listing.model && normalize(listing.model).includes(normalize(identity.model))) {
    reasons.push("Model number matched");
  }

  if (listing.sku && identity.sku && normalize(listing.sku) === normalize(identity.sku)) {
    reasons.push("SKU matched");
  }

  if (listing.title && listing.title.toLowerCase().includes(identity.product_name.toLowerCase())) {
    reasons.push("Product specifications matched");
  }

  if (reasons.length === 0) {
    reasons.push("Insufficient evidence for exact verification");
  }

  return reasons;
};
