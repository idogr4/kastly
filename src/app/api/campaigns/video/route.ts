import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

// --- Shotstack config ----------------------------------------------------
const SHOTSTACK_ENV = (process.env.SHOTSTACK_ENV || "stage").toLowerCase();
const SHOTSTACK_BASE = `https://api.shotstack.io/edit/${SHOTSTACK_ENV}`;

// --- Types ---------------------------------------------------------------
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
  music_mood?: string;
  font_style?: string;
  core_message?: string;
}

interface VideoRequestBody {
  business_name: string;
  headline: string;
  body: string;
  cta: string;
  features?: string[];
  images?: (string | null)[];
  plan?: string;
  brand_profile?: BrandProfile;
}

// --- Palette fallbacks per category --------------------------------------
const CATEGORY_COLOR_FALLBACK: Record<string, { primary: string; secondary: string; accent: string; text: string }> = {
  food: { primary: "#8b2f1d", secondary: "#f4a261", accent: "#ffd166", text: "#fff8ee" },
  tech: { primary: "#0a0f2c", secondary: "#2e5bff", accent: "#00e5ff", text: "#ffffff" },
  beauty: { primary: "#f7b2c1", secondary: "#c7b6f5", accent: "#ffd6e0", text: "#3d2b40" },
  fitness: { primary: "#0b0b0d", secondary: "#ff3d3d", accent: "#d6ff2a", text: "#ffffff" },
  luxury: { primary: "#0c0c0c", secondary: "#b08d57", accent: "#e8c77d", text: "#f5ecd7" },
  home: { primary: "#6b4f3b", secondary: "#d8c3a5", accent: "#e98a58", text: "#fffbf3" },
  professional: { primary: "#0d2b4e", secondary: "#2866b2", accent: "#4fc3f7", text: "#ffffff" },
  playful: { primary: "#ff6b6b", secondary: "#ffd93d", accent: "#6bcbff", text: "#1a1a2e" },
  other: { primary: "#6c5ce7", secondary: "#fd79a8", accent: "#ffd43b", text: "#ffffff" },
};

function resolveColors(brand?: BrandProfile) {
  const category = (brand?.category || "other").toLowerCase();
  const fallback = CATEGORY_COLOR_FALLBACK[category] || CATEGORY_COLOR_FALLBACK.other;
  return {
    primary: brand?.colors?.primary || fallback.primary,
    secondary: brand?.colors?.secondary || fallback.secondary,
    accent: brand?.colors?.accent || fallback.accent,
    text: brand?.colors?.text || fallback.text,
  };
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + "…" : clean;
}

function pickMusicUrl(mood?: string, category?: string): string | undefined {
  const byMood = mood
    ? process.env[`SHOTSTACK_MUSIC_${mood.toUpperCase().replace(/-/g, "_")}`]
    : undefined;
  const byCategory = category
    ? process.env[`SHOTSTACK_MUSIC_${category.toUpperCase()}`]
    : undefined;
  return byMood || byCategory || process.env.SHOTSTACK_MUSIC_URL;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- Shotstack timeline builder ------------------------------------------
// 4 scenes: 7s + 11s + 8s + 4s = 30s total.
const SCENE_DURATIONS = { opener: 7, hero: 11, benefits: 8, cta: 4 } as const;
const TOTAL_DURATION =
  SCENE_DURATIONS.opener +
  SCENE_DURATIONS.hero +
  SCENE_DURATIONS.benefits +
  SCENE_DURATIONS.cta;

type ShotstackClip = Record<string, unknown>;
type ShotstackTrack = { clips: ShotstackClip[] };

function textCard(opts: {
  html: string;
  css: string;
  start: number;
  length: number;
  transitionIn?: string;
  transitionOut?: string;
  effect?: string;
  width?: number;
  height?: number;
  position?: string;
  offsetY?: number;
}): ShotstackClip {
  return {
    asset: {
      type: "html",
      html: opts.html,
      css: opts.css,
      width: opts.width ?? 960,
      height: opts.height ?? 400,
      background: "transparent",
    },
    start: opts.start,
    length: opts.length,
    position: opts.position ?? "center",
    offset: opts.offsetY !== undefined ? { y: opts.offsetY } : undefined,
    transition: {
      in: opts.transitionIn ?? "fade",
      out: opts.transitionOut ?? "fade",
    },
    effect: opts.effect,
    fit: "none",
  };
}

function imageClip(opts: {
  src: string;
  start: number;
  length: number;
  effect?: "zoomIn" | "zoomOut" | "slideLeft" | "slideRight";
  opacity?: number;
}): ShotstackClip {
  return {
    asset: { type: "image", src: opts.src },
    start: opts.start,
    length: opts.length,
    fit: "cover",
    scale: 1,
    opacity: opts.opacity ?? 1,
    effect: opts.effect ?? "zoomIn",
    transition: { in: "fade", out: "fade" },
  };
}

function solidBg(color: string, start: number, length: number): ShotstackClip {
  return {
    asset: {
      type: "html",
      html: `<div class="bg"></div>`,
      css: `.bg{width:1080px;height:1920px;background:${color};}`,
      width: 1080,
      height: 1920,
      background: color,
    },
    start,
    length,
    fit: "cover",
  };
}

const HEBREW_FONT_STACK =
  "'Rubik','Heebo','Assistant','Noto Sans Hebrew',Arial,sans-serif";

function buildRender(args: {
  businessName: string;
  headline: string;
  body: string;
  cta: string;
  features: string[];
  images: string[];
  watermark: boolean;
  brand?: BrandProfile;
}) {
  const { businessName, headline, body, cta, features, images, watermark, brand } = args;
  const colors = resolveColors(brand);

  const shortHeadline = truncate(headline, 70);
  const shortBody = truncate(body, 140);
  const shortCta = truncate(cta, 42);
  const benefits = (features && features.length ? features : [shortBody])
    .slice(0, 3)
    .map((f) => truncate(f, 50));

  const bgTrack: ShotstackClip[] = [];
  const imageTrack: ShotstackClip[] = [];
  const textTrack: ShotstackClip[] = [];

  let cursor = 0;

  // ---- Scene 1: Opener — HUGE business name + headline ----
  bgTrack.push(solidBg(colors.primary, cursor, SCENE_DURATIONS.opener));
  if (images[0]) {
    imageTrack.push(
      imageClip({
        src: images[0],
        start: cursor,
        length: SCENE_DURATIONS.opener,
        effect: "zoomIn",
        opacity: 0.32,
      })
    );
  }
  textTrack.push(
    textCard({
      html: `<div class="brand">${escapeHtml(businessName)}</div>`,
      css: `.brand{width:1000px;color:${colors.accent};font:900 140px/1.05 ${HEBREW_FONT_STACK};letter-spacing:-2px;text-align:center;direction:rtl;text-shadow:0 8px 30px rgba(0,0,0,0.55);}`,
      start: cursor + 0.2,
      length: SCENE_DURATIONS.opener - 0.3,
      offsetY: 0.22,
      width: 1020,
      height: 340,
      transitionIn: "fade",
      transitionOut: "fade",
    })
  );
  textTrack.push(
    textCard({
      html: `<div class="hl">${escapeHtml(shortHeadline)}</div>`,
      css: `.hl{width:980px;color:${colors.text};font:700 72px/1.25 ${HEBREW_FONT_STACK};text-align:center;direction:rtl;text-shadow:0 4px 22px rgba(0,0,0,0.55);}`,
      start: cursor + 1.2,
      length: SCENE_DURATIONS.opener - 1.3,
      offsetY: -0.12,
      width: 1000,
      height: 520,
      transitionIn: "fade",
      transitionOut: "fade",
    })
  );

  cursor += SCENE_DURATIONS.opener;

  // ---- Scene 2: Hero image + big animated description pill ----
  bgTrack.push(solidBg(colors.secondary, cursor, SCENE_DURATIONS.hero));
  const heroImg = images[1] || images[0];
  if (heroImg) {
    imageTrack.push(
      imageClip({
        src: heroImg,
        start: cursor,
        length: SCENE_DURATIONS.hero,
        effect: "zoomOut",
        opacity: 0.92,
      })
    );
  }
  textTrack.push(
    textCard({
      html: `<div class="desc"><div class="pill">${escapeHtml(shortBody)}</div></div>`,
      css: `.desc{width:1000px;direction:rtl;text-align:center;}.pill{display:inline-block;padding:34px 46px;border-radius:36px;background:rgba(0,0,0,0.62);color:#ffffff;font:700 62px/1.3 ${HEBREW_FONT_STACK};backdrop-filter:blur(6px);box-shadow:0 12px 40px rgba(0,0,0,0.35);}`,
      start: cursor + 0.6,
      length: SCENE_DURATIONS.hero - 0.8,
      offsetY: -0.3,
      width: 1020,
      height: 620,
      transitionIn: "slideUp",
      transitionOut: "fade",
    })
  );

  cursor += SCENE_DURATIONS.hero;

  // ---- Scene 3: 3 huge benefits with staggered fade-in ----
  bgTrack.push(solidBg(colors.primary, cursor, SCENE_DURATIONS.benefits));
  textTrack.push(
    textCard({
      html: `<div class="hdr">${escapeHtml("למה אנחנו?")}</div>`,
      css: `.hdr{width:960px;color:${colors.accent};font:800 78px/1.15 ${HEBREW_FONT_STACK};text-align:center;direction:rtl;letter-spacing:-1px;}`,
      start: cursor + 0.3,
      length: SCENE_DURATIONS.benefits - 0.4,
      offsetY: 0.36,
      transitionIn: "fade",
      transitionOut: "fade",
    })
  );
  benefits.forEach((b, i) => {
    const slot = 1.0 + i * 1.8;
    textTrack.push(
      textCard({
        html: `<div class="bn"><span class="dot">✦</span>${escapeHtml(b)}</div>`,
        css: `.bn{width:960px;direction:rtl;color:${colors.text};font:700 62px/1.3 ${HEBREW_FONT_STACK};text-align:center;}.dot{color:${colors.accent};margin-left:22px;}`,
        start: cursor + slot,
        length: SCENE_DURATIONS.benefits - slot - 0.2,
        offsetY: 0.08 - i * 0.2,
        width: 1000,
        height: 260,
        transitionIn: "slideRight",
        transitionOut: "fade",
      })
    );
  });

  cursor += SCENE_DURATIONS.benefits;

  // ---- Scene 4: Massive CTA finale with pulse zoom ----
  bgTrack.push(solidBg(colors.accent, cursor, SCENE_DURATIONS.cta));
  if (images[2] || images[0]) {
    imageTrack.push(
      imageClip({
        src: (images[2] || images[0])!,
        start: cursor,
        length: SCENE_DURATIONS.cta,
        effect: "zoomIn",
        opacity: 0.2,
      })
    );
  }
  textTrack.push(
    textCard({
      html: `<div class="cta">${escapeHtml(shortCta)}</div>`,
      css: `.cta{width:1000px;color:${colors.primary};font:900 150px/1.1 ${HEBREW_FONT_STACK};letter-spacing:-2px;text-align:center;direction:rtl;text-shadow:0 8px 28px rgba(0,0,0,0.2);}`,
      start: cursor + 0.15,
      length: SCENE_DURATIONS.cta - 0.25,
      offsetY: 0.05,
      width: 1040,
      height: 560,
      transitionIn: "zoom",
      transitionOut: "fade",
      effect: "zoomIn",
    })
  );
  textTrack.push(
    textCard({
      html: `<div class="bn2">${escapeHtml(businessName)}</div>`,
      css: `.bn2{width:920px;color:${colors.primary};font:700 62px/1.2 ${HEBREW_FONT_STACK};text-align:center;direction:rtl;}`,
      start: cursor + 0.7,
      length: SCENE_DURATIONS.cta - 0.8,
      offsetY: -0.22,
      transitionIn: "fade",
      transitionOut: "fade",
    })
  );

  // ---- Watermark (free plan) ----
  if (watermark) {
    textTrack.push(
      textCard({
        html: `<div class="wm">נוצר ב-Kastly</div>`,
        css: `.wm{width:320px;color:#ffffff;font:700 28px/1 ${HEBREW_FONT_STACK};background:rgba(0,0,0,0.55);padding:8px 16px;border-radius:10px;text-align:center;direction:rtl;}`,
        start: 0,
        length: TOTAL_DURATION,
        position: "bottomRight",
        width: 320,
        height: 60,
        transitionIn: "fade",
        transitionOut: "fade",
      })
    );
  }

  const musicUrl = pickMusicUrl(brand?.music_mood, brand?.category);

  const tracks: ShotstackTrack[] = [
    { clips: textTrack },
    { clips: imageTrack },
    { clips: bgTrack },
  ];

  const timeline: Record<string, unknown> = {
    background: "#000000",
    tracks,
  };

  if (musicUrl) {
    timeline.soundtrack = {
      src: musicUrl,
      effect: "fadeInFadeOut",
      volume: 0.55,
    };
  }

  return {
    timeline,
    output: {
      format: "mp4",
      size: { width: 1080, height: 1920 },
      fps: 30,
    },
  };
}

// --- Route handlers ------------------------------------------------------
export async function POST(request: NextRequest) {
  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "שירות יצירת הסרטונים לא מוגדר. חסר SHOTSTACK_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as VideoRequestBody;
    const {
      business_name,
      headline,
      body: adBody,
      cta,
      features = [],
      images = [],
      plan = "free",
      brand_profile,
    } = body;

    if (!business_name || !headline || !cta) {
      return NextResponse.json(
        { error: "חסרים פרטי קמפיין ליצירת סרטון" },
        { status: 400 }
      );
    }

    const isFreePlan = plan === "free" || !plan;

    const cleanImages = images.filter((x): x is string => typeof x === "string" && !!x);

    const payload = buildRender({
      businessName: business_name,
      headline,
      body: adBody || "",
      cta,
      features,
      images: cleanImages,
      watermark: isFreePlan,
      brand: brand_profile,
    });

    const res = await fetch(`${SHOTSTACK_BASE}/render`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      console.error("Shotstack render error:", res.status, data);
      return NextResponse.json(
        {
          error: "יצירת הסרטון נכשלה. נסו שוב בעוד רגע.",
          detail:
            typeof data === "object" && data !== null
              ? JSON.stringify(data).slice(0, 400)
              : undefined,
        },
        { status: 502 }
      );
    }

    const renderId: string | undefined = data?.response?.id;
    if (!renderId) {
      return NextResponse.json(
        { error: "לא התקבל מזהה רינדור מהשרת" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: renderId,
      status: "rendering",
      url: null,
    });
  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: "משהו השתבש. נסו שוב." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const res = await fetch(`${SHOTSTACK_BASE}/render/${encodeURIComponent(id)}`, {
      headers: { "x-api-key": apiKey },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return NextResponse.json({ error: "status failed" }, { status: 502 });
    }

    const rawStatus: string = data?.response?.status ?? "unknown";
    const url: string | null = data?.response?.url ?? null;

    let status: "rendering" | "succeeded" | "failed";
    if (rawStatus === "done" || url) {
      status = "succeeded";
    } else if (rawStatus === "failed") {
      status = "failed";
    } else {
      status = "rendering";
    }

    return NextResponse.json({ id, status, url, raw_status: rawStatus });
  } catch {
    return NextResponse.json({ error: "status failed" }, { status: 500 });
  }
}
