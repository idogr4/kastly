import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import FirecrawlApp from "@mendable/firecrawl-js";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // 1. Scrape the website with Firecrawl
    const firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY!,
    });

    let scrapeResult;
    try {
      scrapeResult = await firecrawl.scrape(url, { formats: ["markdown"] });
    } catch {
      return NextResponse.json(
        { error: "Failed to scan website. Please check the URL and try again." },
        { status: 422 }
      );
    }

    const pageContent = scrapeResult.markdown?.slice(0, 6000) ?? "";
    const pageTitle = scrapeResult.metadata?.title ?? "";
    const pageDescription = scrapeResult.metadata?.description ?? "";

    // 2. Generate marketing campaign with Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are an expert marketing copywriter. Analyze this business website and create a complete marketing campaign.

Website URL: ${url}
Page Title: ${pageTitle}
Page Description: ${pageDescription}

Website Content:
${pageContent}

Generate a JSON response with this exact structure:
{
  "business_name": "the business name",
  "business_description": "one-line description of what they do",
  "facebook": {
    "headline": "attention-grabbing headline (under 10 words)",
    "body": "engaging post body (2-3 sentences, with emojis)",
    "cta": "call to action text"
  },
  "instagram": {
    "headline": "short punchy headline",
    "body": "instagram caption with hashtags (2-3 sentences)",
    "cta": "call to action text"
  },
  "linkedin": {
    "headline": "professional headline",
    "body": "professional post body (2-3 sentences, business-focused)",
    "cta": "call to action text"
  },
  "landing_page": {
    "hero_headline": "compelling landing page headline",
    "hero_subheadline": "supporting subheadline",
    "features": ["feature 1", "feature 2", "feature 3"],
    "cta": "main CTA button text"
  }
}

Respond ONLY with valid JSON, no markdown fences or extra text.`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Failed to generate campaign" },
        { status: 500 }
      );
    }

    const campaign = JSON.parse(textBlock.text);

    return NextResponse.json({
      campaign,
      source_url: url,
    });
  } catch (error) {
    console.error("Campaign generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
