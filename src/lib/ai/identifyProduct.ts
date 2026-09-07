import { getBestCatalogMatch } from "@/lib/search/providers";
import type { ProductIdentity, ProductSearchConstraints } from "@/types/product";

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const parseNaturalLanguageConstraints = (text: string): ProductSearchConstraints => {
  const output: ProductSearchConstraints = { currency: "INR" };
  const normalized = text.toLowerCase();

  const matchPrice = normalized.match(/(?:under|below|upto|up to|max|budget)\s*(?:₹|inr)?\s*([0-9,]+)/i);
  if (matchPrice) {
    output.maxPrice = Number(matchPrice[1].replace(/,/g, ""));
  }

  const trustMatch = normalized.match(/(?:trust|score)\s*[:=]?\s*(\d{1,3})/i);
  if (trustMatch) {
    output.minimumTrustScore = Number(trustMatch[1]);
  }

  if (normalized.includes("free shipping") || normalized.includes("with free shipping")) {
    output.freeShipping = true;
  }

  if (normalized.includes("inr") || normalized.includes("₹")) {
    output.currency = "INR";
  }

  return output;
};

export const identifyProduct = (input: string, imageName?: string): { identity: ProductIdentity; constraints: ProductSearchConstraints } => {
  const trimmed = input.trim();
  const constraints = parseNaturalLanguageConstraints(trimmed || "");
  const cleanedInput = trimmed || imageName || "nike air max dn";
  const productCandidate = getBestCatalogMatch(cleanedInput) ?? getBestCatalogMatch("nike air max dn");

  if (!productCandidate) {
    return {
      identity: {
        brand: "Unknown",
        product_name: "Unidentified product",
        model: "Not verified",
        sku: "Not available",
        category: "General",
        variant: "Not verified",
        color: "Not available",
        confidence: 0.15,
        attributes: { source: "manual review needed" },
        search_queries: [cleanedInput],
      },
      constraints,
    };
  }

  const confidence = trimmed.includes(productCandidate.product_name) || trimmed.includes(productCandidate.brand)
    ? 0.96
    : 0.88;

  const identity: ProductIdentity = {
    brand: productCandidate.brand,
    product_name: productCandidate.product_name,
    model: productCandidate.model,
    sku: productCandidate.sku,
    category: productCandidate.category,
    variant: productCandidate.variant,
    color: productCandidate.color,
    confidence,
    attributes: {
      ...productCandidate.attributes,
      source: "Catalog match",
    },
    search_queries: [
      productCandidate.product_name,
      `${productCandidate.brand} ${productCandidate.model}`,
      `${productCandidate.brand} ${productCandidate.category}`,
    ],
    imageUrl: productCandidate.imageUrl,
  };

  if (/\b(?:https?:\/\/|www\.)/i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const host = normalizeText(url.hostname);
      const hostBrand = host.includes("nike") ? "Nike" : host.includes("apple") ? "Apple" : host.includes("sony") ? "Sony" : host.includes("adidas") ? "Adidas" : identity.brand;
      identity.brand = hostBrand;
      identity.confidence = Math.min(0.98, identity.confidence + 0.02);
    } catch {
      // Ignore invalid URLs; the fallback heuristics still hold.
    }
  }

  return { identity, constraints };
};
