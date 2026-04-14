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

interface StorySlide {
  slide: number;
  role: string;
  title: string;
  body: string;
  cta: string;
  background_style?: string;
  visual_prompt?: string;
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
  stories?: StorySlide[];
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

type PlatformImages = Record<string, { url: string | null; loading: boolean }>;

type Status = "loading" | "scanning" | "generating" | "done" | "error";

const HOOK_LABELS: Record<string, string> = {
  pain: "מבוסס כאב",
  curiosity: "מבוסס סקרנות",
  numbers: "מבוסס מספרים",
};

const HOOK_COLORS: Record<string, string> = {
  pain: "bg-red-50 text-red-600 border-red-200",
  curiosity: "bg-amber-50 text-amber-600 border-amber-200",
  numbers: "bg-blue-50 text-blue-600 border-blue-200",
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  linkedin: "לינקדאין",
};

function PreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get("url");
  const description = searchParams.get("description");

  const [status, setStatus] = useState<Status>("loading");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [error, setError] = useState("");

  const input = url || description;
  const inputLabel = url ? url : "תיאור בטקסט";

  useEffect(() => {
    if (!url && !description) {
      router.push("/");
      return;
    }

    async function generate() {
      setStatus("scanning");
      await new Promise((r) => setTimeout(r, 1200));
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
          throw new Error(data.error || "יצירת הקמפיין נכשלה");
        }

        const data = await res.json();
        setCampaign(data.campaign);
        if (data.plan) setPlan(data.plan);
        setStatus("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "משהו השתבש");
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

  return (
    <ResultsView
      campaign={campaign}
      input={input!}
      isText={!url}
      plan={plan}
    />
  );
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
      label: isText ? "מנתחים את העסק שלך..." : "סורקים את האתר לעומק...",
      sublabel: isText
        ? "בונים פרופיל מותג מהתיאור שלך"
        : `סורקים דף ראשי, אודות, מוצרים והמלצות — ${input}`,
    },
    {
      key: "generating",
      label: "ה-AI מכין לך מודעות פרימיום...",
      sublabel: "פרסונה, וריאציות A/B, ציוני איכות + תמונות",
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
                className={`flex items-start gap-4 text-right transition-opacity ${
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            לא הצלחנו לייצר קמפיין
          </h2>
          <p className="text-sm text-muted mt-2">{error}</p>
          <p className="text-xs text-muted/70 mt-3">
            אפשר לנסות קישור אחר, להדביק את דף הבית של הדומיין, או לתאר את
            העסק בטקסט חופשי.
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          חזרה ונסיון נוסף
        </button>
      </div>
    </div>
  );
}

/* ---------- Copy button ---------- */

function CopyButton({ text, label = "העתק" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted hover:text-primary hover:bg-primary-soft transition-colors"
      aria-label="העתק טקסט"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          הועתק
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

/* ---------- Image download with optional watermark ---------- */

async function downloadImage(url: string, filename: string, watermark: boolean) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    if (!watermark) {
      const objectUrl = URL.createObjectURL(blob);
      triggerDownload(objectUrl, filename);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      return;
    }

    // Draw image on canvas + watermark
    const img = new Image();
    img.crossOrigin = "anonymous";
    const objectUrl = URL.createObjectURL(blob);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("failed to load"));
      img.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas ctx");
    ctx.drawImage(img, 0, 0);

    // Watermark — diagonal tiled "Kastly" across the image
    ctx.save();
    const fontSize = Math.max(24, Math.floor(canvas.width / 18));
    ctx.font = `bold ${fontSize}px Heebo, Arial, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    const step = fontSize * 3.5;
    const span = Math.max(canvas.width, canvas.height) * 1.5;
    for (let y = -span; y < span; y += step) {
      for (let x = -span; x < span; x += step * 1.2) {
        ctx.strokeText("Kastly", x, y);
        ctx.fillText("Kastly", x, y);
      }
    }
    ctx.restore();

    // Corner badge
    ctx.save();
    const badgePad = Math.floor(canvas.width * 0.015);
    const badgeFont = Math.max(18, Math.floor(canvas.width / 40));
    ctx.font = `bold ${badgeFont}px Heebo, Arial, sans-serif`;
    const text = "נוצר ב-Kastly";
    const metrics = ctx.measureText(text);
    const bw = metrics.width + badgePad * 2;
    const bh = badgeFont + badgePad * 1.2;
    ctx.fillStyle = "rgba(108, 92, 231, 0.85)";
    ctx.fillRect(canvas.width - bw - badgePad, canvas.height - bh - badgePad, bw, bh);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      text,
      canvas.width - bw / 2 - badgePad,
      canvas.height - bh / 2 - badgePad
    );
    ctx.restore();

    canvas.toBlob((outBlob) => {
      if (!outBlob) return;
      const out = URL.createObjectURL(outBlob);
      triggerDownload(out, filename);
      setTimeout(() => URL.revokeObjectURL(out), 2000);
      URL.revokeObjectURL(objectUrl);
    }, "image/png");
  } catch (err) {
    console.error("download failed", err);
    alert("ההורדה נכשלה. נסו שוב.");
  }
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ---------- Score Bar ---------- */

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 8 ? "from-green-400 to-green-500" : value >= 6 ? "from-amber-400 to-amber-500" : "from-red-400 to-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted w-24 shrink-0">{label}</span>
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
  campaign: initialCampaign,
  input,
  isText,
  plan,
}: {
  campaign: Campaign;
  input: string;
  isText: boolean;
  plan: string;
}) {
  const isFreePlan = plan === "free" || !plan;

  const [campaign, setCampaign] = useState<Campaign>(initialCampaign);
  const [selectedVariation, setSelectedVariation] = useState<
    Record<string, number>
  >({ facebook: 0, instagram: 0, linkedin: 0 });
  const [chatOpen, setChatOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [industry, setIndustry] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [platformImages, setPlatformImages] = useState<PlatformImages>({
    facebook: { url: null, loading: true },
    instagram: { url: null, loading: true },
    linkedin: { url: null, loading: true },
  });

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
    { key: "facebook", color: "bg-blue-500", data: campaign.facebook },
    {
      key: "instagram",
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      data: campaign.instagram,
    },
    { key: "linkedin", color: "bg-blue-700", data: campaign.linkedin },
  ];

  return (
    <div className="min-h-screen bg-background">
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
          קמפיין חדש &rarr;
        </a>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success-soft text-success text-xs font-medium mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            הקמפיין מוכן
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {campaign.business_name}
          </h1>
          <p className="text-muted mt-1">{campaign.business_description}</p>
          <p className="text-xs text-muted/60 mt-2">
            {isText ? "מבוסס על תיאור בטקסט" : `מקור: `}
            {!isText && <span dir="ltr">{input}</span>}
          </p>
        </div>

        {/* Persona */}
        {campaign.persona && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm mb-8">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent" />
              <span className="text-sm font-semibold text-foreground">
                פרסונת קהל היעד
              </span>
            </div>
            <div className="p-5">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 p-3 rounded-lg bg-background">
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-1">טווח גילאים</p>
                      <p className="text-sm font-medium text-foreground">{campaign.persona.age_range}</p>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-background">
                      <p className="text-[10px] uppercase tracking-widest text-muted mb-1">מגדר</p>
                      <p className="text-sm font-medium text-foreground">{campaign.persona.gender}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-2">נקודות כאב</p>
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
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-2">רצונות</p>
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
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-2">עוצרי גלילה</p>
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
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-2">התנגדויות</p>
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
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">קול המותג</p>
                    <p className="text-sm text-foreground italic">&ldquo;{campaign.persona.tone}&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform cards */}
        <div className="space-y-6 mb-12">
          {platforms.map((platform) => {
            const variations = Array.isArray(platform.data) ? platform.data : [];
            const activeIdx = selectedVariation[platform.key] ?? 0;
            const activeAd = variations[activeIdx];
            const img = platformImages[platform.key];
            const aspectClass =
              platform.key === "instagram" ? "aspect-square" : "aspect-[1.91/1]";
            const sizeLabel =
              platform.key === "facebook"
                ? "1200 x 628"
                : platform.key === "instagram"
                  ? "1080 x 1080"
                  : "1200 x 627";

            return (
              <div
                key={platform.key}
                className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm"
              >
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-md ${platform.color} flex items-center justify-center`}
                  >
                    <span className="text-white text-[10px] font-bold">
                      {PLATFORM_LABELS[platform.key][0]}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {PLATFORM_LABELS[platform.key]}
                  </span>
                  <span className="text-xs text-muted">
                    — {variations.length} וריאציות
                  </span>
                </div>

                {/* Image */}
                <div className="px-5 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted">
                      תמונת מודעה — {sizeLabel}
                    </p>
                    {img?.url && (
                      <button
                        onClick={() =>
                          downloadImage(
                            img.url!,
                            `kastly-${platform.key}-${campaign.business_name}.png`,
                            isFreePlan
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-hover transition-colors shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                        </svg>
                        הורד
                      </button>
                    )}
                  </div>
                  <div
                    className={`${aspectClass} w-full rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-border relative`}
                  >
                    {img?.loading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-muted">
                          מייצרים תמונה...
                        </span>
                      </div>
                    ) : img?.url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`${PLATFORM_LABELS[platform.key]} ad creative`}
                          className="w-full h-full object-cover"
                        />
                        {isFreePlan && <WatermarkOverlay />}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <span className="text-xs text-muted/60">
                          התמונה אינה זמינה
                        </span>
                      </div>
                    )}
                  </div>
                  {isFreePlan && img?.url && (
                    <p className="text-[11px] text-muted/70 mt-1.5">
                      בחבילה החינמית מופיע סימן מים. שדרגו להורדה נקייה.
                    </p>
                  )}
                </div>

                {/* Variation tabs */}
                {variations.length > 0 && (
                  <div className="px-5 pt-4 flex gap-2 flex-wrap">
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
                          <span className="mr-1.5 opacity-70">{v.scores.overall}/10</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active variation */}
                {activeAd && (
                  <div className="p-5">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted">
                            כותרת
                          </p>
                          <CopyButton text={activeAd.headline} />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {activeAd.headline}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted">
                            גוף המודעה
                          </p>
                          <CopyButton text={activeAd.body} />
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                          {activeAd.body}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted">
                            קריאה לפעולה
                          </p>
                          <CopyButton text={activeAd.cta} />
                        </div>
                        <p className="text-sm font-medium text-accent">
                          {activeAd.cta}
                        </p>
                      </div>

                      <div className="pt-2">
                        <CopyButton
                          label="העתק את המודעה המלאה"
                          text={`${activeAd.headline}\n\n${activeAd.body}\n\n${activeAd.cta}`}
                        />
                      </div>

                      {activeAd.scores && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-[10px] uppercase tracking-widest text-muted mb-2">
                            ציון איכות
                          </p>
                          <div className="space-y-1.5">
                            <ScoreBar label="הוק" value={activeAd.scores.hook} />
                            <ScoreBar label="בהירות" value={activeAd.scores.clarity} />
                            <ScoreBar label="CTA" value={activeAd.scores.cta} />
                            <ScoreBar label="התאמה לפלטפורמה" value={activeAd.scores.platform_fit} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Landing page */}
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary" />
              <span className="text-sm font-semibold text-foreground">
                דף נחיתה
              </span>
            </div>
            <CopyButton
              label="העתק את כל הדף"
              text={`${campaign.landing_page.hero_headline}\n\n${campaign.landing_page.hero_subheadline}\n\n${campaign.landing_page.features.join("\n")}\n\n${campaign.landing_page.cta}`}
            />
          </div>

          <div className="p-8">
            <div className="max-w-lg mx-auto text-center space-y-5">
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-foreground">
                    {campaign.landing_page.hero_headline}
                  </h2>
                </div>
                <div className="flex justify-center mt-1">
                  <CopyButton text={campaign.landing_page.hero_headline} />
                </div>
              </div>
              <div>
                <p className="text-muted">
                  {campaign.landing_page.hero_subheadline}
                </p>
                <div className="flex justify-center mt-1">
                  <CopyButton text={campaign.landing_page.hero_subheadline} />
                </div>
              </div>
              <div className="flex flex-col gap-2 items-center">
                {campaign.landing_page.features.map((f, i) => (
                  <span key={i} className="text-sm text-foreground">
                    {f}
                  </span>
                ))}
              </div>
              <div className="inline-block">
                <span className="inline-block px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium">
                  {campaign.landing_page.cta}
                </span>
                <div className="mt-2">
                  <CopyButton text={campaign.landing_page.cta} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Stories */}
        {campaign.stories && campaign.stories.length > 0 && (
          <div className="mt-8 rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="text-sm font-semibold text-foreground">
                סטוריז לאינסטגרם
              </span>
              <span className="text-xs text-muted">— 5 שקפים, 1080x1920</span>
            </div>
            <div className="p-5">
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                {campaign.stories.slice(0, 5).map((s) => (
                  <StoryCard
                    key={s.slide}
                    slide={s}
                    business={campaign.business_name}
                    isFreePlan={isFreePlan}
                  />
                ))}
              </div>
              <div className="mt-4">
                <CopyButton
                  label="העתק את כל הסטוריז"
                  text={campaign.stories
                    .map(
                      (s) =>
                        `שקף ${s.slide} — ${s.role}\n${s.title}\n${s.body}\n${s.cta}`
                    )
                    .join("\n\n")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Video ad */}
        <VideoSection
          campaign={campaign}
          plan={plan}
          platformImages={platformImages}
        />

        {/* Save & Gallery */}
        <div className="mt-8 rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-success" />
            <span className="text-sm font-semibold text-foreground">
              שמירת הקמפיין
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`mt-0.5 w-10 h-6 rounded-full transition-colors shrink-0 ${
                  isPublic ? "bg-primary" : "bg-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${
                    isPublic ? "-translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-foreground">
                  הצגה בגלריה הציבורית
                </p>
                <p className="text-xs text-muted mt-0.5">
                  שתפו את הקמפיין כדוגמה להשראה. הפרטים האישיים שלכם לעולם לא
                  משותפים.
                </p>
              </div>
            </div>

            {isPublic && (
              <div>
                <label className="text-xs text-muted block mb-1.5">
                  תחום (אופציונלי — עוזר לאחרים למצוא)
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="למשל: מסחר אלקטרוני, SaaS, כושר, נדל״ן"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            )}

            <button
              onClick={async () => {
                setSaving(true);
                try {
                  const fbImage = platformImages.facebook?.url;
                  const res = await fetch("/api/campaigns/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      campaign_data: campaign,
                      source_url: isText ? null : input,
                      is_public: isPublic,
                      industry: industry || null,
                      preview_image_url: fbImage || null,
                    }),
                  });
                  if (res.ok) {
                    setSaved(true);
                  } else {
                    const data = await res.json();
                    if (data.error === "Not authenticated") {
                      alert("יש להתחבר כדי לשמור קמפיינים.");
                    } else {
                      alert(data.error || "השמירה נכשלה");
                    }
                  }
                } catch {
                  alert("השמירה נכשלה");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || saved}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-all shadow-sm ${
                saved
                  ? "bg-success text-white"
                  : "bg-foreground text-background hover:opacity-90"
              } ${saving ? "opacity-50 cursor-wait" : ""}`}
            >
              {saved
                ? "נשמר לאיזור האישי!"
                : saving
                  ? "שומרים..."
                  : "שמירת הקמפיין"}
            </button>
          </div>
        </div>

        {/* Chat panel */}
        <ChatPanel
          campaign={campaign}
          onCampaignUpdate={setCampaign}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />

        {/* Bottom CTA */}
        <div className="mt-12 text-center space-y-4 py-8">
          <h3 className="text-xl font-bold text-foreground">
            רוצים הכול בלי סימן מים?
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            בחבילות בתשלום מקבלים תמונות נקיות, סרטוני וידאו, עוד קמפיינים
            ותמיכה בעדיפות.
          </p>
          <a
            href="/pricing"
            className="inline-block px-8 py-3.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            לחבילות ולמחירים
          </a>
          <p className="text-xs text-muted/60">מתחיל מ-₪99 לחודש. ביטול בכל רגע.</p>
        </div>
      </main>
    </div>
  );
}

/* ---------- Story Card ---------- */

const STORY_GRADIENTS = [
  "from-purple-500 via-pink-500 to-orange-400",
  "from-blue-500 via-purple-500 to-pink-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-indigo-600 via-purple-600 to-pink-600",
];

const STORY_ROLE_LABELS: Record<string, string> = {
  hook: "פתיח",
  problem: "בעיה",
  solution: "פתרון",
  proof: "הוכחה",
  cta: "קריאה לפעולה",
};

function StoryCard({
  slide,
  business,
  isFreePlan,
}: {
  slide: StorySlide;
  business: string;
  isFreePlan: boolean;
}) {
  const gradient = STORY_GRADIENTS[(slide.slide - 1) % STORY_GRADIENTS.length];
  const roleLabel = STORY_ROLE_LABELS[slide.role] || slide.role;

  async function handleDownload() {
    // Render the story slide to a canvas at 1080x1920 and download
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grads: Record<string, string[]> = {
      "from-purple-500 via-pink-500 to-orange-400": ["#a855f7", "#ec4899", "#fb923c"],
      "from-blue-500 via-purple-500 to-pink-500": ["#3b82f6", "#a855f7", "#ec4899"],
      "from-emerald-500 via-teal-500 to-cyan-500": ["#10b981", "#14b8a6", "#06b6d4"],
      "from-amber-500 via-orange-500 to-red-500": ["#f59e0b", "#f97316", "#ef4444"],
      "from-indigo-600 via-purple-600 to-pink-600": ["#4f46e5", "#9333ea", "#db2777"],
    };
    const [c1, c2, c3] = grads[gradient] || ["#6c5ce7", "#fd79a8", "#6c5ce7"];
    const lg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    lg.addColorStop(0, c1);
    lg.addColorStop(0.5, c2);
    lg.addColorStop(1, c3);
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Overlay
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 56px Heebo, Arial, sans-serif";
    ctx.fillText(`שקף ${slide.slide} • ${roleLabel}`, canvas.width / 2, 180);

    ctx.font = "bold 96px Heebo, Arial, sans-serif";
    wrapText(ctx, slide.title, canvas.width / 2, 700, canvas.width - 160, 120);

    ctx.font = "48px Heebo, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    wrapText(ctx, slide.body, canvas.width / 2, 1180, canvas.width - 160, 70);

    // CTA pill
    if (slide.cta) {
      const pillW = 700;
      const pillH = 140;
      const pillX = (canvas.width - pillW) / 2;
      const pillY = 1620;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, pillX, pillY, pillW, pillH, 70);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "bold 52px Heebo, Arial, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(slide.cta, canvas.width / 2, pillY + pillH / 2);
      ctx.textBaseline = "alphabetic";
    }

    // Watermark for free plan
    if (isFreePlan) {
      ctx.save();
      ctx.font = "bold 54px Heebo, Arial, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      for (let y = -2000; y < 2000; y += 260) {
        for (let x = -1500; x < 1500; x += 380) {
          ctx.fillText("Kastly", x, y);
        }
      }
      ctx.restore();

      ctx.fillStyle = "rgba(108, 92, 231, 0.9)";
      roundRect(ctx, canvas.width - 350, canvas.height - 100, 320, 70, 12);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 30px Heebo, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("נוצר ב-Kastly", canvas.width - 190, canvas.height - 55);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const href = URL.createObjectURL(blob);
      triggerDownload(href, `kastly-story-${slide.slide}-${business}.png`);
      setTimeout(() => URL.revokeObjectURL(href), 2000);
    }, "image/png");
  }

  return (
    <div className="shrink-0 snap-start w-[220px] space-y-3">
      <div
        className={`relative aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} shadow-md`}
      >
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 p-4 flex flex-col">
          <div className="text-[10px] text-white/80 font-semibold tracking-wider">
            שקף {slide.slide} • {roleLabel}
          </div>
          <div className="flex-1 flex flex-col justify-center text-center">
            <p className="text-white font-bold text-lg leading-tight mb-2">
              {slide.title}
            </p>
            <p className="text-white/90 text-xs leading-snug">{slide.body}</p>
          </div>
          {slide.cta && (
            <div className="text-center">
              <span className="inline-block bg-white text-foreground text-[11px] font-bold px-3 py-1.5 rounded-full">
                {slide.cta}
              </span>
            </div>
          )}
          {isFreePlan && (
            <div className="absolute bottom-2 left-2 bg-primary/85 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
              Kastly
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-1">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
          הורד
        </button>
        <CopyButton
          text={`${slide.title}\n${slide.body}\n${slide.cta}`}
        />
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lineHeight));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------- Chat Panel ---------- */

const QUICK_PROMPTS = [
  "תכתוב גרסה קצרה יותר של כל המודעות",
  "תוסיף יותר דחיפות לכותרות",
  "שנה את הטון לפחות רשמי",
  "תתאים לקהל של נשים 30+",
  "תכתוב מחדש את הכותרת של פייסבוק",
  "תחזק את ה-CTA באינסטגרם",
];

function ChatPanel({
  campaign,
  onCampaignUpdate,
  open,
  onOpenChange,
}: {
  campaign: Campaign;
  onCampaignUpdate: (c: Campaign) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "היי! אני עוזר הקמפיין של Kastly. כתבו לי בחופשיות מה לשפר — לדוגמה: ׳שנה את הטון לפחות רשמי׳, ׳תכתוב גרסה קצרה יותר׳, ׳תוסיף דחיפות לכותרת של פייסבוק׳. אני זוכר את כל הקמפיין ועובד עליו ישירות.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const nextMessages: ChatMsg[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/campaigns/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign,
          message: trimmed,
          history: messages.filter((m) => m.role !== "assistant" || m.content.length < 1000),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.error || "משהו השתבש. נסו שוב.",
          },
        ]);
        return;
      }

      const data = await res.json();
      if (data.campaign) {
        onCampaignUpdate(data.campaign);
      }
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply || "עדכנתי את הקמפיין.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "החיבור נפל. נסו שוב בעוד רגע." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={() => onOpenChange(!open)}
        className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-medium shadow-lg hover:shadow-xl transition-all"
        aria-label="פתיחת עוזר הקמפיין"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {open ? "סגור צ'אט" : "שיפור עם AI"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-[420px] bg-surface border-l border-border shadow-2xl flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-xs">AI</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  עוזר הקמפיין
                </p>
                <p className="text-[11px] text-muted">מבוסס Claude</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg hover:bg-background transition-colors flex items-center justify-center text-muted"
              aria-label="סגירה"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-white rounded-bl-md"
                      : "bg-background text-foreground rounded-br-md border border-border"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-end">
                <div className="px-3.5 py-2.5 rounded-2xl bg-background border border-border">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 space-y-2">
            {messages.length <= 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    disabled={sending}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-border bg-background text-muted hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="כתבו בקשה בעברית..."
                disabled={sending}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
              />
              <button
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                שליחה
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Video Section ---------- */

type VideoStatus = "idle" | "starting" | "rendering" | "ready" | "error";

function VideoSection({
  campaign,
  plan,
  platformImages,
}: {
  campaign: Campaign;
  plan: string;
  platformImages: PlatformImages;
}) {
  const isFreePlan = plan === "free" || !plan;
  const [status, setStatus] = useState<VideoStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [autoStarted, setAutoStarted] = useState(false);

  const imagesReady =
    !platformImages.facebook.loading &&
    !platformImages.instagram.loading &&
    !platformImages.linkedin.loading;

  // Auto-start rendering once the campaign + images are ready
  useEffect(() => {
    if (autoStarted) return;
    if (status !== "idle") return;
    if (!campaign?.business_name) return;
    if (!imagesReady) return;
    setAutoStarted(true);
    startRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesReady, campaign, autoStarted, status]);

  async function startRender() {
    setStatus("starting");
    setError("");
    setVideoUrl(null);
    setElapsed(0);

    // Best variation across platforms by overall score
    const allAds = [
      ...(campaign.facebook || []),
      ...(campaign.instagram || []),
      ...(campaign.linkedin || []),
    ];
    const bestAd =
      allAds
        .filter((a) => a && a.headline)
        .sort((a, b) => (b.scores?.overall ?? 0) - (a.scores?.overall ?? 0))[0] ||
      campaign.facebook?.[0];

    if (!bestAd) {
      setError("לא נמצאה וריאציה מתאימה");
      setStatus("error");
      return;
    }

    const imgs = [
      platformImages.instagram?.url,
      platformImages.facebook?.url,
      platformImages.linkedin?.url,
    ].filter((x): x is string => !!x);

    try {
      const res = await fetch("/api/campaigns/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: campaign.business_name,
          headline: bestAd.headline,
          body: bestAd.body,
          cta: bestAd.cta,
          images: imgs,
          plan,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "יצירת הסרטון נכשלה");
        setStatus("error");
        return;
      }

      const data = await res.json();

      if (data.status === "succeeded" && data.url) {
        setVideoUrl(data.url);
        setStatus("ready");
        return;
      }

      if (data.status === "failed") {
        setError("הרינדור נכשל בשרת. נסו שוב.");
        setStatus("error");
        return;
      }

      if (!data.id) {
        setError("לא התקבלה תגובה תקינה מהשרת");
        setStatus("error");
        return;
      }

      setStatus("rendering");
      await pollRender(data.id);
    } catch {
      setError("החיבור נפל. נסו שוב.");
      setStatus("error");
    }
  }

  async function pollRender(id: string) {
    const start = Date.now();
    const timeoutMs = 4 * 60 * 1000; // 4 minutes
    while (Date.now() - start < timeoutMs) {
      setElapsed(Math.floor((Date.now() - start) / 1000));
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const res = await fetch(`/api/campaigns/video?id=${id}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status === "succeeded" && data.url) {
          setVideoUrl(data.url);
          setStatus("ready");
          return;
        }
        if (data.status === "failed") {
          setError("הרינדור נכשל. נסו שוב.");
          setStatus("error");
          return;
        }
      } catch {
        // try again
      }
    }
    setError("הרינדור לוקח יותר מדי זמן. נסו שוב.");
    setStatus("error");
  }

  async function handleDownload() {
    if (!videoUrl) return;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `kastly-video-${campaign.business_name || "campaign"}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 3000);
    } catch {
      // Fallback: open in new tab
      window.open(videoUrl, "_blank");
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-foreground">סרטון פרסומת</span>
        <span className="text-xs text-muted">— 30 שניות, 1080x1920 MP4</span>
      </div>

      <div className="p-5">
        <div className="grid md:grid-cols-[280px,1fr] gap-5">
          {/* Video preview */}
          <div className="aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-br from-primary via-accent to-primary relative">
            {status === "ready" && videoUrl ? (
              <video
                src={videoUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            ) : status === "rendering" || status === "starting" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white p-4 text-center">
                <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">
                  {status === "starting" ? "מתחילים..." : "מרנדרים סרטון..."}
                </p>
                {elapsed > 0 && (
                  <p className="text-xs opacity-80">{elapsed} שניות</p>
                )}
                <p className="text-[10px] opacity-70">
                  בדרך כלל 30-90 שניות
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                <svg className="w-12 h-12 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <p className="text-sm font-medium">סרטון 30 שניות</p>
                <p className="text-[11px] opacity-80">כותרת + תמונות + CTA מונפש</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                הפכו את הקמפיין לסרטון
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Kastly מייצרת אוטומטית סרטון 30 שניות מהקמפיין — כותרת, תיאור
                ו-CTA עם אנימציות — מוכן להעלאה לרילס, סטוריז, טיקטוק או יוטיוב
                שורטס.
              </p>
            </div>

            <ul className="space-y-1.5 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">•</span>
                כותרת וגוף מונפשים מתוך המודעה הטובה ביותר
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">•</span>
                תמונות ה-AI מהקמפיין, עם אפקט kens-burns
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">•</span>
                CTA גדול בסיום בגוון מבדיל
              </li>
              {isFreePlan && (
                <li className="flex items-start gap-2 text-muted">
                  <span className="mt-1">•</span>
                  סימן מים של Kastly (הסר בחבילות בתשלום)
                </li>
              )}
            </ul>

            <div className="flex flex-wrap gap-2 pt-2">
              {status !== "ready" && (
                <button
                  onClick={startRender}
                  disabled={
                    status === "starting" || status === "rendering" || !imagesReady
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "starting" || status === "rendering" ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {status === "starting" ? "מתחיל..." : "מרנדר..."}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {status === "error" ? "נסו שוב" : "צור סרטון"}
                    </>
                  )}
                </button>
              )}

              {status === "ready" && videoUrl && (
                <>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                    </svg>
                    הורד סרטון
                  </button>
                  <button
                    onClick={startRender}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-background hover:bg-surface-hover text-foreground transition-colors"
                  >
                    צור גרסה חדשה
                  </button>
                </>
              )}
            </div>

            {!imagesReady && status === "idle" && (
              <p className="text-xs text-muted/70">
                מחכים שהתמונות יסיימו להיטען...
              </p>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WatermarkOverlay() {
  // Visual preview watermark overlay — mirrors the baked-in download watermark
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          transform: "rotate(-18deg)",
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0) 0 60px, rgba(255,255,255,0) 60px)",
        }}
      >
        <div className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 grid grid-cols-4 gap-y-10 gap-x-16 items-center">
          {Array.from({ length: 32 }).map((_, i) => (
            <span
              key={i}
              className="text-white/40 font-bold text-xl mix-blend-overlay tracking-widest select-none"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
            >
              Kastly
            </span>
          ))}
        </div>
      </div>
      <div className="absolute bottom-2 right-2 bg-primary/80 text-white text-[10px] font-bold px-2 py-1 rounded-md">
        נוצר ב-Kastly
      </div>
    </div>
  );
}
