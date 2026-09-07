import { identifyProduct } from "@/lib/ai/identifyProduct";
import { createListingFromCatalog, PRODUCT_CATALOG } from "@/lib/search/providers";
import { calculateMatchScore, classifyMatch } from "@/lib/matching/matcher";
import { calculateTrustScore } from "@/lib/trust/trust";
import { buildPriceHistory, calculateDealScore, calculateTruePrice, getPriceWarnings } from "@/lib/pricing/price";
import { rankListings } from "@/lib/recommendations/ranker";
import type { ProductAnalysisResult, ProductListing } from "@/types/product";

export const analyzeProductInput = (input: string): ProductAnalysisResult => {
  const { identity, constraints } = identifyProduct(input);
  const catalogMatch = PRODUCT_CATALOG.find((product) => product.product_name === identity.product_name) ?? PRODUCT_CATALOG[0];
  const observedRange = catalogMatch.marketPrice;

  const retailers = [
    {
      retailerName: "Nike Official",
      retailerDomain: "nike.com",
      productUrl: "https://www.nike.com/in/t/air-max-dn-shoes-123abc",
      title: `${catalogMatch.product_name} - ${catalogMatch.color}`,
      brand: "Nike",
      model: catalogMatch.model,
      price: observedRange.typical,
      currency: "INR",
      shippingCost: 0,
      tax: 0,
      availability: "In stock",
      warranty: "Official brand warranty",
      returnPolicy: "30-day return window",
      trustScore: 96,
    },
    {
      retailerName: "Flipkart",
      retailerDomain: "flipkart.com",
      productUrl: "https://www.flipkart.com/product/air-max-dn",
      title: `${catalogMatch.product_name} Running Shoes`,
      brand: "Nike",
      model: catalogMatch.model,
      price: observedRange.typical + 200,
      currency: "INR",
      shippingCost: 149,
      tax: 0,
      availability: "In stock",
      warranty: "Brand warranty",
      returnPolicy: "7-day replacement",
      trustScore: 88,
    },
    {
      retailerName: "Myntra",
      retailerDomain: "myntra.com",
      productUrl: "https://www.myntra.com/shoes/air-max-dn",
      title: `${catalogMatch.product_name} - ${catalogMatch.variant}`,
      brand: "Nike",
      model: catalogMatch.model,
      price: observedRange.typical - 700,
      currency: "INR",
      shippingCost: 79,
      tax: 0,
      availability: "In stock",
      warranty: "Store warranty",
      returnPolicy: "30-day return",
      trustScore: 84,
    },
    {
      retailerName: "Shopclues",
      retailerDomain: "shopclues.com",
      productUrl: "https://shopclues.com/air-max-dn",
      title: `${catalogMatch.product_name} Core Black`,
      brand: "Nike",
      model: catalogMatch.model,
      price: observedRange.min - 400,
      currency: "INR",
      shippingCost: 0,
      tax: 0,
      availability: "Low inventory",
      warranty: "Not verified",
      returnPolicy: "Not verified",
      trustScore: 52,
    },
  ];

  const listings: ProductListing[] = retailers.map((retailer) => {
    const matchScore = calculateMatchScore(identity, retailer);
    const matchType = classifyMatch(matchScore);
    const evidence = [
      {
        type: "Product model",
        sourceName: "Brand catalog",
        sourceUrl: "https://www.nike.com/in",
        claim: `Verified ${identity.product_name} model ${identity.model}`,
        confidence: 0.97,
        checkedAt: new Date().toISOString(),
      },
      {
        type: "Price",
        sourceName: retailer.retailerDomain,
        sourceUrl: retailer.productUrl,
        claim: `Listed at ₹${retailer.price}`,
        confidence: 0.9,
        checkedAt: new Date().toISOString(),
      },
      {
        type: "Return policy",
        sourceName: retailer.retailerDomain,
        sourceUrl: retailer.productUrl,
        claim: retailer.returnPolicy ?? "Return policy unavailable",
        confidence: 0.78,
        checkedAt: new Date().toISOString(),
      },
    ];

    const baseListing = createListingFromCatalog(catalogMatch, { ...retailer, trustScore: retailer.trustScore }, matchType, matchScore, 0, evidence);
    const finalTrust = calculateTrustScore(baseListing, observedRange);
    const finalDeal = calculateDealScore({ ...baseListing, trustScore: finalTrust }, observedRange);
    const finalTotal = calculateTruePrice({ ...baseListing, trustScore: finalTrust, dealScore: finalDeal });

    return {
      ...baseListing,
      totalPrice: finalTotal,
      trustScore: finalTrust,
      dealScore: finalDeal,
    };
  });

  const ranked = rankListings(listings);
  const suspiciousWarnings = listings.flatMap((listing) => getPriceWarnings(listing, observedRange));

  return {
    identity,
    constraints,
    listings,
    ranked,
    marketRange: observedRange,
    suspiciousWarnings: [...new Set(suspiciousWarnings)],
    priceHistory: buildPriceHistory(observedRange),
    analysisMode: "demo",
  };
};
