"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const FEATURES = [
  {
    label: "Ad Copy",
    description: "Headlines, body & CTAs",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: "bg-primary-soft text-primary",
  },
  {
    label: "A/B Variations",
    description: "3 hooks per platform",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "bg-accent-soft text-accent",
  },
  {
    label: "Persona",
    description: "Deep audience profile",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "bg-success-soft text-success",
  },
  {
    label: "Quality Scores",
    description: "AI-rated per ad",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "bg-primary-soft text-primary",
  },
];

const PLATFORMS = [
  { label: "Facebook", icon: "f" },
  { label: "Instagram", icon: "ig" },
  { label: "LinkedIn", icon: "in" },
];

type InputMode = "url" | "text";

export default function Home() {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const router = useRouter();

  function handleGenerate() {
    if (inputMode === "url") {
      if (!url.trim()) return;
      router.push(`/campaign/preview?url=${encodeURIComponent(url.trim())}`);
    } else {
      if (!description.trim()) return;
      router.push(
        `/campaign/preview?description=${encodeURIComponent(description.trim())}`
      );
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Kastly
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/gallery"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Gallery
          </a>
          <a
            href="/pricing"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Pricing
          </a>
          <button
            onClick={handleGoogleSignIn}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign in
          </button>
          <button
            onClick={handleGoogleSignIn}
            className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-16 px-6">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/5 via-accent/5 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="max-w-2xl mx-auto text-center space-y-8">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success-soft border border-success/20 text-sm text-success">
              <span className="flex -space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-success-soft bg-gradient-to-br from-primary to-accent inline-block"
                  />
                ))}
              </span>
              <span className="font-medium">200+ businesses already on board</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
                {inputMode === "url" ? (
                  <>
                    Paste a URL.
                    <br />
                  </>
                ) : (
                  <>
                    Describe your business.
                    <br />
                  </>
                )}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Get a full campaign.
                </span>
              </h1>
              <p className="text-lg text-muted max-w-md mx-auto leading-relaxed">
                Kastly deep-scans your brand and creates premium ad copy with
                A/B variations, audience personas, and quality scores — for
                every channel.
              </p>
            </div>

            {/* Input mode toggle */}
            <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-surface border border-border w-fit mx-auto">
              <button
                onClick={() => setInputMode("url")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "url"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Paste URL
              </button>
              <button
                onClick={() => setInputMode("text")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "text"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Describe in Text
              </button>
            </div>

            {/* Input area */}
            {inputMode === "url" ? (
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-business.com"
                  className="flex-1 px-4 py-3.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
                />
                <button
                  onClick={handleGenerate}
                  className="px-6 py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  Generate Campaign
                </button>
              </div>
            ) : (
              <div className="max-w-lg mx-auto space-y-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. I'm a fitness trainer in Tel Aviv working with postpartum women. I offer personal training and online programs focused on core recovery and confidence building."
                  rows={4}
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm resize-none"
                />
                <button
                  onClick={handleGenerate}
                  className="w-full px-6 py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all shadow-md hover:shadow-lg"
                >
                  Generate Campaign
                </button>
              </div>
            )}

            {/* Feature chips — enriched */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {FEATURES.map((f) => (
                <span
                  key={f.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full font-medium ${f.color}`}
                >
                  {f.icon}
                  <span>{f.label}</span>
                  <span className="text-xs opacity-60">— {f.description}</span>
                </span>
              ))}
            </div>

            {/* Publish targets */}
            <div className="flex items-center justify-center gap-4 text-sm text-muted">
              <span>Publishes to</span>
              <div className="flex gap-2">
                {PLATFORMS.map((p) => (
                  <span
                    key={p.label}
                    className="px-2.5 py-1 rounded-md bg-surface border border-border text-xs font-medium text-foreground"
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6 bg-surface border-y border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-4">
              How it works
            </h2>
            <p className="text-center text-muted mb-14 max-w-md mx-auto">
              Three steps. One input. A full marketing campaign — live everywhere.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Paste URL or describe",
                  description:
                    "Drop your website link or describe your business in free text. Kastly deep-scans multiple pages — homepage, about, products, and reviews.",
                  gradient: "from-primary to-primary",
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.035a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.798" />
                    </svg>
                  ),
                },
                {
                  step: "2",
                  title: "AI builds premium ads",
                  description:
                    "Persona profiling, 3 A/B variations per platform (pain, curiosity, numbers), quality-scored by AI before delivery.",
                  gradient: "from-primary to-accent",
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                  ),
                },
                {
                  step: "3",
                  title: "Publish everywhere",
                  description:
                    "One click sends your best-performing variation to Facebook, Instagram, LinkedIn — or all three at once.",
                  gradient: "from-accent to-accent",
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative text-center group"
                >
                  <div
                    className={`w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                    Step {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground mt-1 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Example output */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-4">
              See what Kastly generates
            </h2>
            <p className="text-center text-muted mb-14 max-w-md mx-auto">
              Real output from a single URL — persona, A/B variations, quality scores.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Ad Copy Card */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-foreground">3 Ad Variations</span>
                </div>
                <div className="space-y-3 text-sm">
                  {["Pain hook", "Curiosity hook", "Numbers hook"].map((hook, i) => (
                    <div key={hook} className="p-3 rounded-lg bg-background">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs uppercase tracking-wide text-muted">{hook}</p>
                        <span className="text-[10px] font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded">{9 - i}/10</span>
                      </div>
                      <p className="text-foreground font-semibold font-sans text-sm">
                        {i === 0 && "Your Coffee Was Roasted 4 Months Ago"}
                        {i === 1 && "Why Do Baristas Smell the Bag First?"}
                        {i === 2 && "2,847 People Cancelled Their Café Orders"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Persona Card */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-success-soft flex items-center justify-center">
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Target Persona</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">Age Range</p>
                    <p className="text-foreground font-medium">28–42 years old</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">Top Pain Point</p>
                    <p className="text-foreground font-medium">Stale supermarket coffee</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">Scroll Stopper</p>
                    <p className="text-foreground font-medium">Side-by-side freshness comparison</p>
                  </div>
                </div>
              </div>

              {/* Score Card */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Quality Scores</span>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Hook Strength", score: 9 },
                    { label: "Message Clarity", score: 9 },
                    { label: "CTA Effectiveness", score: 8 },
                    { label: "Platform Fit", score: 9 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-background">
                      <span className="text-muted">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                            style={{ width: `${item.score * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{item.score}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-primary-soft/50 to-background">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to launch your campaign?
            </h2>
            <p className="text-muted">
              Join 200+ businesses using Kastly to market smarter. Start free — no credit card needed.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="inline-flex items-center gap-3 px-6 py-3.5 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-medium text-foreground">
                Continue with Google
              </span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted border-t border-border">
        Kastly &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
