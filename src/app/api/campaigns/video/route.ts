import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

interface VideoRequestBody {
  business_name: string;
  headline: string;
  body: string;
  cta: string;
  images?: (string | null)[];
  plan?: string;
}

const CREATOMATE_ENDPOINT = "https://api.creatomate.com/v1/renders";

function buildSource(args: {
  businessName: string;
  headline: string;
  body: string;
  cta: string;
  images: string[];
  watermark: boolean;
}) {
  const { businessName, headline, body, cta, images, watermark } = args;

  // Ensure 3 images (repeat or pad with gradient placeholders)
  const pics = [0, 1, 2].map((i) => images[i] || images[0] || null);

  const COLORS = {
    bgFrom: "#6c5ce7",
    bgTo: "#fd79a8",
    text: "#ffffff",
    accent: "#ffd43b",
    dark: "#1a1a2e",
  };

  const elements: unknown[] = [
    // Full gradient background
    {
      type: "shape",
      track: 1,
      time: 0,
      duration: 30,
      width: "100%",
      height: "100%",
      x: "50%",
      y: "50%",
      path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
      fill_color: `linear-gradient(135deg, ${COLORS.bgFrom}, ${COLORS.bgTo})`,
    },

    // SCENE 1 (0–7s) — business name + main headline
    {
      type: "text",
      track: 2,
      time: 0.3,
      duration: 6.7,
      x: "50%",
      y: "35%",
      width: "85%",
      text: businessName,
      font_family: "Heebo",
      font_weight: 800,
      font_size: 70,
      fill_color: COLORS.accent,
      text_alignment_horizontal: "center",
      text_alignment_vertical: "center",
      animations: [
        { type: "fade", time: 0, duration: 0.5 },
        { type: "fade", time: 6, duration: 0.7, reversed: true },
      ],
    },
    {
      type: "text",
      track: 3,
      time: 0.8,
      duration: 6.2,
      x: "50%",
      y: "55%",
      width: "85%",
      text: headline,
      font_family: "Heebo",
      font_weight: 700,
      font_size: 110,
      fill_color: COLORS.text,
      text_alignment_horizontal: "center",
      text_alignment_vertical: "top",
      shadow_color: "rgba(0,0,0,0.35)",
      shadow_blur: 20,
      animations: [
        { type: "slide", direction: "up", time: 0, duration: 0.7, easing: "quadratic-out" },
        { type: "fade", time: 6, duration: 0.7, reversed: true },
      ],
    },

    // SCENE 2 (7–16s) — first image + body excerpt
    pics[0]
      ? {
          type: "image",
          track: 1,
          time: 7,
          duration: 9,
          source: pics[0],
          x: "50%",
          y: "50%",
          width: "100%",
          height: "100%",
          fit: "cover",
          animations: [
            { type: "scale", time: 0, duration: 9, start_scale: "100%", end_scale: "115%", easing: "linear" },
            { type: "fade", time: 0, duration: 0.6 },
            { type: "fade", time: 8.4, duration: 0.6, reversed: true },
          ],
        }
      : null,
    {
      type: "shape",
      track: 2,
      time: 7,
      duration: 9,
      x: "50%",
      y: "50%",
      width: "100%",
      height: "100%",
      path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
      fill_color: "rgba(0,0,0,0.45)",
      animations: [{ type: "fade", time: 0, duration: 0.6 }],
    },
    {
      type: "text",
      track: 3,
      time: 7.4,
      duration: 8.2,
      x: "50%",
      y: "50%",
      width: "88%",
      text: truncate(body, 140),
      font_family: "Heebo",
      font_weight: 600,
      font_size: 64,
      line_height: "130%",
      fill_color: COLORS.text,
      text_alignment_horizontal: "center",
      text_alignment_vertical: "center",
      shadow_color: "rgba(0,0,0,0.5)",
      shadow_blur: 16,
      animations: [
        { type: "slide", direction: "up", time: 0, duration: 0.7, easing: "quadratic-out" },
        { type: "fade", time: 7.5, duration: 0.7, reversed: true },
      ],
    },

    // SCENE 3 (16–24s) — second image + CTA teaser
    pics[1]
      ? {
          type: "image",
          track: 1,
          time: 16,
          duration: 8,
          source: pics[1],
          x: "50%",
          y: "50%",
          width: "100%",
          height: "100%",
          fit: "cover",
          animations: [
            { type: "scale", time: 0, duration: 8, start_scale: "115%", end_scale: "100%", easing: "linear" },
            { type: "fade", time: 0, duration: 0.6 },
            { type: "fade", time: 7.4, duration: 0.6, reversed: true },
          ],
        }
      : null,
    {
      type: "shape",
      track: 2,
      time: 16,
      duration: 8,
      x: "50%",
      y: "50%",
      width: "100%",
      height: "100%",
      path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
      fill_color: "rgba(108, 92, 231, 0.5)",
    },
    {
      type: "text",
      track: 3,
      time: 16.3,
      duration: 7.4,
      x: "50%",
      y: "45%",
      width: "85%",
      text: truncate(headline, 60),
      font_family: "Heebo",
      font_weight: 800,
      font_size: 100,
      fill_color: COLORS.text,
      text_alignment_horizontal: "center",
      text_alignment_vertical: "center",
      shadow_color: "rgba(0,0,0,0.5)",
      shadow_blur: 16,
      animations: [
        { type: "slide", direction: "up", time: 0, duration: 0.6, easing: "quadratic-out" },
        { type: "fade", time: 6.8, duration: 0.7, reversed: true },
      ],
    },

    // SCENE 4 (24–30s) — CTA finale
    pics[2]
      ? {
          type: "image",
          track: 1,
          time: 24,
          duration: 6,
          source: pics[2],
          x: "50%",
          y: "50%",
          width: "100%",
          height: "100%",
          fit: "cover",
          animations: [
            { type: "scale", time: 0, duration: 6, start_scale: "100%", end_scale: "110%", easing: "linear" },
            { type: "fade", time: 0, duration: 0.5 },
          ],
        }
      : null,
    {
      type: "shape",
      track: 2,
      time: 24,
      duration: 6,
      x: "50%",
      y: "50%",
      width: "100%",
      height: "100%",
      path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
      fill_color: `linear-gradient(180deg, rgba(26,26,46,0.3), rgba(26,26,46,0.85))`,
    },
    {
      type: "text",
      track: 3,
      time: 24.3,
      duration: 5.5,
      x: "50%",
      y: "42%",
      width: "85%",
      text: cta,
      font_family: "Heebo",
      font_weight: 800,
      font_size: 120,
      fill_color: COLORS.accent,
      text_alignment_horizontal: "center",
      text_alignment_vertical: "center",
      shadow_color: "rgba(0,0,0,0.6)",
      shadow_blur: 20,
      animations: [
        { type: "scale", time: 0, duration: 0.6, start_scale: "70%", end_scale: "100%", easing: "elastic-out" },
      ],
    },
    {
      type: "text",
      track: 4,
      time: 25,
      duration: 4.8,
      x: "50%",
      y: "72%",
      width: "80%",
      text: businessName,
      font_family: "Heebo",
      font_weight: 600,
      font_size: 56,
      fill_color: COLORS.text,
      text_alignment_horizontal: "center",
      text_alignment_vertical: "center",
      animations: [{ type: "fade", time: 0, duration: 0.8 }],
    },
  ].filter(Boolean);

  // Optional background music via env
  const musicUrl = process.env.CREATOMATE_MUSIC_URL;
  if (musicUrl) {
    elements.push({
      type: "audio",
      track: 10,
      time: 0,
      duration: 30,
      source: musicUrl,
      volume: 35,
      audio_fade_in: 0.5,
      audio_fade_out: 1.5,
    });
  }

  // Watermark for free plan — tiled + corner badge
  if (watermark) {
    elements.push({
      type: "text",
      track: 20,
      time: 0,
      duration: 30,
      x: "50%",
      y: "50%",
      width: "140%",
      height: "140%",
      text: "Kastly  Kastly  Kastly\nKastly  Kastly  Kastly\nKastly  Kastly  Kastly\nKastly  Kastly  Kastly\nKastly  Kastly  Kastly",
      font_family: "Heebo",
      font_weight: 700,
      font_size: 90,
      fill_color: "rgba(255,255,255,0.12)",
      text_alignment_horizontal: "center",
      text_alignment_vertical: "center",
      transform: "rotate(-20deg)",
    });
    elements.push({
      type: "shape",
      track: 21,
      time: 0,
      duration: 30,
      x: "85%",
      y: "96%",
      width: "26%",
      height: "4%",
      path: "M 5 0 L 95 0 Q 100 0 100 5 L 100 95 Q 100 100 95 100 L 5 100 Q 0 100 0 95 L 0 5 Q 0 0 5 0 Z",
      fill_color: "rgba(108, 92, 231, 0.9)",
    });
    elements.push({
      type: "text",
      track: 22,
      time: 0,
      duration: 30,
      x: "85%",
      y: "96%",
      width: "26%",
      text: "נוצר ב-Kastly",
      font_family: "Heebo",
      font_weight: 700,
      font_size: 38,
      fill_color: "#ffffff",
      text_alignment_horizontal: "center",
      text_alignment_vertical: "center",
    });
  }

  return {
    output_format: "mp4",
    frame_rate: 30,
    width: 1080,
    height: 1920,
    duration: 30,
    elements,
  };
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + "…" : clean;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "שירות יצירת הסרטונים לא מוגדר. צור קשר עם התמיכה." },
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

    const source = buildSource({
      businessName: business_name,
      headline,
      body: adBody || "",
      cta,
      images: images.filter((x): x is string => typeof x === "string" && !!x),
      watermark: isFreePlan,
    });

    const res = await fetch(CREATOMATE_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      console.error("Creatomate error:", res.status, errTxt);
      return NextResponse.json(
        { error: "יצירת הסרטון נכשלה. נסו שוב בעוד רגע." },
        { status: 502 }
      );
    }

    const data = await res.json();
    // Creatomate returns an array of renders (one per output)
    const renders = Array.isArray(data) ? data : [data];
    const render = renders[0];

    if (!render) {
      return NextResponse.json(
        { error: "לא התקבלה תגובה מהשרת" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      id: render.id,
      status: render.status,
      url: render.url ?? null,
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
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  try {
    const res = await fetch(`${CREATOMATE_ENDPOINT}/${id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "status failed" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({
      id: data.id,
      status: data.status,
      url: data.url ?? null,
    });
  } catch {
    return NextResponse.json({ error: "status failed" }, { status: 500 });
  }
}
