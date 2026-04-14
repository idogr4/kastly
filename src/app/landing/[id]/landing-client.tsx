"use client";

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
}

const FONT_MAP: Record<string, string> = {
  "modern-sans":
    '"Heebo", "Inter", system-ui, -apple-system, sans-serif',
  "serif-elegant":
    '"Frank Ruhl Libre", "David Libre", Georgia, serif',
  "handwritten-warm":
    '"Suez One", "Heebo", system-ui, sans-serif',
  "bold-geometric":
    '"Rubik", "Heebo", system-ui, sans-serif',
  "clean-sans":
    '"Assistant", "Heebo", system-ui, sans-serif',
};

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
  const background = brand?.colors?.background || "#fafafa";
  const text = brand?.colors?.text || "#1a1a2e";
  const fontFamily = FONT_MAP[brand?.font_style || "modern-sans"] || FONT_MAP["modern-sans"];

  const pageStyle: React.CSSProperties = {
    background: `linear-gradient(180deg, ${primary}14, ${background} 28%, ${background})`,
    color: text,
    fontFamily,
  };

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

  return (
    <div className="min-h-screen" style={pageStyle} dir="rtl">
      <main className="max-w-2xl mx-auto px-6 py-16 sm:py-20">
        <div className="text-center space-y-6 mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border shadow-sm"
            style={{ borderColor: `${primary}33` }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: primary }}
            >
              <span className="text-white font-bold text-[10px]">
                {businessName?.[0] || "K"}
              </span>
            </div>
            <span className="text-xs font-medium">{businessName}</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight"
            style={{ color: text }}
          >
            {headline}
          </h1>
          <p className="text-lg leading-relaxed max-w-lg mx-auto opacity-75">
            {subheadline}
          </p>
        </div>

        {features.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-3 mb-10">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-4 text-center shadow-sm border"
                style={{ borderColor: `${primary}20` }}
              >
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  }}
                >
                  ✓
                </div>
                <p className="text-sm font-medium" style={{ color: text }}>
                  {f}
                </p>
              </div>
            ))}
          </div>
        )}

        <div
          className="rounded-2xl bg-white p-6 shadow-xl border"
          style={{ borderColor: `${primary}25` }}
        >
          {done ? (
            <div className="text-center space-y-3 py-6">
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
                style={{ background: `${accent}40` }}
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={primary}
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold" style={{ color: text }}>
                קיבלנו! תודה.
              </h3>
              <p className="text-sm opacity-70">נחזור אליכם בקרוב.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs opacity-70 block mb-1">שם מלא</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="לא חובה"
                  className="w-full px-3 py-2.5 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 transition-all border"
                  style={
                    {
                      color: text,
                      borderColor: `${primary}30`,
                      ["--tw-ring-color" as string]: `${primary}40`,
                    } as React.CSSProperties
                  }
                />
              </div>
              <div>
                <label className="text-xs opacity-70 block mb-1">מייל *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 transition-all border text-right"
                  style={
                    {
                      color: text,
                      borderColor: `${primary}30`,
                      ["--tw-ring-color" as string]: `${primary}40`,
                    } as React.CSSProperties
                  }
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  color: "#ffffff",
                }}
              >
                {submitting ? "שולח..." : cta}
              </button>
            </form>
          )}
        </div>

        {brand?.core_message && (
          <p className="text-center text-sm opacity-60 mt-8 leading-relaxed">
            {brand.core_message}
          </p>
        )}

        <p className="text-center text-xs opacity-40 mt-8">
          נוצר ב-
          <a href="/" className="hover:underline" style={{ color: primary }}>
            Kastly
          </a>
        </p>
      </main>
    </div>
  );
}
