"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface AdScores {
  hook: number;
  clarity: number;
  cta: number;
  platform_fit: number;
  overall: number;
}

interface AdVariation {
  hook_type: "pain" | "curiosity" | "numbers";
  headline: string;
  body: string;
  cta: string;
  scores: AdScores;
}

interface Persona {
  age_range: string;
  gender: string;
  pain_points: string[];
  desires: string[];
  scroll_stoppers: string[];
  objections: string[];
  tone: string;
}

interface Campaign {
  business_name: string;
  business_description: string;
  persona: Persona;
  facebook: AdVariation[];
  instagram: AdVariation[];
  linkedin: AdVariation[];
  landing_page: {
    hero_headline: string;
    hero_subheadline: string;
    features: string[];
    cta: string;
  };
  image_prompts?: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };
}

type PlatformImages = Record<string, { url: string | null; loading: boolean }>;

type Status = "loading" | "scanning" | "generating" | "done" | "error";

const HOOK_LABELS: Record<string, string> = {
  pain: "Pain-based",
  curiosity: "Curiosity-based",
  numbers: "Numbers-based",
};

const HOOK_COLORS: Record<string, string> = {
  pain: "bg-red-50 text-red-600 border-red-200",
  curiosity: "bg-amber-50 text-amber-600 border-amber-200",
  numbers: "bg-blue-50 text-blue-600 border-blue-200",
};

function PreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url");
  const description = searchParams.get("description");

  const [status, setStatus] = useState<Status>("loading");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState("");

  const input = url || description;
  const inputLabel = url ? url : "Text description";

  useEffect(() => {
    if (!url && !description) {
      router.push("/");
      return;
    }

    async function generate() {
      setStatus("scanning");
      await new Promise((r) => setTimeout(r, 1500));
      setStatus("generating");

      try {
        const body = url ? { url } : { description };
        const res = await fetch("/api/campaigns/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Generation failed");
        }

        const data = await res.json();
        setCampaign(data.campaign);
        setStatus("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStatus("error");
      }
    }

    generate();
  }, [url, description, router]);

  if (status === "loading" || status === "scanning" || status === "generating") {
    return <LoadingState status={status} input={inputLabel} isText={!url} />;
  }

  if (status === "error") {
    return <ErrorState error={error} onRetry={() => router.push("/")} />;
  }

  if (!campaign) return null;

  return <ResultsView campaign={campaign} input={input!} isText={!url} />;
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}

/* ---------- Loading ---------- */

function LoadingState({ status, input, isText }: { status: string; input: string; isText: boolean }) {
  const steps = [
    {
      key: "scanning",
      label: isText ? "Analyzing your business..." : "Deep-scanning website...",
      sublabel: isText ? "Building brand profile from your description" : `Scanning homepage, about, products & reviews — ${input}`,
    },
    {
      key: "generating",
      label: "AI is crafting premium ads...",
      sublabel: "Persona, A/B variations, quality scoring + generating ad images",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">K</span>
        </div>

        <div className="space-y-6">
          {steps.map((step) => {
            const isActive =
              step.key === status ||
              (step.key === "scanning" && status === "loading");
            const isDone =
              (step.key === "scanning" && status === "generating") ||
              status === "done";

            return (
              <div
                key={step.key}
                className={`flex items-start gap-4 text-left transition-opacity ${
                  isActive ? "opacity-100" : isDone ? "opacity-50" : "opacity-30"
                }`}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {step.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate max-w-[280px]">
                    {step.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Error ---------- */

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Generation failed
          </h2>
          <p className="text-sm text-muted mt-2">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/* ---------- Score Bar ---------- */

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? "from-green-400 to-green-500" : value >= 6 ? "from-amber-400 to-amber-500" : "from-red-400 to-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-foreground w-6 text-right">{value}</span>
    </div>
  );
}

/* ---------- Results ---------- */

function ResultsView({
  campaign,
  input,
  isText,
}: {
  campaign: Campaign;
  input: string;
  isText: boolean;
}) {
  const [unlockedPlatforms, setUnlockedPlatforms] = useState<Set<string>>(
    new Set()
  );
  const [selectedVariation, setSelectedVariation] = useState<
    Record<string, number>
  >({ facebook: 0, instagram: 0, linkedin: 0 });
  const [platformImages, setPlatformImages] = useState<PlatformImages>({
    facebook: { url: null, loading: true },
    instagram: { url: null, loading: true },
    linkedin: { url: null, loading: true },
  });

  // Generate images on mount
  useEffect(() => {
    if (!campaign.image_prompts) {
      setPlatformImages({
        facebook: { url: null, loading: false },
        instagram: { url: null, loading: false },
        linkedin: { url: null, loading: false },
      });
      return;
    }

    const platformKeys = ["facebook", "instagram", "linkedin"] as const;
    platformKeys.forEach(async (platform) => {
      const prompt = campaign.image_prompts?.[platform];
      if (!prompt) {
        setPlatformImages((prev) => ({
          ...prev,
          [platform]: { url: null, loading: false },
        }));
        return;
      }

      try {
        const res = await fetch("/api/campaigns/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, platform }),
        });

        if (res.ok) {
          const data = await res.json();
          setPlatformImages((prev) => ({
            ...prev,
            [platform]: { url: data.image_url, loading: false },
          }));
        } else {
          setPlatformImages((prev) => ({
            ...prev,
            [platform]: { url: null, loading: false },
          }));
        }
      } catch {
        setPlatformImages((prev) => ({
          ...prev,
          [platform]: { url: null, loading: false },
        }));
      }
    });
  }, [campaign.image_prompts]);

  const platforms = [
    {
      key: "facebook",
      label: "Facebook",
      color: "bg-blue-500",
      data: campaign.facebook,
    },
    {
      key: "instagram",
      label: "Instagram",
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      data: campaign.instagram,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      color: "bg-blue-700",
      data: campaign.linkedin,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Kastly
          </span>
        </a>
        <a
          href="/"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          &larr; New campaign
        </a>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Campaign header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success-soft text-success text-xs font-medium mb-4">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Campaign ready
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {campaign.business_name}
          </h1>
          <p className="text-muted mt-1">{campaign.business_description}</p>
          <p className="text-xs text-muted/60 mt-2">
            {isText ? "From text description" : `Source: ${input}`}
          </p>
        </div>

        {/* Persona Card */}
        {campaign.persona && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm mb-8">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">
                Target Audience Persona
              </span>
            </div>
            <div className="p-5">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 p-3 rounded-lg bg-background">
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Age Range</p>
                      <p className="text-sm font-medium text-foreground">{campaign.persona.age_range}</p>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-background">
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Gender</p>
                      <p className="text-sm font-medium text-foreground">{campaign.persona.gender}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Pain Points</p>
                    <ul className="space-y-1.5">
                      {campaign.persona.pain_points.map((p, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-red-400 mt-0.5 shrink-0">&#x2022;</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Desires</p>
                    <ul className="space-y-1.5">
                      {campaign.persona.desires.map((d, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-green-400 mt-0.5 shrink-0">&#x2022;</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Scroll Stoppers</p>
                    <ul className="space-y-1.5">
                      {campaign.persona.scroll_stoppers.map((s, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5 shrink-0">&#x2022;</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Objections</p>
                    <ul className="space-y-1.5">
                      {campaign.persona.objections.map((o, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-muted mt-0.5 shrink-0">&#x2022;</span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Brand Voice</p>
                    <p className="text-sm text-foreground italic">&ldquo;{campaign.persona.tone}&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform cards with A/B variations */}
        <div className="space-y-6 mb-12">
          {platforms.map((platform) => {
            const isLocked = !unlockedPlatforms.has(platform.key);
            const variations = Array.isArray(platform.data) ? platform.data : [];
            const activeIdx = selectedVariation[platform.key] ?? 0;
            const activeAd = variations[activeIdx];

            return (
              <div
                key={platform.key}
                className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm"
              >
                {/* Platform header */}
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-md ${platform.color} flex items-center justify-center`}
                  >
                    <span className="text-white text-[10px] font-bold">
                      {platform.label[0]}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {platform.label}
                  </span>
                  <span className="text-xs text-muted ml-1">
                    — {variations.length} variations
                  </span>
                  {isLocked && (
                    <svg
                      className="w-3.5 h-3.5 text-muted ml-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  )}
                </div>

                {/* Ad Image */}
                {(() => {
                  const img = platformImages[platform.key];
                  const aspectClass =
                    platform.key === "instagram"
                      ? "aspect-square"
                      : "aspect-[1.91/1]";
                  const sizeLabel =
                    platform.key === "facebook"
                      ? "1200 x 628"
                      : platform.key === "instagram"
                        ? "1080 x 1080"
                        : "1200 x 627";

                  return (
                    <div className="px-5 pt-4">
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-2">
                        Ad Image — {sizeLabel}
                      </p>
                      <div
                        className={`${aspectClass} w-full rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-border relative`}
                      >
                        {img?.loading ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-muted">
                              Generating image...
                            </span>
                          </div>
                        ) : img?.url ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={`${platform.label} ad creative`}
                              className={`w-full h-full object-cover ${
                                isLocked ? "blur-lg" : ""
                              }`}
                            />
                            {isLocked && (
                              <div className="absolute inset-0 bg-surface/30 backdrop-blur-sm flex items-center justify-center">
                                <div className="flex items-center gap-2 px-4 py-2 bg-surface/90 rounded-xl border border-border shadow-sm">
                                  <svg
                                    className="w-4 h-4 text-muted"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                  </svg>
                                  <span className="text-xs font-medium text-muted">
                                    Unlock to download
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <svg
                              className="w-8 h-8 text-muted/40"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-xs text-muted/60">
                              Image unavailable
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Variation tabs */}
                {variations.length > 0 && (
                  <div className="px-5 pt-4 flex gap-2">
                    {variations.map((v, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedVariation((prev) => ({
                            ...prev,
                            [platform.key]: idx,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          activeIdx === idx
                            ? HOOK_COLORS[v.hook_type] || "bg-gray-50 text-gray-600 border-gray-200"
                            : "bg-background text-muted border-border hover:border-primary/30"
                        }`}
                      >
                        {HOOK_LABELS[v.hook_type] || v.hook_type}
                        {v.scores && (
                          <span className="ml-1.5 opacity-70">{v.scores.overall}/10</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active variation content */}
                {activeAd && (
                  <div className="p-5 relative">
                    <div
                      className={`space-y-4 ${isLocked ? "select-none" : ""}`}
                    >
                      {/* Headline — always visible */}
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
                          Headline
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {activeAd.headline}
                        </p>
                      </div>

                      {/* Body — blurred when locked */}
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
                          Body
                        </p>
                        <p
                          className={`text-sm text-foreground leading-relaxed ${
                            isLocked ? "blur-[6px]" : ""
                          }`}
                        >
                          {activeAd.body}
                        </p>
                      </div>

                      {/* CTA — blurred when locked */}
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted mb-1">
                          CTA
                        </p>
                        <p
                          className={`text-sm font-medium text-accent ${
                            isLocked ? "blur-[6px]" : ""
                          }`}
                        >
                          {activeAd.cta}
                        </p>
                      </div>

                      {/* Quality scores */}
                      {activeAd.scores && (
                        <div className={`pt-3 border-t border-border ${isLocked ? "blur-[6px]" : ""}`}>
                          <p className="text-[10px] uppercase tracking-widest text-muted mb-2">
                            Quality Score
                          </p>
                          <div className="space-y-1.5">
                            <ScoreBar label="Hook" value={activeAd.scores.hook} />
                            <ScoreBar label="Clarity" value={activeAd.scores.clarity} />
                            <ScoreBar label="CTA" value={activeAd.scores.cta} />
                            <ScoreBar label="Platform fit" value={activeAd.scores.platform_fit} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lock overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent flex flex-col items-center justify-end pb-5">
                        <button
                          onClick={() =>
                            setUnlockedPlatforms((prev) => {
                              const next = new Set(prev);
                              next.add(platform.key);
                              return next;
                            })
                          }
                          className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors shadow-md"
                        >
                          Unlock {platform.label} Copy
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Landing page preview */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">
              Landing Page
            </span>
            <svg
              className="w-3.5 h-3.5 text-muted ml-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <div className="p-8 relative">
            {/* Landing page mock */}
            <div className="max-w-lg mx-auto text-center space-y-5 select-none">
              <h2 className="text-2xl font-bold text-foreground">
                {campaign.landing_page.hero_headline}
              </h2>
              <p className="text-muted blur-[6px]">
                {campaign.landing_page.hero_subheadline}
              </p>
              <div className="flex flex-col gap-2 items-center blur-[6px]">
                {campaign.landing_page.features.map((f, i) => (
                  <span key={i} className="text-sm text-foreground">
                    {f}
                  </span>
                ))}
              </div>
              <div className="blur-[6px]">
                <span className="inline-block px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium">
                  {campaign.landing_page.cta}
                </span>
              </div>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent flex flex-col items-center justify-end pb-8">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted">
                  Full landing page with HTML export
                </p>
                <button className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors shadow-md">
                  Unlock Full Campaign — $9
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center space-y-4 py-8">
          <h3 className="text-xl font-bold text-foreground">
            Want the full package?
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Unlock all ad copy, A/B variations, quality scores, persona insights,
            and a conversion-optimized landing page — ready to publish.
          </p>
          <button className="px-8 py-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
            Unlock Everything — $29
          </button>
          <p className="text-xs text-muted/60">One-time payment. No subscription.</p>
        </div>
      </main>
    </div>
  );
}
