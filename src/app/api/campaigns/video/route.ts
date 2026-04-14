import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const J2V_ENDPOINT = "https://api.json2video.com/v2/movies";
const DEFAULT_HEBREW_VOICE = "he-IL-HilaNeural";

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

function truncate(s: string, n: number): string {
  if (!s) return "";
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + "…" : clean;
}

// Category-appropriate music — set CREATOMATE_/JSON2VIDEO_MUSIC_* envs or rely on defaults
function pickMusicUrl(mood: string | undefined, category: string | undefined): string | undefined {
  const byMood = mood ? process.env[`JSON2VIDEO_MUSIC_${mood.toUpperCase().replace(/-/g, "_")}`] : undefined;
  const byCategory = category ? process.env[`JSON2VIDEO_MUSIC_${category.toUpperCase()}`] : undefined;
  return byMood || byCategory || process.env.JSON2VIDEO_MUSIC_URL;
}

type J2VElement = Record<string, unknown>;
type J2VScene = {
  duration: number;
  "background-color"?: string;
  elements: J2VElement[];
};

const CATEGORY_COLOR_FALLBACK: Record<string, { primary: string; secondary: string; accent: string; text: string }> = {
  food: { primary: "#8b2f1d", secondary: "#f4a261", accent: "#ffd166", text: "#fff8ee" },
  tech: { primary: "#0a0f2c", secondary: "#2e5bff", accent: "#00e5ff", text: "#ffffff" },
  beauty: { primary: "#ffd6e0", secondary: "#f7b2c1", accent: "#c7b6f5", text: "#3d2b40" },
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

function buildMovie(args: {
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
  const voice = process.env.JSON2VIDEO_VOICE || DEFAULT_HEBREW_VOICE;
  const colors = resolveColors(brand);

  const shortHeadline = truncate(headline, 80);
  const shortBody = truncate(body, 140);
  const shortCta = truncate(cta, 48);
  const benefits = (features && features.length ? features : [shortBody]).slice(0, 3).map((f) => truncate(f, 60));

  // --- Scene 1: Opening (6s) — business name + Hebrew narration ---
  const scene1: J2VScene = {
    duration: 6,
    "background-color": colors.primary,
    elements: [
      ...(images[0]
        ? [
            {
              type: "image",
              src: images[0],
              duration: 6,
              start: 0,
              "zoom-effect": "zoomIn",
              opacity: 0.35,
              position: "center-center",
              width: 1080,
              height: 1920,
            } as J2VElement,
          ]
        : []),
      {
        type: "text",
        text: businessName,
        start: 0.4,
        duration: 5.4,
        position: "center-center",
        y: -150,
        settings: {
          "font-family": "Heebo",
          "font-size": "84px",
          "font-weight": "800",
          color: colors.accent,
          "text-align": "center",
          "text-shadow": "0 4px 20px rgba(0,0,0,0.5)",
        },
        "fade-in": 0.5,
      },
      {
        type: "text",
        text: shortHeadline,
        start: 1.2,
        duration: 4.6,
        position: "center-center",
        y: 100,
        settings: {
          "font-family": "Heebo",
          "font-size": "62px",
          "font-weight": "600",
          color: colors.text,
          "text-align": "center",
          "line-height": "1.3",
          "text-shadow": "0 3px 14px rgba(0,0,0,0.4)",
        },
        width: 960,
        "fade-in": 0.6,
      },
    ],
  };

  // --- Scene 2: Screenshot / hero image + description (10s) ---
  const scene2: J2VScene = {
    duration: 10,
    "background-color": colors.secondary,
    elements: [
      ...((images[1] || images[0])
        ? [
            {
              type: "image",
              src: images[1] || images[0],
              duration: 10,
              start: 0,
              "zoom-effect": "zoomOut",
              opacity: 0.85,
              position: "center-center",
              width: 1080,
              height: 1920,
            } as J2VElement,
          ]
        : []),
      {
        type: "text",
        text: shortBody,
        start: 0.5,
        duration: 9.2,
        position: "center-center",
        y: 650,
        settings: {
          "font-family": "Heebo",
          "font-size": "54px",
          "font-weight": "600",
          color: "#ffffff",
          "background-color": "rgba(0,0,0,0.55)",
          padding: "24px 36px",
          "border-radius": "24px",
          "text-align": "center",
          "line-height": "1.35",
        },
        width: 960,
        "fade-in": 0.6,
      },
    ],
  };

  // --- Scene 3: 3 benefits with staggered animation (8s) ---
  const scene3: J2VScene = {
    duration: 8,
    "background-color": colors.primary,
    elements: [
      {
        type: "text",
        text: "למה אנחנו?",
        start: 0.2,
        duration: 7.6,
        position: "center-center",
        y: -580,
        settings: {
          "font-family": "Heebo",
          "font-size": "56px",
          "font-weight": "700",
          color: colors.accent,
          "text-align": "center",
        },
        "fade-in": 0.4,
      },
      ...benefits.map((benefit, i) => ({
        type: "text",
        text: `✦  ${benefit}`,
        start: 0.8 + i * 1.6,
        duration: 7.2 - i * 1.6,
        position: "center-center",
        y: -180 + i * 220,
        settings: {
          "font-family": "Heebo",
          "font-size": "50px",
          "font-weight": "600",
          color: colors.text,
          "text-align": "center",
          "line-height": "1.3",
        },
        width: 920,
        "fade-in": 0.5,
      })),
    ],
  };

  // --- Scene 4: CTA finale with pulse (6s) ---
  const scene4: J2VScene = {
    duration: 6,
    "background-color": colors.accent,
    elements: [
      ...((images[2] || images[0])
        ? [
            {
              type: "image",
              src: images[2] || images[0],
              duration: 6,
              start: 0,
              "zoom-effect": "zoomIn",
              opacity: 0.25,
              position: "center-center",
              width: 1080,
              height: 1920,
            } as J2VElement,
          ]
        : []),
      {
        type: "text",
        text: shortCta,
        start: 0.2,
        duration: 5.6,
        position: "center-center",
        y: -80,
        settings: {
          "font-family": "Heebo",
          "font-size": "118px",
          "font-weight": "800",
          color: colors.primary,
          "text-align": "center",
          "text-shadow": "0 4px 18px rgba(0,0,0,0.25)",
        },
        width: 960,
        // Pulse via scale animation
        "pan-effect": "pulse",
        "fade-in": 0.4,
      },
      {
        type: "text",
        text: businessName,
        start: 1.2,
        duration: 4.6,
        position: "center-center",
        y: 260,
        settings: {
          "font-family": "Heebo",
          "font-size": "54px",
          "font-weight": "600",
          color: colors.primary,
          "text-align": "center",
        },
        "fade-in": 0.6,
      },
    ],
  };

  // --- Global Hebrew narration spanning all scenes ---
  const narrationScript = [
    businessName,
    shortHeadline,
    shortBody,
    benefits.length ? `היתרונות שלנו: ${benefits.join(", ")}.` : "",
    shortCta,
  ]
    .filter(Boolean)
    .join(". ");

  const globalElements: J2VElement[] = [
    {
      type: "voice",
      text: narrationScript,
      voice,
      start: 0.4,
      duration: -1,
    },
  ];

  const musicUrl = pickMusicUrl(brand?.music_mood, brand?.category);
  if (musicUrl) {
    globalElements.push({
      type: "audio",
      src: musicUrl,
      start: 0,
      duration: 30,
      volume: 28,
      "fade-in": 0.8,
      "fade-out": 1.5,
    });
  }

  if (watermark) {
    globalElements.push({
      type: "text",
      text: "נוצר ב-Kastly",
      start: 0,
      duration: 30,
      position: "bottom-right",
      settings: {
        "font-family": "Heebo",
        "font-size": "32px",
        "font-weight": "700",
        color: "#ffffff",
        "background-color": "rgba(0,0,0,0.6)",
        padding: "6px 14px",
        "border-radius": "10px",
      },
    });
    globalElements.push({
      type: "text",
      text: "Kastly  ·  Kastly  ·  Kastly",
      start: 0,
      duration: 30,
      position: "center-center",
      settings: {
        "font-family": "Heebo",
        "font-size": "120px",
        "font-weight": "800",
        color: "rgba(255,255,255,0.08)",
        "text-align": "center",
        transform: "rotate(-22deg)",
      },
    });
  }

  return {
    resolution: "custom",
    width: 1080,
    height: 1920,
    quality: "high",
    scenes: [scene1, scene2, scene3, scene4],
    elements: globalElements,
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.JSON2VIDEO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "שירות יצירת הסרטונים לא מוגדר. חסר JSON2VIDEO_API_KEY." },
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

    const movie = buildMovie({
      businessName: business_name,
      headline,
      body: adBody || "",
      cta,
      features,
      images: images.filter((x): x is string => typeof x === "string" && !!x),
      watermark: isFreePlan,
      brand: brand_profile,
    });

    const res = await fetch(J2V_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(movie),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      console.error("JSON2Video error:", res.status, data);
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

    const projectId: string | undefined = data.project || data.id;
    if (!projectId) {
      return NextResponse.json(
        { error: "לא התקבל מזהה פרויקט מהשרת" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: projectId,
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
  const apiKey = process.env.JSON2VIDEO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${J2V_ENDPOINT}?project=${encodeURIComponent(id)}`,
      {
        headers: { "x-api-key": apiKey },
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return NextResponse.json({ error: "status failed" }, { status: 502 });
    }

    const movie = data.movie || data;
    const rawStatus: string = movie.status || "unknown";
    const url: string | null = movie.url || null;

    let status: "rendering" | "succeeded" | "failed";
    if (rawStatus === "done" || rawStatus === "completed" || url) {
      status = "succeeded";
    } else if (rawStatus === "error" || rawStatus === "failed") {
      status = "failed";
    } else {
      status = "rendering";
    }

    return NextResponse.json({ id, status, url, raw_status: rawStatus });
  } catch {
    return NextResponse.json({ error: "status failed" }, { status: 500 });
  }
}
