import type { ProductListing } from "@/types/product";

export interface CatalogProduct {
  brand: string;
  product_name: string;
  model: string;
  sku: string;
  category: string;
  variant: string;
  color: string;
  imageUrl: string;
  search_terms: string[];
  attributes: Record<string, string | number | boolean>;
  marketPrice: { min: number; max: number; typical: number };
}

export const PRODUCT_CATALOG: CatalogProduct[] = [
  {
    brand: "Nike",
    product_name: "Nike Air Max DN",
    model: "Air Max DN",
    sku: "FV5905-100",
    category: "Running shoes",
    variant: "Men's running shoe",
    color: "Black / White",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    search_terms: ["nike air max dn", "air max dn", "nike sneakers", "nike running shoes"],
    attributes: {
      technology: "Air Max",
      useCase: "Running and casual wear",
      sizing: "Men's US 9",
      material: "Synthetic mesh",
      release: "2024",
    },
    marketPrice: { min: 8299, max: 12999, typical: 9999 },
  },
  {
    brand: "Apple",
    product_name: "MacBook Pro 14-inch",
    model: "MacBook Pro 14",
    sku: "MQ233HN/A",
    category: "Laptop",
    variant: "M3 Pro 18GB / 512GB",
    color: "Silver",
    imageUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    search_terms: ["macbook pro 14", "apple laptop 14", "m3 pro 14 inch", "macbook 14"],
    attributes: {
      processor: "Apple M3 Pro",
      ram: "18GB",
      storage: "512GB SSD",
      display: "14.2-inch Liquid Retina XDR",
      warranty: "Apple one-year limited warranty",
    },
    marketPrice: { min: 202000, max: 245000, typical: 219000 },
  },
  {
    brand: "Sony",
    product_name: "Sony WH-1000XM5",
    model: "WH-1000XM5",
    sku: "WH1000XM5",
    category: "Wireless headphones",
    variant: "Black",
    color: "Black",
    imageUrl:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
    search_terms: ["sony xm5", "wh 1000xm5", "sony headphones", "noise cancelling headphones"],
    attributes: {
      connectivity: "Bluetooth 5.2",
      battery: "30 hours",
      noiseCancellation: "Adaptive ANC",
      weight: "250g",
    },
    marketPrice: { min: 26999, max: 34999, typical: 29999 },
  },
  {
    brand: "Adidas",
    product_name: "Adidas Ultraboost 1.0",
    model: "Ultraboost 1.0",
    sku: "GW2948",
    category: "Running shoes",
    variant: "Core Black / Cloud White",
    color: "Core Black / Cloud White",
    imageUrl:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
    search_terms: ["adidas ultraboost", "ultraboost 1.0", "adidas running shoes"],
    attributes: {
      cushioning: "Boost midsole",
      useCase: "Daily training",
      release: "2024",
    },
    marketPrice: { min: 6999, max: 11999, typical: 8999 },
  },
];

export function getBestCatalogMatch(query: string): CatalogProduct | undefined {
  const normalized = query.toLowerCase().trim();

  let best: { product: CatalogProduct; score: number } | undefined;

  for (const product of PRODUCT_CATALOG) {
    const haystack = [
      product.brand,
      product.product_name,
      product.model,
      product.sku,
      product.category,
      ...product.search_terms,
    ]
      .join(" ")
      .toLowerCase();

    const exact = haystack.includes(normalized) ? 100 : 0;
    const tokenScore = normalized
      .split(/\s+/)
      .filter(Boolean)
      .reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);

    const total = exact + tokenScore * 4;

    if (!best || total > best.score) {
      best = { product, score: total };
    }
  }

  return best?.score ? best.product : undefined;
}

export function createListingFromCatalog(
  product: CatalogProduct,
  retailer: {
    retailerName: string;
    retailerDomain: string;
    productUrl: string;
    title: string;
    brand?: string;
    model?: string;
    price: number;
    currency: string;
    shippingCost?: number;
    tax?: number;
    availability?: string;
    warranty?: string;
    returnPolicy?: string;
    trustScore: number;
  },
  matchType: ProductListing["matchType"],
  matchScore: number,
  dealScore: number,
  evidence: ProductListing["evidence"],
): ProductListing {
  const total = retailer.price + (retailer.shippingCost ?? 0) + (retailer.tax ?? 0);

  return {
    retailerName: retailer.retailerName,
    retailerDomain: retailer.retailerDomain,
    productUrl: retailer.productUrl,
    title: retailer.title,
    brand: retailer.brand ?? product.brand,
    model: retailer.model ?? product.model,
    sku: product.sku,
    imageUrl: product.imageUrl,
    price: retailer.price,
    currency: retailer.currency,
    shippingCost: retailer.shippingCost,
    tax: retailer.tax,
    totalPrice: total,
    availability: retailer.availability ?? "In stock",
    matchType,
    matchScore,
    trustScore: retailer.trustScore,
    dealScore,
    warranty: retailer.warranty,
    returnPolicy: retailer.returnPolicy,
    evidence,
  };
}
