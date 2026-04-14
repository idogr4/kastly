"use client";

import { useEffect, useState } from "react";

export function LandingClient({
  campaignId,
  businessName,
  headline,
  subheadline,
  features,
  cta,
}: {
  campaignId: string;
  businessName: string;
  headline: string;
  subheadline: string;
  features: string[];
  cta: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Track view once per session
    const key = `kastly-view-${campaignId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/landing/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, event_type: "view" }),
    }).catch(() => {});
  }, [campaignId]);

  function trackClick() {
    fetch("/api/landing/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, event_type: "click" }),
    }).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    trackClick();

    try {
      const res = await fetch("/api/landing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          email: email.trim(),
          name: name.trim() || null,
        }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        setError(data.error || "השליחה נכשלה");
      }
    } catch {
      setError("החיבור נפל. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-soft via-background to-background">
      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center space-y-6 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border shadow-sm">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">K</span>
            </div>
            <span className="text-xs font-medium text-foreground">
              {businessName}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight tracking-tight">
            {headline}
          </h1>
          <p className="text-lg text-muted leading-relaxed max-w-lg mx-auto">
            {subheadline}
          </p>
        </div>

        {features.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-3 mb-10">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-surface p-4 text-center shadow-sm"
              >
                <p className="text-sm text-foreground font-medium">{f}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
          {done ? (
            <div className="text-center space-y-3 py-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-success-soft flex items-center justify-center">
                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">קיבלנו! תודה.</h3>
              <p className="text-sm text-muted">
                נחזור אליכם בקרוב.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">שם מלא</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="לא חובה"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">מייל *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-right"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? "שולח..." : cta}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted/60 mt-8">
          נוצר ב-
          <a href="/" className="text-primary hover:underline">
            Kastly
          </a>
        </p>
      </main>
    </div>
  );
}
