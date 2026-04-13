"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
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
            className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground tracking-tight leading-tight">
              Paste a URL.
              <br />
              <span className="text-primary">Get a full campaign.</span>
            </h1>
            <p className="text-lg text-muted max-w-md mx-auto">
              Kastly scans your business website and generates copy, images,
              video, and a landing page — then publishes everywhere.
            </p>
          </div>

          {/* URL Input */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-business.com"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <button
              onClick={handleGoogleSignIn}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors whitespace-nowrap"
            >
              Generate Campaign
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {[
              "Ad Copy",
              "Images",
              "Video",
              "Landing Page",
              "Facebook",
              "Instagram",
              "LinkedIn",
            ].map((feature) => (
              <span
                key={feature}
                className="px-3 py-1.5 text-sm rounded-full bg-surface border border-border text-muted"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Google Sign In CTA */}
          <div className="pt-4">
            <button
              onClick={handleGoogleSignIn}
              className="inline-flex items-center gap-3 px-6 py-3 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-colors"
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
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted border-t border-border">
        Kastly &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
