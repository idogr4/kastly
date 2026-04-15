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

type FeatureItem = string | { title: string; description: string };
type StepItem = { title: string; description: string };

interface LandingContent {
  hero_eyebrow?: string;
  hero_headline: string;
  hero_subheadline: string;
  primary_cta?: string;
  secondary_cta?: string;
  social_proof_line?: string;
  testimonial_quote?: string;
  testimonial_attribution?: string;
  features: FeatureItem[];
  how_it_works?: StepItem[];
  final_cta_headline?: string;
  final_cta_subline?: string;
  cta: string;
}

const FONT_MAP: Record<string, string> = {
  "modern-sans": '"Heebo","Inter",system-ui,-apple-system,sans-serif',
  "serif-elegant": '"Frank Ruhl Libre","David Libre",Georgia,serif',
  "handwritten-warm": '"Suez One","Heebo",system-ui,sans-serif',
  "bold-geometric": '"Rubik","Heebo",system-ui,sans-serif',
  "clean-sans": '"Assistant","Heebo",system-ui,sans-serif',
};

// Compact inline icon set. 8 icons cycle for features / steps.
const ICONS: React.ReactNode[] = [
  <path key="0" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  <g key="1">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </g>,
  <g key="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </g>,
  <path key="3" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
  <g key="4">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" />
  </g>,
  <g key="5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </g>,
  <g key="6">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </g>,
  <g key="7">
    <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
  </g>,
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
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

// Decide readable foreground against a background hex.
function readableOn(bg: string): string {
  const c = hexToRgb(bg);
  if (!c) return "#0f172a";
  const L = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return L > 0.6 ? "#0f172a" : "#ffffff";
}

function normalizeFeatures(raw: FeatureItem[]): StepItem[] {
  return raw.slice(0, 4).map((f) =>
    typeof f === "string"
      ? { title: f, description: "" }
      : { title: f.title, description: f.description || "" }
  );
}

export function LandingClient({
  campaignId,
  businessName,
  content,
  brand,
  heroImageUrl,
}: {
  campaignId: string;
  businessName: string;
  content: LandingContent;
  brand: BrandProfile | null;
  heroImageUrl?: string | null;
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
  const fontFamily = FONT_MAP[brand?.font_style || "modern-sans"] || FONT_MAP["modern-sans"];

  const accentFg = readableOn(accent);
  const primaryFg = readableOn(primary);

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

  const features = normalizeFeatures(content.features || []);
  const steps = (content.how_it_works || []).slice(0, 3);
  const primaryCta = content.primary_cta || content.cta;
  const secondaryCta = content.secondary_cta || "איך זה עובד?";
  const finalCtaHeadline = content.final_cta_headline || content.hero_headline;
  const finalCtaSubline = content.final_cta_subline || content.hero_subheadline;

  const pageStyle: React.CSSProperties = {
    background,
    color: text,
    fontFamily,
  };

  const heroGradient = `radial-gradient(ellipse 90% 60% at 50% 0%, ${rgba(primary, 0.14)}, transparent 70%), radial-gradient(ellipse 70% 50% at 85% 10%, ${rgba(secondary, 0.10)}, transparent 60%)`;

  return (
    <div className="min-h-screen flex flex-col" style={pageStyle} dir="rtl">
      {/* ─── Navbar ─── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{ background: rgba(background, 0.82), borderColor: rgba(primary, 0.08) }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link href="#top" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              {businessName?.[0] || "K"}
            </div>
            <span className="font-bold text-base tracking-tight">{businessName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: rgba(text, 0.75) }}>
            <a href="#features" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.85 }}>יתרונות</a>
            {steps.length > 0 && (
              <a href="#how" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.85 }}>איך זה עובד</a>
            )}
            <a href="#cta" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.85 }}>צור קשר</a>
          </nav>

          <a
            href="#cta"
            onClick={trackClick}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-sm"
            style={{ background: accent, color: accentFg }}
          >
            {primaryCta}
          </a>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section id="top" className="relative overflow-hidden" style={{ background: heroGradient }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-right">
            {content.hero_eyebrow && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                style={{ background: rgba(primary, 0.1), color: primary, border: `1px solid ${rgba(primary, 0.18)}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }} />
                {content.hero_eyebrow}
              </div>
            )}

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5"
              style={{ color: text }}
            >
              <span
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {content.hero_headline}
              </span>
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed mb-8 max-w-xl" style={{ color: rgba(text, 0.72) }}>
              {content.hero_subheadline}
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <a
                href="#cta"
                onClick={trackClick}
                className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-base font-bold shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: accent, color: accentFg }}
              >
                {primaryCta}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </a>
              <a
                href={steps.length ? "#how" : "#features"}
                className="inline-flex items-center gap-2 px-5 h-12 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5"
                style={{ color: text, border: `1.5px solid ${rgba(primary, 0.25)}`, background: rgba(primary, 0.02) }}
              >
                {secondaryCta}
              </a>
            </div>

            {content.social_proof_line && (
              <p className="mt-8 text-sm flex items-center gap-2" style={{ color: rgba(text, 0.55) }}>
                <span className="inline-flex items-center gap-0.5" style={{ color: accent }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
                    </svg>
                  ))}
                </span>
                {content.social_proof_line}
              </p>
            )}
          </div>

          <div className="relative">
            <div
              className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-[5/6]"
              style={{
                background: `linear-gradient(135deg, ${rgba(primary, 0.9)}, ${rgba(secondary, 0.9)})`,
                boxShadow: `0 30px 60px -20px ${rgba(primary, 0.3)}`,
              }}
            >
              {heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImageUrl} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/90 font-extrabold" style={{ fontSize: "120px" }}>
                    {businessName?.[0] || "K"}
                  </span>
                </div>
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `linear-gradient(180deg, transparent 60%, ${rgba("#000000", 0.3)})` }}
              />
            </div>

            {/* Floating accent badge */}
            <div
              className="hidden sm:flex absolute -bottom-5 -left-5 items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
              style={{ background, border: `1px solid ${rgba(primary, 0.15)}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, color: "#fff" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: text }}>
                  {brand?.differentiation ? trimLabel(brand.differentiation, 28) : "אמין ומדויק"}
                </p>
                <p className="text-[11px]" style={{ color: rgba(text, 0.55) }}>
                  {brand?.core_message ? trimLabel(brand.core_message, 34) : "מוכן ברגע"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonial strip ─── */}
      {content.testimonial_quote && (
        <section className="py-10" style={{ background: rgba(primary, 0.04) }}>
          <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
            <svg className="w-8 h-8 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="currentColor" style={{ color: primary }}>
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
            <p className="text-xl sm:text-2xl font-semibold leading-relaxed" style={{ color: text }}>
              “{content.testimonial_quote}”
            </p>
            {content.testimonial_attribution && (
              <p className="mt-4 text-sm" style={{ color: rgba(text, 0.6) }}>
                — {content.testimonial_attribution}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ─── Features ─── */}
      {features.length > 0 && (
        <section id="features" className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <p className="text-sm font-bold mb-2 tracking-wider uppercase" style={{ color: primary }}>
                היתרונות שלנו
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: text }}>
                מה תקבלו
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group relative p-6 rounded-2xl transition-all hover:-translate-y-1"
                  style={{ background: rgba(primary, 0.035), border: `1px solid ${rgba(primary, 0.1)}` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                    style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, color: "#fff" }}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
                      {ICONS[i % ICONS.length]}
                    </svg>
                  </div>
                  <h3 className="font-bold text-base mb-1.5 leading-snug" style={{ color: text }}>
                    {f.title}
                  </h3>
                  {f.description && (
                    <p className="text-sm leading-relaxed" style={{ color: rgba(text, 0.65) }}>
                      {f.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── How it works ─── */}
      {steps.length > 0 && (
        <section id="how" className="py-20 sm:py-24" style={{ background: rgba(primary, 0.035) }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-12">
              <p className="text-sm font-bold mb-2 tracking-wider uppercase" style={{ color: primary }}>
                איך זה עובד
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: text }}>
                שלושה שלבים. זהו.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="relative p-6 rounded-2xl"
                  style={{ background, border: `1px solid ${rgba(primary, 0.12)}` }}
                >
                  <div
                    className="absolute -top-4 right-6 w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md"
                    style={{ background: accent, color: accentFg }}
                  >
                    {i + 1}
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-lg mb-2" style={{ color: text }}>
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: rgba(text, 0.65) }}>
                      {s.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Final CTA / Lead form ─── */}
      <section id="cta" className="py-20 sm:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})`, opacity: 1 }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, ${rgba(accent, 0.35)}, transparent 60%)` }}
        />

        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div className="text-right" style={{ color: primaryFg }}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4">
              {finalCtaHeadline}
            </h2>
            <p className="text-base sm:text-lg opacity-85 leading-relaxed">
              {finalCtaSubline}
            </p>
          </div>

          <div
            className="rounded-3xl p-6 sm:p-7 shadow-2xl"
            style={{ background, border: `1px solid rgba(255,255,255,0.3)` }}
          >
            {done ? (
              <div className="text-center space-y-3 py-4">
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
                  style={{ background: accent, color: accentFg }}
                >
                  {submitting ? "שולח..." : content.cta}
                </button>
                <p className="text-xs text-center pt-1" style={{ color: rgba(text, 0.45) }}>
                  ללא ספאם. המייל שלכם נשמר אצלנו בלבד.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t py-10" style={{ borderColor: rgba(primary, 0.08) }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3" style={{ color: rgba(text, 0.72) }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              {businessName?.[0] || "K"}
            </div>
            <span className="font-bold">{businessName}</span>
          </div>
          <div className="flex items-center gap-6" style={{ color: rgba(text, 0.55) }}>
            <a href="#features" className="hover:opacity-100" style={{ opacity: 0.85 }}>יתרונות</a>
            {steps.length > 0 && (
              <a href="#how" className="hover:opacity-100" style={{ opacity: 0.85 }}>איך זה עובד</a>
            )}
            <a href="#cta" className="hover:opacity-100" style={{ opacity: 0.85 }}>צור קשר</a>
          </div>
          <p style={{ color: rgba(text, 0.5) }}>
            © {new Date().getFullYear()} · נוצר ב-
            <Link href="/" className="font-semibold hover:underline" style={{ color: primary }}>
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
