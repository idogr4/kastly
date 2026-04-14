import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number }> = {
  facebook: { width: 1200, height: 628 },
  instagram: { width: 1080, height: 1080 },
  linkedin: { width: 1200, height: 627 },
  story: { width: 1080, height: 1920 },
};

const CATEGORY_STYLE: Record<string, string> = {
  food:
    "appetizing, warm golden lighting, shallow depth of field, food-editorial photography, rich saturated tones, artisanal styling",
  tech:
    "minimal modern product photography, clean geometric composition, crisp studio lighting on subtle gradient, futuristic polish",
  beauty:
    "soft diffused lighting, pastel tones, elegant composition, editorial beauty photography, skin texture detail, subtle bokeh",
  fitness:
    "high-contrast dynamic action shot, dramatic rim lighting, motion-blur energy, dark moody background with bright key subject",
  luxury:
    "dramatic chiaroscuro lighting, gold and deep tones, refined texture, premium editorial photography, slow-shutter elegance",
  home:
    "natural earthy styling, warm daylight, cozy interior context, lifestyle magazine photography, inviting and lived-in",
  professional:
    "clean corporate photography, bright even lighting, modern office aesthetic, confident composition, business-grade polish",
  playful:
    "bright pop colors, playful geometric composition, crisp flat studio light, friendly energetic vibe",
  other:
    "premium commercial photography, carefully composed, natural lighting, high detail, editorial style",
};

const TONE_MODIFIER: Record<string, string> = {
  warm: "warm inviting mood",
  professional: "confident professional mood",
  energetic: "high-energy kinetic mood",
  luxurious: "refined premium mood",
  cozy: "intimate cozy mood",
  tech: "sleek futuristic mood",
  playful: "upbeat playful mood",
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
  tone?: string;
  colors?: BrandColors;
}

function enhancePrompt(
  basePrompt: string,
  brand: BrandProfile | null
): string {
  const category = (brand?.category || "other").toLowerCase();
  const tone = (brand?.tone || "").toLowerCase();
  const styleLine = CATEGORY_STYLE[category] || CATEGORY_STYLE.other;
  const toneLine = TONE_MODIFIER[tone] || "";

  const paletteBits: string[] = [];
  if (brand?.colors?.primary) paletteBits.push(`primary ${brand.colors.primary}`);
  if (brand?.colors?.secondary) paletteBits.push(`secondary ${brand.colors.secondary}`);
  if (brand?.colors?.accent) paletteBits.push(`accent ${brand.colors.accent}`);
  const palette = paletteBits.length
    ? `color palette incorporating ${paletteBits.join(", ")}`
    : "";

  const parts = [
    basePrompt.trim(),
    styleLine,
    toneLine,
    palette,
    "shot on full-frame camera, 85mm lens, natural composition, ultra-detailed, sharp focus, premium commercial ad photography, looks like it was shot by a top-tier photographer for a brand campaign",
    "no text overlays, no watermarks, no logos, no captions",
  ].filter(Boolean);

  return parts.join(". ");
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

    const finalPrompt = enhancePrompt(prompt, brand_profile || null);

    const output = await runWithRetry(async () =>
      replicate.run("black-forest-labs/flux-1.1-pro", {
        input: {
          prompt: finalPrompt,
          width: dimensions.width,
          height: dimensions.height,
          output_format: "webp",
          output_quality: 92,
          safety_tolerance: 2,
          prompt_upsampling: true,
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

// --- Retry helper: exponential backoff on 429 / 503 ---

function extractStatus(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const anyErr = err as { status?: number; response?: { status?: number } };
  if (typeof anyErr.status === "number") return anyErr.status;
  if (anyErr.response && typeof anyErr.response.status === "number") {
    return anyErr.response.status;
  }
  // Fallback: parse from message "... failed with status 429 ..."
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
      // Exponential backoff with jitter: 1.5s, 3s, 6s (+ up to 500ms jitter)
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
