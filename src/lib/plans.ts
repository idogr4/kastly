export type PlanId = "free" | "basic" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // monthly in ILS, 0 for free
  paddlePriceId: string | null;
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
    name: "חינם",
    price: 0,
    paddlePriceId: null,
    features: [
      "קמפיין אחד — חד פעמי",
      "טקסט בלבד (ללא תמונות)",
      "3 פלטפורמות (פייסבוק, אינסטגרם, לינקדאין)",
      "וריאציות A/B וציוני איכות",
      "תמונות עם סימן מים של Kastly",
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
    name: "בסיסי",
    price: 99,
    paddlePriceId: "pri_01kp4kcjgfdcc993kp5r9bxb2d",
    features: [
      "3 קמפיינים בחודש",
      "טקסטים + תמונות AI",
      "דף נחיתה מוכן",
      "פרסונה וציוני איכות",
      "תמיכה בעדיפות",
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
    name: "פרו",
    price: 179,
    paddlePriceId: "pri_01kp4kh7qq34nvby72wkryf4ch",
    features: [
      "7 קמפיינים בחודש",
      "כל מה שיש בבסיסי",
      "סקריפט לסרטון פרסומת",
      "תובנות קהל מתקדמות",
      "ייצוא לכל הפורמטים",
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
    name: "עסקי",
    price: 449,
    paddlePriceId: "pri_01kp4kn7e0dd5wxscp1aa4mfbd",
    features: [
      "קמפיינים ללא הגבלה",
      "כל מה שיש בפרו",
      "עבודת צוות",
      "ייצוא white-label",
      "מנהל לקוח ייעודי",
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
