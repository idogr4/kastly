"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "one time",
    description: "Try Kastly once — on us",
    features: [
      "1 campaign — one time only",
      "Text copy only",
      "3 platforms (Facebook, Instagram, LinkedIn)",
      "A/B variations & quality scores",
      "Persona analysis",
    ],
    excluded: [
      "AI-generated images",
      "Landing page",
      "Video ad script",
    ],
    cta: "Get Started Free",
    stripePriceId: null,
  },
  {
    id: "basic",
    name: "Basic",
    price: 49,
    period: "/month",
    description: "For growing businesses",
    features: [
      "3 campaigns per month",
      "Ad copy + AI images",
      "Landing page generation",
      "Persona & quality scores",
      "Priority support",
    ],
    excluded: ["Video ad script"],
    highlight: true,
    badge: "Most Popular",
    cta: "Start Basic Plan",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? "",
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    period: "/month",
    description: "Full creative suite",
    features: [
      "7 campaigns per month",
      "Everything in Basic",
      "Video ad script generation",
      "Advanced audience insights",
      "Export to all formats",
    ],
    excluded: [],
    cta: "Start Pro Plan",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
  },
  {
    id: "business",
    name: "Business",
    price: 199,
    period: "/month",
    description: "For agencies & teams",
    features: [
      "Unlimited campaigns",
      "Everything in Pro",
      "Team collaboration",
      "White-label exports",
      "Dedicated account manager",
    ],
    excluded: [],
    cta: "Start Business Plan",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS ?? "",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planId: string, priceId: string | null) {
    if (!priceId) {
      // Free plan — just redirect to generate
      window.location.href = "/";
      return;
    }

    setLoading(planId);

    // Check if user is authenticated
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to sign in first
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/pricing`,
        },
      });
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, planId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
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
          <a
            href="/gallery"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Gallery
          </a>
          <a
            href="/dashboard"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Dashboard
          </a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14 space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted max-w-md mx-auto">
            Start free. Upgrade when you need images, landing pages, or more
            campaigns.
          </p>
        </div>

        {/* Plans grid */}
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
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                  {plan.badge}
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                {/* Plan name & price */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted mt-1">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-foreground">
                        Free
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-foreground">
                          ${plan.price}
                        </span>
                        <span className="text-muted text-sm">
                          {plan.period}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Features */}
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-muted/50"
                    >
                      <svg
                        className="w-4 h-4 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() =>
                    handleSubscribe(plan.id, plan.stripePriceId)
                  }
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                    plan.highlight
                      ? "bg-primary text-white hover:bg-primary-hover shadow-md"
                      : plan.price === 0
                        ? "bg-background text-foreground border border-border hover:bg-surface-hover"
                        : "bg-foreground text-background hover:opacity-90"
                  } ${loading === plan.id ? "opacity-50 cursor-wait" : ""}`}
                >
                  {loading === plan.id ? "Redirecting..." : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / Bottom note */}
        <div className="mt-16 text-center space-y-3">
          <p className="text-sm text-muted">
            All paid plans include a 7-day free trial. Cancel anytime.
          </p>
          <p className="text-xs text-muted/60">
            Prices in USD. Powered by Stripe for secure payments.
          </p>
        </div>
      </main>
    </div>
  );
}
