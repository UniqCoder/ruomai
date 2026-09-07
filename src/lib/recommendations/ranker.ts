import type { ProductListing } from "@/types/product";

export const rankListings = (listings: ProductListing[]) => {
  return [...listings].sort((a, b) => {
    const aScore = a.matchScore * 0.4 + a.trustScore * 0.25 + a.dealScore * 0.35;
    const bScore = b.matchScore * 0.4 + b.trustScore * 0.25 + b.dealScore * 0.35;
    return bScore - aScore;
  });
};

export const getBestOverall = (listings: ProductListing[]) => {
  return rankListings(listings)[0];
};

export const getCheapestVerified = (listings: ProductListing[]) => {
  return [...listings]
    .filter((listing) => listing.matchType !== "LOW_CONFIDENCE")
    .sort((a, b) => (a.totalPrice ?? a.price) - (b.totalPrice ?? b.price))[0];
};

export const getSafest = (listings: ProductListing[]) => {
  return [...listings].sort((a, b) => b.trustScore - a.trustScore)[0];
};

export const getBestDeal = (listings: ProductListing[]) => {
  return [...listings].sort((a, b) => b.dealScore - a.dealScore)[0];
};
