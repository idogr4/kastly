import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number }> = {
  facebook: { width: 1200, height: 628 },
  instagram: { width: 1080, height: 1080 },
  linkedin: { width: 1200, height: 627 },
};

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const { prompt, platform } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Image prompt is required" },
      { status: 400 }
    );
  }

  const dimensions = PLATFORM_DIMENSIONS[platform];
  if (!dimensions) {
    return NextResponse.json(
      { error: "Invalid platform. Use: facebook, instagram, or linkedin" },
      { status: 400 }
    );
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input: {
        prompt: `Professional marketing ad image. ${prompt}. Clean, modern, high-quality commercial photography style. No text overlays, no watermarks.`,
        width: dimensions.width,
        height: dimensions.height,
        output_format: "webp",
        output_quality: 90,
        safety_tolerance: 2,
        prompt_upsampling: true,
      },
    });

    // Flux 1.1 pro returns a single URL string or a FileOutput
    let imageUrl: string;
    if (typeof output === "string") {
      imageUrl = output;
    } else if (output && typeof output === "object" && "url" in output) {
      imageUrl = (output as { url: () => string }).url();
    } else {
      // Might be an array
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
    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
  }
}
