"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface Campaign {
  business_name: string;
  business_description: string;
  facebook: { headline: string; body: string; cta: string };
  instagram: { headline: string; body: string; cta: string };
  linkedin: { headline: string; body: string; cta: string };
  landing_page: {
    hero_headline: string;
    hero_subheadline: string;
    features: string[];
    cta: string;
  };
}

type Status = "loading" | "scanning" | "generating" | "done" | "error";

function PreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url");

  const [status, setStatus] = useState<Status>("loading");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!url) {
      router.push("/");
      return;
    }

    async function generate() {
      setStatus("scanning");

      // Small delay to show scanning state
      await new Promise((r) => setTimeout(r, 1500));
      setStatus("generating");

      try {
        const res = await fetch("/api/campaigns/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
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
  }, [url, router]);

  if (status === "loading" || status === "scanning" || status === "generating") {
    return <LoadingState status={status} url={url!} />;
  }

  if (status === "error") {
    return <ErrorState error={error} onRetry={() => router.push("/")} />;
  }

  if (!campaign) return null;

  return <ResultsView campaign={campaign} url={url!} />;
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

function LoadingState({ status, url }: { status: string; url: string }) {
  const steps = [
    { key: "scanning", label: "Scanning website...", sublabel: url },
    {
      key: "generating",
      label: "AI is building your campaign...",
      sublabel: "Creating copy for Facebook, Instagram & LinkedIn",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">K</span>
        </div>

        <div className="space-y-6">
          {steps.map((step, i) => {
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

/* ---------- Results ---------- */

function ResultsView({
  campaign,
  url,
}: {
  campaign: Campaign;
  url: string;
}) {
  const [unlockedPlatforms, setUnlockedPlatforms] = useState<Set<string>>(
    new Set()
  );

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
            Source: {url}
          </p>
        </div>

        {/* Platform cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {platforms.map((platform) => {
            const isLocked = !unlockedPlatforms.has(platform.key);

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

                {/* Content */}
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
                        {platform.data.headline}
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
                        {platform.data.body}
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
                        {platform.data.cta}
                      </p>
                    </div>
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
                  <span
                    key={i}
                    className="text-sm text-foreground"
                  >
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
            Unlock all ad copy, images, video script, and a conversion-optimized
            landing page — ready to publish.
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
