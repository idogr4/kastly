"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

interface BrandProfile {
  category?: string;
  tone?: string;
  colors?: BrandColors;
  font_style?: string;
  core_message?: string;
  differentiation?: string;
  pain_solved?: string;
}

const FONT_MAP: Record<string, string> = {
  "modern-sans": '"Heebo", "Inter", system-ui, -apple-system, sans-serif',
  "serif-elegant": '"Frank Ruhl Libre", "David Libre", Georgia, serif',
  "handwritten-warm": '"Suez One", "Heebo", system-ui, sans-serif',
  "bold-geometric": '"Rubik", "Heebo", system-ui, sans-serif',
  "clean-sans": '"Assistant", "Heebo", system-ui, sans-serif',
};

// Category-appropriate feature icons, rendered inline so there are zero
// extra network requests.
const FEATURE_ICONS: React.ReactNode[] = [
  <svg key="0" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>,
  <svg key="1" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>,
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(hex: string, a: number): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

export function LandingClient({
  campaignId,
  businessName,
  headline,
  subheadline,
  features,
  cta,
  brand,
}: {
  campaignId: string;
  businessName: string;
  headline: string;
  subheadline: string;
  features: string[];
  cta: string;
  brand: BrandProfile | null;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const primary = brand?.colors?.primary || "#6c5ce7";
  const secondary = brand?.colors?.secondary || "#fd79a8";
  const accent = brand?.colors?.accent || "#ffd43b";
  const background = brand?.colors?.background || "#ffffff";
  const text = brand?.colors?.text || "#0f172a";
  const fontFamily =
    FONT_MAP[brand?.font_style || "modern-sans"] || FONT_MAP["modern-sans"];

  useEffect(() => {
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

  const pageStyle: React.CSSProperties = {
    background,
    color: text,
    fontFamily,
  };

  const heroGradient = `radial-gradient(ellipse 80% 50% at 50% 0%, ${rgba(primary, 0.12)}, transparent 70%), radial-gradient(ellipse 60% 40% at 90% 10%, ${rgba(secondary, 0.08)}, transparent 60%)`;

  return (
    <div className="min-h-screen flex flex-col" style={pageStyle} dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md border-b" style={{ background: rgba(background, 0.8), borderColor: rgba(primary, 0.08) }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              {businessName?.[0] || "K"}
            </div>
            <span className="font-semibold text-base tracking-tight">{businessName}</span>
          </div>
          <a
            href="#lead-form"
            onClick={trackClick}
            className="hidden sm:inline-flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: accent, color: text }}
          >
            {cta}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: heroGradient }}>
        <div className="max-w-4xl mx-auto px-6 pt-16 sm:pt-24 pb-12 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
            style={{ background: rgba(primary, 0.08), color: primary, border: `1px solid ${rgba(primary, 0.15)}` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }} />
            {brand?.core_message ? trimLabel(brand.core_message, 48) : businessName}
          </div>

          <h1
            className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6"
            style={{ color: primary }}
          >
            {headline}
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: rgba(text, 0.7) }}>
            {subheadline}
          </p>

          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <a
              href="#lead-form"
              onClick={trackClick}
              className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: accent, color: text }}
            >
              {cta}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </a>
            {brand?.differentiation && (
              <span className="text-sm" style={{ color: rgba(text, 0.55) }}>
                {trimLabel(brand.differentiation, 60)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.slice(0, 4).map((f, i) => (
                <div
                  key={i}
                  className="group relative p-6 rounded-2xl transition-all hover:-translate-y-1"
                  style={{
                    background: rgba(primary, 0.03),
                    border: `1px solid ${rgba(primary, 0.1)}`,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                      color: "#fff",
                    }}
                  >
                    <span className="w-5 h-5 block">
                      {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                    </span>
                  </div>
                  <p className="font-semibold text-base leading-snug" style={{ color: text }}>
                    {f}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lead form / CTA section */}
      <section id="lead-form" className="py-16 sm:py-20" style={{ background: rgba(primary, 0.04) }}>
        <div className="max-w-xl mx-auto px-6">
          <div
            className="rounded-3xl p-6 sm:p-8 shadow-xl"
            style={{
              background,
              border: `1px solid ${rgba(primary, 0.12)}`,
            }}
          >
            {done ? (
              <div className="text-center space-y-3 py-6">
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
                  style={{ background: rgba(accent, 0.25) }}
                >
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={primary} strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ color: text }}>
                  קיבלנו! תודה.
                </h3>
                <p className="text-sm" style={{ color: rgba(text, 0.6) }}>
                  נחזור אליכם בקרוב.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: text }}>
                  רוצים לשמוע עוד?
                </h2>
                <p className="text-sm mb-6" style={{ color: rgba(text, 0.6) }}>
                  השאירו פרטים ונחזור אליכם באותו היום.
                </p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: rgba(text, 0.7) }}>
                      שם מלא
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="לא חובה"
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                      style={
                        {
                          color: text,
                          background: rgba(primary, 0.04),
                          border: `1px solid ${rgba(primary, 0.15)}`,
                          ["--tw-ring-color" as string]: rgba(primary, 0.3),
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: rgba(text, 0.7) }}>
                      מייל
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      dir="ltr"
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all text-right"
                      style={
                        {
                          color: text,
                          background: rgba(primary, 0.04),
                          border: `1px solid ${rgba(primary, 0.15)}`,
                          ["--tw-ring-color" as string]: rgba(primary, 0.3),
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                    style={{ background: accent, color: text }}
                  >
                    {submitting ? "שולח..." : cta}
                  </button>
                  <p className="text-xs text-center pt-2" style={{ color: rgba(text, 0.45) }}>
                    ללא ספאם. המייל שלכם נשמר אצלנו בלבד.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="mt-auto border-t py-10"
        style={{ borderColor: rgba(primary, 0.08) }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3" style={{ color: rgba(text, 0.7) }}>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              {businessName?.[0] || "K"}
            </div>
            <span className="font-semibold">{businessName}</span>
          </div>
          <p style={{ color: rgba(text, 0.5) }}>
            נוצר ב-
            <Link href="/" className="font-medium hover:underline" style={{ color: primary }}>
              Kastly
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

function trimLabel(s: string, n: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1) + "…" : clean;
}
