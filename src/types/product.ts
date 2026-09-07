export type MatchType = "EXACT" | "VARIANT" | "SIMILAR" | "LOW_CONFIDENCE";

export interface Evidence {
  type: string;
  sourceName: string;
  sourceUrl: string;
  claim: string;
  confidence: number;
  checkedAt: string;
}

export interface ProductIdentity {
  brand: string;
  product_name: string;
  model: string;
  sku: string;
  category: string;
  variant: string;
  color: string;
  confidence: number;
  attributes: Record<string, string | number | boolean>;
  search_queries: string[];
  imageUrl?: string;
}

export interface ProductSearchConstraints {
  maxPrice?: number;
  currency?: string;
  minimumTrustScore?: number;
  freeShipping?: boolean;
  budget?: number;
}

export interface ProductListing {
  retailerName: string;
  retailerDomain: string;
  productUrl: string;
  title: string;
  brand?: string;
  model?: string;
  sku?: string;
  imageUrl?: string;
  price: number;
  currency: string;
  shippingCost?: number;
  tax?: number;
  totalPrice?: number;
  availability?: string;
  matchType: MatchType;
  matchScore: number;
  trustScore: number;
  dealScore: number;
  warranty?: string;
  returnPolicy?: string;
  evidence: Evidence[];
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface ProductAnalysisResult {
  identity: ProductIdentity;
  constraints: ProductSearchConstraints;
  listings: ProductListing[];
  ranked: ProductListing[];
  marketRange: { min: number; max: number };
  suspiciousWarnings: string[];
  priceHistory: PriceHistoryPoint[];
  analysisMode: "demo" | "live";
}
