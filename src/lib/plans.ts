export type PlanId = "free" | "basic" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // monthly in USD, 0 for free
  stripePriceId: string | null;
  features: string[];
  limits: {
    campaignsPerMonth: number; // -1 = unlimited
    includesImages: boolean;
    includesLandingPage: boolean;
    includesVideo: boolean;
  };
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    stripePriceId: null,
    features: [
      "1 campaign — one time only",
      "Text copy only (no images)",
      "3 platforms (Facebook, Instagram, LinkedIn)",
      "A/B variations & quality scores",
    ],
    limits: {
      campaignsPerMonth: 1,
      includesImages: false,
      includesLandingPage: false,
      includesVideo: false,
    },
  },
  {
    id: "basic",
    name: "Basic",
    price: 49,
    stripePriceId: process.env.STRIPE_PRICE_BASIC ?? "",
    features: [
      "3 campaigns per month",
      "Ad copy + AI images",
      "Landing page generation",
      "Persona & quality scores",
      "Priority support",
    ],
    limits: {
      campaignsPerMonth: 3,
      includesImages: true,
      includesLandingPage: true,
      includesVideo: false,
    },
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? "",
    features: [
      "7 campaigns per month",
      "Everything in Basic",
      "Video ad script generation",
      "Advanced audience insights",
      "Export to all formats",
    ],
    limits: {
      campaignsPerMonth: 7,
      includesImages: true,
      includesLandingPage: true,
      includesVideo: true,
    },
  },
  {
    id: "business",
    name: "Business",
    price: 199,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? "",
    features: [
      "Unlimited campaigns",
      "Everything in Pro",
      "Team collaboration",
      "White-label exports",
      "Dedicated account manager",
    ],
    limits: {
      campaignsPerMonth: -1,
      includesImages: true,
      includesLandingPage: true,
      includesVideo: true,
    },
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
