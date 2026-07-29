// Stripe Price IDs for throuly products (buyer-only).

export const STRIPE_PRICES = {
  buyer_premium: "price_1SfZSHHZL9xfvooYi15z4UyD",
} as const;

export const STRIPE_PRODUCTS = {
  buyer_premium: "prod_Tcp6y6Afgv52Lx",
} as const;

export type PriceKey = keyof typeof STRIPE_PRICES;
export type ProductKey = keyof typeof STRIPE_PRODUCTS;
