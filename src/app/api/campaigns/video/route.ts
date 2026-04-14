import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const CREATOMATE_ENDPOINT = "https://api.creatomate.com/v1/renders";
const DEFAULT_TEMPLATE_ID = "a65e9ac4-2dc3-48ab-a70d-db7162be855c";

interface VideoRequestBody {
  business_name: string;
  headline: string;
  body: string;
  cta: string;
  images?: (string | null)[];
  plan?: string;
}

/**
 * Build Creatomate `modifications` payload.
 *
 * Templates use named elements, which vary between designs. To maximise
 * compatibility with common Creatomate template conventions we send the
 * same value under several plausible element names — unknown names are
 * silently ignored by Creatomate.
 */
function buildModifications(args: {
  businessName: string;
  headline: string;
  body: string;
  cta: string;
  images: string[];
  watermark: boolean;
}): Record<string, string> {
  const { businessName, headline, body, cta, images, watermark } = args;

  const shortBody = truncate(body, 140);
  const watermarkText = watermark ? "נוצר ב-Kastly — kastly.app" : " ";

  const mods: Record<string, string> = {
    // Title / headline variants
    Title: headline,
    Headline: headline,
    "Title-1": headline,
    "Text-1": headline,
    "Main-Title": headline,

    // Description / body variants
    Description: shortBody,
    Subtitle: shortBody,
    Body: shortBody,
    "Text-2": shortBody,
    "Sub-Title": shortBody,
    "Subtitle-1": shortBody,

    // CTA variants
    CTA: cta,
    "Call-To-Action": cta,
    Button: cta,
    "Button-Text": cta,
    "Text-3": cta,

    // Business name variants
    Brand: businessName,
    "Business-Name": businessName,
    Logo: businessName,
    "Logo-Text": businessName,
    "Text-4": businessName,

    // Watermark — template should have a "Watermark" text element
    Watermark: watermarkText,
    "Watermark-Text": watermarkText,
  };

  // Image slots — best-effort. If template lacks these, they're ignored.
  images.slice(0, 4).forEach((url, i) => {
    mods[`Image-${i + 1}`] = url;
    mods[`Photo-${i + 1}`] = url;
  });

  return mods;
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, n - 1).trimEnd() + "…" : clean;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.CREATOMATE_API_KEY;
  const templateId =
    process.env.CREATOMATE_TEMPLATE_ID || DEFAULT_TEMPLATE_ID;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "שירות יצירת הסרטונים לא מוגדר. חסר CREATOMATE_API_KEY.",
      },
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

    const modifications = buildModifications({
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
      body: JSON.stringify({
        template_id: templateId,
        modifications,
        output_format: "mp4",
      }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      console.error("Creatomate error:", res.status, errTxt);
      return NextResponse.json(
        {
          error: "יצירת הסרטון נכשלה. נסו שוב בעוד רגע.",
          detail: errTxt.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const data = await res.json();
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
