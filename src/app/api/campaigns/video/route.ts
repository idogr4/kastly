import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

// JSON2Video REST API
// POST   https://api.json2video.com/v2/movies        -> start render
// GET    https://api.json2video.com/v2/movies?project=ID  -> poll status
// Auth:  x-api-key header
const J2V_ENDPOINT = "https://api.json2video.com/v2/movies";

// Default Hebrew neural voice. Can be overridden via env.
const DEFAULT_HEBREW_VOICE = "he-IL-HilaNeural";

interface VideoRequestBody {
  business_name: string;
  headline: string;
  body: string;
  cta: string;
  images?: (string | null)[];
  plan?: string;
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + "…" : clean;
}

type J2VElement = Record<string, unknown>;
type J2VScene = {
  duration: number;
  "background-color"?: string;
  elements: J2VElement[];
};

function buildMovie(args: {
  businessName: string;
  headline: string;
  body: string;
  cta: string;
  images: string[];
  watermark: boolean;
}) {
  const { businessName, headline, body, cta, images, watermark } = args;

  const voice = process.env.JSON2VIDEO_VOICE || DEFAULT_HEBREW_VOICE;

  const shortHeadline = truncate(headline, 90);
  const shortBody = truncate(body, 160);
  const shortCta = truncate(cta, 60);

  // Scene 1: Intro (business + headline) — 8s
  // Scene 2: Body with image + text — 12s
  // Scene 3: CTA finale — 10s
  // Total: 30s

  const scene1: J2VScene = {
    duration: 8,
    "background-color": "#6c5ce7",
    elements: [
      // Optional image as backdrop
      images[0]
        ? ({
            type: "image",
            src: images[0],
            duration: 8,
            start: 0,
            "zoom-effect": "zoomIn",
            opacity: 0.35,
            position: "center-center",
            width: 1080,
            height: 1920,
          } as J2VElement)
        : null,
      // Business name
      {
        type: "text",
        text: businessName,
        start: 0.3,
        duration: 7.7,
        position: "center-center",
        y: -280,
        settings: {
          "font-family": "Heebo",
          "font-size": "70px",
          "font-weight": "800",
          color: "#ffd43b",
          "text-align": "center",
        },
      },
      // Headline
      {
        type: "text",
        text: shortHeadline,
        start: 0.8,
        duration: 7.2,
        position: "center-center",
        y: 0,
        settings: {
          "font-family": "Heebo",
          "font-size": "100px",
          "font-weight": "800",
          color: "#ffffff",
          "text-align": "center",
          "text-shadow": "0 4px 20px rgba(0,0,0,0.45)",
        },
        width: 950,
        "fade-in": 0.5,
      },
    ].filter((x): x is J2VElement => Boolean(x)),
  };

  const scene2: J2VScene = {
    duration: 12,
    "background-color": "#1a1a2e",
    elements: [
      images[1] || images[0]
        ? ({
            type: "image",
            src: images[1] || images[0],
            duration: 12,
            start: 0,
            "zoom-effect": "zoomOut",
            opacity: 0.55,
            position: "center-center",
            width: 1080,
            height: 1920,
          } as J2VElement)
        : null,
      {
        type: "text",
        text: shortBody,
        start: 0.4,
        duration: 11.2,
        position: "center-center",
        settings: {
          "font-family": "Heebo",
          "font-size": "62px",
          "font-weight": "600",
          color: "#ffffff",
          "text-align": "center",
          "line-height": "1.35",
          "text-shadow": "0 3px 16px rgba(0,0,0,0.6)",
        },
        width: 960,
        "fade-in": 0.6,
      },
    ].filter((x): x is J2VElement => Boolean(x)),
  };

  const scene3: J2VScene = {
    duration: 10,
    "background-color": "#fd79a8",
    elements: [
      images[2] || images[0]
        ? ({
            type: "image",
            src: images[2] || images[0],
            duration: 10,
            start: 0,
            "zoom-effect": "zoomIn",
            opacity: 0.3,
            position: "center-center",
            width: 1080,
            height: 1920,
          } as J2VElement)
        : null,
      {
        type: "text",
        text: shortCta,
        start: 0.3,
        duration: 9.4,
        position: "center-center",
        y: -100,
        settings: {
          "font-family": "Heebo",
          "font-size": "130px",
          "font-weight": "800",
          color: "#ffffff",
          "text-align": "center",
          "text-shadow": "0 4px 22px rgba(0,0,0,0.5)",
        },
        width: 960,
        "fade-in": 0.4,
      },
      {
        type: "text",
        text: businessName,
        start: 1,
        duration: 8.7,
        position: "center-center",
        y: 260,
        settings: {
          "font-family": "Heebo",
          "font-size": "56px",
          "font-weight": "600",
          color: "#ffffff",
          "text-align": "center",
        },
        "fade-in": 0.6,
      },
    ].filter((x): x is J2VElement => Boolean(x)),
  };

  // Global Hebrew voiceover — concatenated narration spanning the full video.
  // `duration: -1` on a voice element = auto based on speech length.
  const narrationScript = `${businessName}. ${shortHeadline}. ${shortBody}. ${shortCta}.`;

  const globalElements: J2VElement[] = [
    {
      type: "voice",
      text: narrationScript,
      voice,
      start: 0.4,
      duration: -1,
    },
  ];

  if (watermark) {
    globalElements.push({
      type: "text",
      text: "נוצר ב-Kastly",
      start: 0,
      duration: 30,
      position: "bottom-right",
      settings: {
        "font-family": "Heebo",
        "font-size": "36px",
        "font-weight": "700",
        color: "#ffffff",
        "background-color": "rgba(108, 92, 231, 0.85)",
        padding: "8px 14px",
        "border-radius": "10px",
      },
    });

    // Faint tiled watermark across the video — single large diagonal text
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
    scenes: [scene1, scene2, scene3],
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
      images = [],
      plan = "free",
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
      images: images.filter((x): x is string => typeof x === "string" && !!x),
      watermark: isFreePlan,
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

    // JSON2Video returns { success, project, message, ... }
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
    const res = await fetch(`${J2V_ENDPOINT}?project=${encodeURIComponent(id)}`, {
      headers: { "x-api-key": apiKey },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return NextResponse.json({ error: "status failed" }, { status: 502 });
    }

    // JSON2Video response shape: { success, movie: { status, url, ... } }
    const movie = data.movie || data;
    const rawStatus: string = movie.status || "unknown";
    const url: string | null = movie.url || null;

    // Normalise to { rendering | succeeded | failed }
    let status: "rendering" | "succeeded" | "failed";
    if (rawStatus === "done" || rawStatus === "completed" || url) {
      status = "succeeded";
    } else if (rawStatus === "error" || rawStatus === "failed") {
      status = "failed";
    } else {
      status = "rendering";
    }

    return NextResponse.json({
      id,
      status,
      url,
      raw_status: rawStatus,
    });
  } catch {
    return NextResponse.json({ error: "status failed" }, { status: 500 });
  }
}
