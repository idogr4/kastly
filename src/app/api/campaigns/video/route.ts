import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

// --- Shotstack config ----------------------------------------------------
const SHOTSTACK_ENV = (process.env.SHOTSTACK_ENV || "stage").toLowerCase();
const SHOTSTACK_BASE = `https://api.shotstack.io/edit/${SHOTSTACK_ENV}`;

// --- ElevenLabs config ---------------------------------------------------
const ELEVEN_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel (multilingual)
const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

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

// --- ElevenLabs → Supabase upload ---------------------------------------
async function generateNarrationUrl(script: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey || !supabaseUrl || !serviceKey) return null;
  if (!script.trim()) return null;

  try {
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: script,
          model_id: ELEVEN_MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
        }),
      }
    );

    if (!ttsRes.ok) {
      console.error("ElevenLabs TTS failed:", ttsRes.status, await ttsRes.text().catch(() => ""));
      return null;
    }

    const audioBytes = new Uint8Array(await ttsRes.arrayBuffer());
    if (audioBytes.byteLength < 1000) return null;

    const supabase = createClient(supabaseUrl, serviceKey);
    const key = `narration/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.mp3`;
    const { error } = await supabase.storage
      .from("campaign-audio")
      .upload(key, audioBytes, { contentType: "audio/mpeg", upsert: false });

    if (error) {
      console.error("Supabase storage upload failed:", error);
      return null;
    }

    const { data } = supabase.storage.from("campaign-audio").getPublicUrl(key);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.error("Narration generation error:", err);
    return null;
  }
}

// --- Shotstack timeline builder ------------------------------------------
// 4 scenes: 8s + 12s + 10s + 6s = 36s (we use 8/12/10/6 per brief = 36s).
// User requested 30s total; we compress to 6/10/8/6 = 30s exact.
// NOTE: brief said 8/12/10/6 totals 36s — keeping 30s target: 6/10/8/6 = 30s.
// To honor brief's staged emphasis we use 7/11/8/4 = 30s.
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
  narrationUrl: string | null;
}) {
  const { businessName, headline, body, cta, features, images, watermark, brand, narrationUrl } = args;
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

  // ---- Scene 1: Opener — business name + headline, primary bg ----
  bgTrack.push(solidBg(colors.primary, cursor, SCENE_DURATIONS.opener));
  if (images[0]) {
    imageTrack.push(
      imageClip({
        src: images[0],
        start: cursor,
        length: SCENE_DURATIONS.opener,
        effect: "zoomIn",
        opacity: 0.35,
      })
    );
  }
  textTrack.push(
    textCard({
      html: `<div class="brand">${escapeHtml(businessName)}</div>`,
      css: `.brand{width:960px;color:${colors.accent};font:800 96px/1.1 ${HEBREW_FONT_STACK};text-align:center;direction:rtl;text-shadow:0 6px 24px rgba(0,0,0,0.45);}`,
      start: cursor + 0.3,
      length: SCENE_DURATIONS.opener - 0.4,
      offsetY: 0.22,
      transitionIn: "fade",
      transitionOut: "fade",
    })
  );
  textTrack.push(
    textCard({
      html: `<div class="hl">${escapeHtml(shortHeadline)}</div>`,
      css: `.hl{width:960px;color:${colors.text};font:600 58px/1.3 ${HEBREW_FONT_STACK};text-align:center;direction:rtl;text-shadow:0 4px 18px rgba(0,0,0,0.5);}`,
      start: cursor + 1.0,
      length: SCENE_DURATIONS.opener - 1.1,
      offsetY: -0.1,
      width: 960,
      height: 500,
      transitionIn: "fade",
      transitionOut: "fade",
    })
  );

  cursor += SCENE_DURATIONS.opener;

  // ---- Scene 2: Hero image with zoom + animated description ----
  bgTrack.push(solidBg(colors.secondary, cursor, SCENE_DURATIONS.hero));
  const heroImg = images[1] || images[0];
  if (heroImg) {
    imageTrack.push(
      imageClip({
        src: heroImg,
        start: cursor,
        length: SCENE_DURATIONS.hero,
        effect: "zoomOut",
        opacity: 0.9,
      })
    );
  }
  textTrack.push(
    textCard({
      html: `<div class="desc"><div class="pill">${escapeHtml(shortBody)}</div></div>`,
      css: `.desc{width:960px;direction:rtl;text-align:center;}.pill{display:inline-block;padding:28px 40px;border-radius:28px;background:rgba(0,0,0,0.55);color:#ffffff;font:600 52px/1.35 ${HEBREW_FONT_STACK};backdrop-filter:blur(6px);}`,
      start: cursor + 0.6,
      length: SCENE_DURATIONS.hero - 0.8,
      offsetY: -0.32,
      width: 980,
      height: 540,
      transitionIn: "slideUp",
      transitionOut: "fade",
    })
  );

  cursor += SCENE_DURATIONS.hero;

  // ---- Scene 3: 3 benefits, staggered fade-in ----
  bgTrack.push(solidBg(colors.primary, cursor, SCENE_DURATIONS.benefits));
  textTrack.push(
    textCard({
      html: `<div class="hdr">${escapeHtml("למה אנחנו?")}</div>`,
      css: `.hdr{width:960px;color:${colors.accent};font:700 60px/1.2 ${HEBREW_FONT_STACK};text-align:center;direction:rtl;}`,
      start: cursor + 0.3,
      length: SCENE_DURATIONS.benefits - 0.4,
      offsetY: 0.34,
      transitionIn: "fade",
      transitionOut: "fade",
    })
  );
  benefits.forEach((b, i) => {
    const slot = 1.2 + i * 1.8;
    textTrack.push(
      textCard({
        html: `<div class="bn"><span class="dot">✦</span>${escapeHtml(b)}</div>`,
        css: `.bn{width:920px;direction:rtl;color:${colors.text};font:600 52px/1.35 ${HEBREW_FONT_STACK};text-align:center;}.dot{color:${colors.accent};margin-left:18px;}`,
        start: cursor + slot,
        length: SCENE_DURATIONS.benefits - slot - 0.2,
        offsetY: 0.08 - i * 0.18,
        width: 960,
        height: 240,
        transitionIn: "slideRight",
        transitionOut: "fade",
      })
    );
  });

  cursor += SCENE_DURATIONS.benefits;

  // ---- Scene 4: CTA finale on accent bg, pulse zoom ----
  bgTrack.push(solidBg(colors.accent, cursor, SCENE_DURATIONS.cta));
  if (images[2] || images[0]) {
    imageTrack.push(
      imageClip({
        src: (images[2] || images[0])!,
        start: cursor,
        length: SCENE_DURATIONS.cta,
        effect: "zoomIn",
        opacity: 0.22,
      })
    );
  }
  textTrack.push(
    textCard({
      html: `<div class="cta">${escapeHtml(shortCta)}</div>`,
      css: `.cta{width:960px;color:${colors.primary};font:800 118px/1.15 ${HEBREW_FONT_STACK};text-align:center;direction:rtl;text-shadow:0 6px 22px rgba(0,0,0,0.18);}`,
      start: cursor + 0.2,
      length: SCENE_DURATIONS.cta - 0.3,
      offsetY: 0.05,
      width: 1020,
      height: 520,
      transitionIn: "zoom",
      transitionOut: "fade",
      effect: "zoomIn",
    })
  );
  textTrack.push(
    textCard({
      html: `<div class="bn2">${escapeHtml(businessName)}</div>`,
      css: `.bn2{width:920px;color:${colors.primary};font:600 54px/1.2 ${HEBREW_FONT_STACK};text-align:center;direction:rtl;}`,
      start: cursor + 0.8,
      length: SCENE_DURATIONS.cta - 0.9,
      offsetY: -0.2,
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

  // ---- Soundtrack + narration tracks ----
  const musicUrl = pickMusicUrl(brand?.music_mood, brand?.category);

  const tracks: ShotstackTrack[] = [
    { clips: textTrack },
    { clips: imageTrack },
    { clips: bgTrack },
  ];

  if (narrationUrl) {
    tracks.push({
      clips: [
        {
          asset: { type: "audio", src: narrationUrl, volume: 1 },
          start: 0.4,
          length: TOTAL_DURATION - 0.4,
        },
      ],
    });
  }

  const timeline: Record<string, unknown> = {
    background: "#000000",
    tracks,
  };

  if (musicUrl) {
    timeline.soundtrack = {
      src: musicUrl,
      effect: "fadeInFadeOut",
      volume: narrationUrl ? 0.18 : 0.5,
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
    const shortHeadline = truncate(headline, 70);
    const shortBody = truncate(adBody || "", 140);
    const shortCta = truncate(cta, 42);
    const benefits = (features.length ? features : [shortBody])
      .slice(0, 3)
      .map((f) => truncate(f, 50));

    const narrationScript = [
      business_name,
      shortHeadline,
      shortBody,
      benefits.length ? `היתרונות שלנו: ${benefits.join(", ")}.` : "",
      shortCta,
    ]
      .filter(Boolean)
      .join(". ");

    const narrationUrl = await generateNarrationUrl(narrationScript);

    const payload = buildRender({
      businessName: business_name,
      headline,
      body: adBody || "",
      cta,
      features,
      images: cleanImages,
      watermark: isFreePlan,
      brand: brand_profile,
      narrationUrl,
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
