"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    Paddle?: {
      Initialize: (opts: { token: string; environment?: string }) => void;
      Checkout: {
        open: (opts: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email: string };
          customData?: Record<string, string>;
          settings?: {
            successUrl?: string;
            displayMode?: string;
            theme?: string;
          };
        }) => void;
      };
    };
  }
}

const PLANS = [
  {
    id: "free",
    name: "חינם",
    price: 0,
    period: "חד פעמי",
    description: "לנסות את Kastly — עלינו",
    features: [
      "קמפיין אחד — חד פעמי",
      "טקסט בלבד",
      "3 פלטפורמות (פייסבוק, אינסטגרם, לינקדאין)",
      "וריאציות A/B וציוני איכות",
      "ניתוח פרסונה",
    ],
    excluded: ["תמונות AI באיכות מלאה", "דף נחיתה", "סקריפט לסרטון"],
    cta: "מתחילים בחינם",
    paddlePriceId: null as string | null,
  },
  {
    id: "basic",
    name: "בסיסי",
    price: 99,
    period: "/חודש",
    description: "לעסקים שצומחים",
    features: [
      "3 קמפיינים בחודש",
      "טקסטים + תמונות AI",
      "דף נחיתה מוכן",
      "פרסונה וציוני איכות",
      "תמיכה בעדיפות",
    ],
    excluded: ["סקריפט לסרטון"],
    highlight: true,
    badge: "הכי פופולרי",
    cta: "התחלת חבילת בסיסי",
    paddlePriceId: "pri_01kp4kcjgfdcc993kp5r9bxb2d",
  },
  {
    id: "pro",
    name: "פרו",
    price: 179,
    period: "/חודש",
    description: "חבילה יצירתית מלאה",
    features: [
      "7 קמפיינים בחודש",
      "כל מה שיש בבסיסי",
      "סקריפט לסרטון פרסומת",
      "תובנות קהל מתקדמות",
      "ייצוא לכל הפורמטים",
    ],
    excluded: [],
    cta: "התחלת חבילת פרו",
    paddlePriceId: "pri_01kp4kh7qq34nvby72wkryf4ch",
  },
  {
    id: "business",
    name: "עסקי",
    price: 449,
    period: "/חודש",
    description: "לסוכנויות וצוותים",
    features: [
      "קמפיינים ללא הגבלה",
      "כל מה שיש בפרו",
      "עבודת צוות",
      "ייצוא white-label",
      "מנהל לקוח ייעודי",
    ],
    excluded: [],
    cta: "התחלת חבילת עסקי",
    paddlePriceId: "pri_01kp4kn7e0dd5wxscp1aa4mfbd",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);

  useEffect(() => {
    if (window.Paddle) {
      initPaddle();
    }
  }, []);

  function initPaddle() {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token || !window.Paddle) return;

    window.Paddle.Initialize({
      token,
      environment: process.env.NEXT_PUBLIC_PADDLE_SANDBOX === "true" ? "sandbox" : undefined,
    });
    setPaddleReady(true);
  }

  async function handleSubscribe(
    planId: string,
    priceId: string | null
  ) {
    if (!priceId) {
      window.location.href = "/";
      return;
    }

    setLoading(planId);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/pricing`,
        },
      });
      return;
    }

    if (!paddleReady || !window.Paddle) {
      alert("מערכת התשלום בטעינה. נסו שוב בעוד רגע.");
      setLoading(null);
      return;
    }

    window.Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email: user.email! },
      customData: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
      settings: {
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        displayMode: "overlay",
        theme: "light",
      },
    });

    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={initPaddle}
      />

      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Kastly
          </span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/gallery" className="text-sm text-muted hover:text-foreground transition-colors">
            גלריה
          </a>
          <a href="/about" className="text-sm text-muted hover:text-foreground transition-colors">
            אודות
          </a>
          <a href="/dashboard" className="text-sm text-muted hover:text-foreground transition-colors">
            האיזור שלי
          </a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            מחירים הוגנים, בלי הפתעות
          </h1>
          <p className="text-lg text-muted max-w-md mx-auto">
            מתחילים בחינם. משדרגים כשצריכים תמונות, דפי נחיתה או עוד קמפיינים.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-surface overflow-hidden shadow-sm flex flex-col ${
                plan.highlight
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 left-0 bg-primary text-white text-[10px] font-bold tracking-wider px-3 py-1 rounded-br-xl">
                  {plan.badge}
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted mt-1">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-foreground">
                        חינם
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-foreground">
                          ₪{plan.price}
                        </span>
                        <span className="text-muted text-sm">
                          {plan.period}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <svg
                        className="w-4 h-4 text-success mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted/50">
                      <svg
                        className="w-4 h-4 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id, plan.paddlePriceId)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                    plan.highlight
                      ? "bg-primary text-white hover:bg-primary-hover shadow-md"
                      : plan.price === 0
                        ? "bg-background text-foreground border border-border hover:bg-surface-hover"
                        : "bg-foreground text-background hover:opacity-90"
                  } ${loading === plan.id ? "opacity-50 cursor-wait" : ""}`}
                >
                  {loading === plan.id ? "טוען..." : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center space-y-3">
          <p className="text-sm text-muted">
            כל החבילות כוללות 7 ימי ניסיון חינם. אפשר לבטל בכל רגע.
          </p>
          <p className="text-xs text-muted/60">
            המחירים בשקלים. מע״מ ומיסים מטופלים אוטומטית דרך Paddle.
          </p>
        </div>
      </main>
    </div>
  );
}
