import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number }> = {
  facebook: { width: 1200, height: 628 },
  instagram: { width: 1080, height: 1080 },
  linkedin: { width: 1200, height: 627 },
  story: { width: 1080, height: 1920 },
};

// Category-specific scene language. This shapes the environment, lighting,
// and mood — the actual SUBJECT comes from Claude's prompt per business.
const CATEGORY_SCENE: Record<string, string> = {
  food: "appetizing food photography, warm golden bokeh, gentle steam rising, fresh textures, artisan styling",
  tech: "clean minimal tech environment, soft cool blue tones, modern workspace, subtle glowing screens",
  beauty: "soft pastel aesthetic, natural diffused light, elegant clean background, fine skin texture",
  fitness: "dynamic high-energy action, dramatic rim lighting, powerful motion atmosphere, athletic intensity",
  luxury: "refined chiaroscuro lighting, deep tones with gold and cream, premium editorial mood",
  home: "warm lifestyle interior, golden hour light through windows, cozy lived-in atmosphere",
  professional: "corporate confidence, clean architectural lines, natural window light, modern office",
  playful: "bright pop colors, playful geometric staging, crisp flat studio light, upbeat vibe",
  other: "premium commercial scene, careful composition, natural cinematic lighting",
};

export const maxDuration = 120;

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

interface BrandProfile {
  category?: string;
  colors?: BrandColors;
}

// Strip any non-Latin characters (Hebrew, Arabic) — Flux degrades sharply
// on non-English tokens and they leak through sometimes.
function sanitizeToEnglish(input: string): string {
  return input
    .replace(/[\u0590-\u05FF\u0600-\u06FF]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFinalPrompt(basePrompt: string, brand: BrandProfile | null): string {
  const safeBase = sanitizeToEnglish(basePrompt);
  const category = (brand?.category || "other").toLowerCase();
  const scene = CATEGORY_SCENE[category] || CATEGORY_SCENE.other;

  const hexParts: string[] = [];
  if (brand?.colors?.primary) hexParts.push(brand.colors.primary);
  if (brand?.colors?.secondary) hexParts.push(brand.colors.secondary);
  if (brand?.colors?.accent) hexParts.push(brand.colors.accent);
  const hexLine = hexParts.length
    ? `brand hex colors: ${hexParts.join(" ")}`
    : "";

  // Strict structured template — NO TEXT guards at both ends.
  const parts = [
    "NO TEXT NO WORDS NO LETTERS NO SIGNS NO WATERMARKS NO OVERLAYS NO TYPOGRAPHY",
    safeBase,
    scene,
    "professional marketing photography",
    "shot on Sony A7R IV with 85mm f/1.4 lens",
    "natural cinematic lighting, editorial advertising style",
    hexLine,
    "pure clean photographic scene only",
    "hyper realistic, ultra high resolution, award winning photography",
    "NO TEXT NO WORDS NO LETTERS NO SIGNS NO WATERMARKS NO OVERLAYS NO TYPOGRAPHY",
  ].filter(Boolean);

  return parts.join(", ");
}

export async function POST(request: NextRequest) {
  const { prompt, platform, brand_profile } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Image prompt is required" },
      { status: 400 }
    );
  }

  const dimensions = PLATFORM_DIMENSIONS[platform];
  if (!dimensions) {
    return NextResponse.json(
      {
        error:
          "Invalid platform. Use: facebook, instagram, linkedin, or story",
      },
      { status: 400 }
    );
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    const finalPrompt = buildFinalPrompt(prompt, brand_profile || null);

    const output = await runWithRetry(async () =>
      replicate.run("black-forest-labs/flux-1.1-pro", {
        input: {
          prompt: finalPrompt,
          width: dimensions.width,
          height: dimensions.height,
          output_format: "webp",
          output_quality: 92,
          safety_tolerance: 2,
          prompt_upsampling: false,
        },
      })
    );

    let imageUrl: string;
    if (typeof output === "string") {
      imageUrl = output;
    } else if (output && typeof output === "object" && "url" in output) {
      imageUrl = (output as { url: () => string }).url();
    } else {
      const arr = output as unknown[];
      imageUrl = typeof arr[0] === "string" ? arr[0] : String(arr[0]);
    }

    return NextResponse.json({
      image_url: imageUrl,
      platform,
      dimensions,
    });
  } catch (error) {
    console.error(`Image generation error (${platform}):`, error);
    const status = extractStatus(error);
    const message =
      status === 429
        ? "ה-AI של התמונות עסוק כרגע. נסו שוב בעוד רגע."
        : "Failed to generate image. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractStatus(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const anyErr = err as { status?: number; response?: { status?: number } };
  if (typeof anyErr.status === "number") return anyErr.status;
  if (anyErr.response && typeof anyErr.response.status === "number") {
    return anyErr.response.status;
  }
  const msg = (err as { message?: string }).message ?? "";
  const m = /status\s+(\d{3})/.exec(msg);
  return m ? Number(m[1]) : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = extractStatus(err);
      const retryable = status === 429 || status === 503 || status === 502;
      if (!retryable) throw err;
      attempt++;
      if (attempt >= maxAttempts) break;
      const base = 1500 * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 500);
      const wait = base + jitter;
      console.warn(
        `Replicate ${status} — retry ${attempt}/${maxAttempts - 1} after ${wait}ms`
      );
      await sleep(wait);
    }
  }
  throw lastErr;
}
