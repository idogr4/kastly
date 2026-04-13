"use client";

import { useState } from "react";
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
    label: "Images",
    description: "Branded ads & banners",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "bg-accent-soft text-accent",
  },
  {
    label: "Video",
    description: "Short-form & reels",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    color: "bg-success-soft text-success",
  },
  {
    label: "Landing Page",
    description: "Conversion-optimized",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

export default function Home() {
  const [url, setUrl] = useState("");

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
                Paste a URL.
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Get a full campaign.
                </span>
              </h1>
              <p className="text-lg text-muted max-w-md mx-auto leading-relaxed">
                Kastly scans your site and creates everything — copy, images,
                video, landing page — then publishes across every channel.
              </p>
            </div>

            {/* URL Input */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-business.com"
                className="flex-1 px-4 py-3.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
              />
              <button
                onClick={handleGoogleSignIn}
                className="px-6 py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all whitespace-nowrap shadow-md hover:shadow-lg"
              >
                Generate Campaign
              </button>
            </div>

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
              Three steps. One URL. A full marketing campaign — live everywhere.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Paste your URL",
                  description:
                    "Drop your website link. Kastly scans your brand — colors, tone, product, audience — in seconds.",
                  gradient: "from-primary to-primary",
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.035a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.798" />
                    </svg>
                  ),
                },
                {
                  step: "2",
                  title: "AI builds the campaign",
                  description:
                    "Headlines, ad images, a short video, and a landing page — all generated and matched to your brand.",
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
                    "One click sends your campaign to Facebook, Instagram, LinkedIn — or all three at once.",
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
              Real output from a single URL — ready to publish.
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
                  <span className="text-sm font-semibold text-foreground">Ad Copy</span>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="p-3 rounded-lg bg-primary-soft/50">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">Headline</p>
                    <p className="text-foreground font-semibold font-sans">Fresh Roasts, Delivered Weekly</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">Body</p>
                    <p className="text-foreground font-sans text-sm leading-relaxed">Skip the supermarket shelf. Get specialty coffee from local roasters — freshly roasted and at your door every week.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent-soft/50">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">CTA</p>
                    <p className="text-accent font-semibold font-sans">Start Your Free Trial &rarr;</p>
                  </div>
                </div>
              </div>

              {/* Image Card */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Ad Image</span>
                </div>
                <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-border flex flex-col items-center justify-center gap-4 p-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground text-sm">Fresh Roasts Co.</p>
                    <p className="text-xs text-muted mt-1">1080 &times; 1080 &bull; Instagram-ready</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary" />
                    <span className="w-4 h-4 rounded-full bg-accent" />
                    <span className="w-4 h-4 rounded-full bg-foreground/80" />
                  </div>
                </div>
              </div>

              {/* Video Card */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-success-soft flex items-center justify-center">
                    <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Short Video</span>
                </div>
                <div className="aspect-[9/16] max-h-[280px] rounded-xl bg-gradient-to-b from-foreground/90 to-foreground flex flex-col items-center justify-between p-5 relative overflow-hidden">
                  {/* Video preview mock */}
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-accent/20" />
                  <div className="relative z-10 text-center mt-auto space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">15s Reel</p>
                      <p className="text-white/60 text-xs mt-0.5">Auto-generated from your brand</p>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 mt-4">
                    <div className="h-0.5 flex-1 bg-white/20 rounded-full">
                      <div className="h-full w-1/3 bg-accent rounded-full" />
                    </div>
                    <span className="text-white/50 text-[10px]">0:05 / 0:15</span>
                  </div>
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
