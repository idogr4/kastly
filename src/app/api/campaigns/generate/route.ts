import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import FirecrawlApp from "@mendable/firecrawl-js";

const DEMO_CAMPAIGN = {
  business_name: "Fresh Roasts Co.",
  business_description:
    "Specialty coffee subscription — freshly roasted beans delivered weekly.",
  persona: {
    age_range: "28–42",
    gender: "All genders, skews slightly male",
    pain_points: [
      "Stale supermarket coffee that tastes like cardboard",
      "Too many choices online, no way to know quality before buying",
      "Guilty about overpaying at coffee shops every morning",
    ],
    desires: [
      "That cafe-quality first sip, every morning, at home",
      "Feeling like a coffee connoisseur without the effort",
      "Supporting small, local roasters",
    ],
    scroll_stoppers: [
      "Side-by-side: supermarket bag date vs. Fresh Roasts bag date",
      "Slow-mo pour of perfectly extracted espresso",
      "Real customer unboxing reaction",
    ],
    objections: [
      "Another subscription I'll forget to cancel",
      "Is it really that different from store-bought?",
      "I don't have fancy brewing equipment",
    ],
    tone: "Warm, confident, slightly cheeky — like a barista friend who knows their stuff",
  },
  facebook: [
    {
      hook_type: "pain",
      headline: "Your Coffee Was Roasted 4 Months Ago",
      body: "That bag sitting in your kitchen? It was roasted, shipped to a warehouse, sat on a truck, then collected dust on a shelf. By the time you opened it, the flavor was already gone. Fresh Roasts delivers beans roasted 48 hours ago — not 4 months. Your mornings deserve better than stale leftovers.",
      cta: "Taste the Difference — First Bag Free",
      scores: { hook: 9, clarity: 9, cta: 8, platform_fit: 9, overall: 9 },
    },
    {
      hook_type: "curiosity",
      headline: "Why Do Baristas Smell the Bag Before Brewing?",
      body: "Because freshness changes everything. The aroma tells them how recently those beans were roasted — and whether the cup will be transcendent or forgettable. Fresh Roasts ships within 48 hours of roasting. Open the bag. Inhale. You'll understand immediately.",
      cta: "Discover What Fresh Really Means →",
      scores: { hook: 9, clarity: 8, cta: 8, platform_fit: 8, overall: 8 },
    },
    {
      hook_type: "numbers",
      headline: "2,847 People Cancelled Their Café Subscriptions Last Month",
      body: "They didn't quit coffee — they upgraded. For less than one latte a week, Fresh Roasts delivers specialty-grade beans from local roasters straight to your door. 48-hour roast-to-door guarantee. 94% of subscribers say they'll never go back to store-bought.",
      cta: "Join 2,847 Smart Coffee Lovers →",
      scores: { hook: 9, clarity: 9, cta: 9, platform_fit: 9, overall: 9 },
    },
  ],
  instagram: [
    {
      hook_type: "pain",
      headline: "Stop drinking yesterday's coffee ☕",
      body: "You wouldn't eat bread baked 4 months ago. So why are you drinking coffee roasted that long ago? Fresh Roasts delivers beans roasted 48 hours before they hit your doorstep. That first sip hits different when the beans are actually fresh. #FreshRoasts #CoffeeSubscription #SpecialtyCoffee #CoffeeLovers",
      cta: "Link in bio — first bag free",
      scores: { hook: 8, clarity: 9, cta: 7, platform_fit: 9, overall: 8 },
    },
    {
      hook_type: "curiosity",
      headline: "The 48-hour rule your barista won't tell you ☕",
      body: "Peak flavor in coffee? It lasts 2-14 days after roasting. After that, it's a slow decline into blandness. That's why we ship within 48 hours of roasting — so every cup you brew is at peak flavor. Once you know, you can't unknow it. #FreshRoasts #CoffeeTok #CoffeeSnob #MorningRoutine",
      cta: "Try peak flavor — link in bio",
      scores: { hook: 9, clarity: 8, cta: 7, platform_fit: 9, overall: 8 },
    },
    {
      hook_type: "numbers",
      headline: "48 hours. 200+ roasters. 1 perfect cup ☕",
      body: "Here's the math: specialty beans from 200+ local roasters → roasted to order → at your door in 48 hours → a cup that makes you close your eyes and smile. All for less than your daily Starbucks run. 2,000+ coffee lovers already made the switch. #FreshRoasts #CoffeeDelivery #SpecialtyCoffee",
      cta: "Do the math — link in bio",
      scores: { hook: 8, clarity: 9, cta: 8, platform_fit: 8, overall: 8 },
    },
  ],
  linkedin: [
    {
      hook_type: "pain",
      headline: "The coffee industry has a freshness problem",
      body: "Most commercial coffee sits in warehouses for months before reaching consumers. By then, the complex flavor compounds that make specialty coffee remarkable have degraded significantly. Fresh Roasts Co. is solving this with a direct-to-consumer model that guarantees delivery within 48 hours of roasting — eliminating the stale middle ground entirely.",
      cta: "Learn how we're disrupting the supply chain",
      scores: { hook: 8, clarity: 9, cta: 8, platform_fit: 9, overall: 9 },
    },
    {
      hook_type: "curiosity",
      headline: "We asked 500 coffee drinkers one question. The answer surprised us.",
      body: "\"When was your coffee roasted?\" 89% had no idea. The answer for most supermarket coffee: 2-6 months ago. This information asymmetry is exactly why we built Fresh Roasts — to create transparency in a supply chain that has operated in the dark for decades. Freshness shouldn't be a luxury. It should be the standard.",
      cta: "See the data behind fresh coffee →",
      scores: { hook: 9, clarity: 9, cta: 7, platform_fit: 9, overall: 9 },
    },
    {
      hook_type: "numbers",
      headline: "48 hours. 12,000 subscribers. 340% YoY growth.",
      body: "Fresh Roasts Co. in numbers: beans delivered within 48 hours of roasting. 200+ partner roasters across the country. 12,000 active subscribers. 94% retention rate. 340% year-over-year growth. When you solve a real problem with a measurable difference, the numbers speak for themselves.",
      cta: "Explore partnership opportunities",
      scores: { hook: 9, clarity: 9, cta: 8, platform_fit: 10, overall: 9 },
    },
  ],
  landing_page: {
    hero_headline: "Coffee So Fresh, You Can Taste the Difference",
    hero_subheadline:
      "Specialty beans from top local roasters, delivered to your door within 48 hours of roasting.",
    features: [
      "Freshly roasted beans from curated local roasters",
      "Flexible weekly or bi-weekly delivery schedule",
      "Free shipping and cancel anytime — no commitment",
    ],
    cta: "Get Your First Bag Free",
  },
  image_prompts: {
    facebook:
      "A warm, inviting flat-lay of freshly roasted coffee beans spilling from a kraft paper bag onto a rustic wooden table, with a steaming ceramic cup of black coffee beside it, morning sunlight streaming in from the left, shallow depth of field, lifestyle photography",
    instagram:
      "A close-up overhead shot of a perfectly crafted latte art in a minimal white ceramic cup, surrounded by scattered whole coffee beans on a marble surface, warm golden hour lighting, Instagram-aesthetic composition, square format",
    linkedin:
      "A professional photo of a small-batch coffee roasting facility, artisan roaster carefully examining freshly roasted beans, industrial-chic setting with warm lighting, conveying craft and expertise, business photography style",
  },
};

export const maxDuration = 120;

async function deepScrape(
  firecrawl: FirecrawlApp,
  baseUrl: string
): Promise<{ content: string; title: string; description: string }> {
  // Scrape main page first
  const mainResult = await firecrawl.scrape(baseUrl, {
    formats: ["markdown"],
  });

  let allContent = mainResult.markdown?.slice(0, 4000) ?? "";
  const title = mainResult.metadata?.title ?? "";
  const description = mainResult.metadata?.description ?? "";

  // Try to discover and scrape additional pages
  const baseOrigin = new URL(baseUrl).origin;
  const subPages = ["/about", "/about-us", "/product", "/products", "/reviews", "/testimonials"];

  const extraScrapes = subPages.map(async (path) => {
    try {
      const result = await firecrawl.scrape(`${baseOrigin}${path}`, {
        formats: ["markdown"],
      });
      return result.markdown?.slice(0, 2000) ?? "";
    } catch {
      return "";
    }
  });

  const extraResults = await Promise.allSettled(extraScrapes);
  for (const result of extraResults) {
    if (result.status === "fulfilled" && result.value) {
      allContent += "\n\n---\n\n" + result.value;
    }
  }

  // Cap total content
  return {
    content: allContent.slice(0, 12000),
    title,
    description,
  };
}

const SYSTEM_PROMPT = `You are an elite creative director who has led campaigns for Nike, Apple, and Airbnb. You combine the storytelling instinct of a Pulitzer-winning journalist with the conversion science of a performance marketer.

Your creative philosophy:
- Every headline must pass the "thumb-stop test" — would someone literally stop scrolling?
- Copy is a conversation, not a broadcast. Write like a smart friend, not a corporation.
- Specificity sells. "2,847 people" beats "thousands". "48 hours" beats "fast".
- Every ad must have emotional tension — a gap between where the reader IS and where they WANT to be.
- CTAs are promises, not commands. "Taste the difference" beats "Buy now".`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, description } = body;

  const hasUrl = url && typeof url === "string";
  const hasDescription = description && typeof description === "string";

  if (!hasUrl && !hasDescription) {
    return NextResponse.json(
      { error: "URL or business description is required" },
      { status: 400 }
    );
  }

  // Demo mode
  if (url === "demo" || url === "https://demo.com") {
    return NextResponse.json({
      campaign: DEMO_CAMPAIGN,
      source_url: url,
    });
  }

  try {
    let pageContent = "";
    let pageTitle = "";
    let pageDescription = "";
    let inputContext = "";

    if (hasUrl) {
      // Deep scrape — scan homepage + about, product, reviews pages
      const firecrawl = new FirecrawlApp({
        apiKey: process.env.FIRECRAWL_API_KEY!,
      });

      try {
        const scraped = await deepScrape(firecrawl, url);
        pageContent = scraped.content;
        pageTitle = scraped.title;
        pageDescription = scraped.description;
      } catch {
        return NextResponse.json(
          {
            error:
              "Failed to scan website. Please check the URL and try again.",
          },
          { status: 422 }
        );
      }

      inputContext = `Website URL: ${url}
Page Title: ${pageTitle}
Page Description: ${pageDescription}

Website Content (scraped from homepage, about page, product pages, and reviews):
${pageContent}`;
    } else {
      inputContext = `Business Description (provided by the business owner):
${description}

Note: No website was provided. Use the description above as your sole source of business information. Infer the brand voice, target audience, and key value propositions from the description.`;
    }

    // Generate campaign with Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this business deeply and create a premium marketing campaign.

${inputContext}

STEP 1 — PERSONA
Build a detailed target audience persona from the content above. Think: who is the IDEAL buyer? What keeps them up at night? What would make them stop scrolling?

STEP 2 — VARIATIONS
For each platform (Facebook, Instagram, LinkedIn), create exactly 3 ad variations:
1. "pain" — leads with the audience's frustration or unmet need
2. "curiosity" — opens a knowledge gap that demands a click
3. "numbers" — leads with a specific, surprising statistic or data point

Each variation must:
- Have a scroll-stopping hook as the headline (NOT generic — it must create tension or surprise)
- Tell a micro-story in the body that builds emotional momentum toward the CTA
- Have a CTA that feels like a natural next step, not a hard sell
- Be adapted to the platform's culture (Facebook: conversational storytelling / Instagram: visual-first, hashtag-driven, emoji-friendly / LinkedIn: insight-led, professional authority)

STEP 3 — QUALITY SCORING
Score each ad variation on these dimensions (1-10):
- hook: How likely is this to stop someone mid-scroll?
- clarity: Is the value proposition crystal clear within 3 seconds?
- cta: Does the CTA feel irresistible and low-friction?
- platform_fit: Does this feel native to the platform?
- overall: Holistic quality score

Only output ads that score 7+ overall. If a draft scores below 7, rewrite it before including it.

Generate a JSON response with this EXACT structure:
{
  "business_name": "the business name",
  "business_description": "one compelling sentence about what they do and why it matters",
  "persona": {
    "age_range": "e.g. 25-40",
    "gender": "target gender or 'All'",
    "pain_points": ["3 specific pain points"],
    "desires": ["3 specific desires/aspirations"],
    "scroll_stoppers": ["3 visual/content ideas that would stop them scrolling"],
    "objections": ["3 main buying objections"],
    "tone": "description of the ideal brand voice for this audience"
  },
  "facebook": [
    {
      "hook_type": "pain",
      "headline": "scroll-stopping headline",
      "body": "compelling ad body (3-5 sentences, storytelling approach)",
      "cta": "irresistible call to action",
      "scores": { "hook": 9, "clarity": 8, "cta": 8, "platform_fit": 9, "overall": 9 }
    },
    { "hook_type": "curiosity", ... },
    { "hook_type": "numbers", ... }
  ],
  "instagram": [same 3-variation structure with hashtags and emojis],
  "linkedin": [same 3-variation structure with professional tone],
  "landing_page": {
    "hero_headline": "compelling landing page headline",
    "hero_subheadline": "supporting subheadline",
    "features": ["feature 1", "feature 2", "feature 3"],
    "cta": "main CTA button text"
  },
  "image_prompts": {
    "facebook": "detailed image generation prompt for a 1200x628 Facebook ad image that matches the business and target audience — describe the scene, lighting, composition, style",
    "instagram": "detailed image generation prompt for a 1080x1080 Instagram ad image — visually striking, platform-native aesthetic",
    "linkedin": "detailed image generation prompt for a 1200x627 LinkedIn ad image — professional, authoritative, business-appropriate"
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

    // Strip markdown fences if present
    let raw = textBlock.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const campaign = JSON.parse(raw);

    return NextResponse.json({
      campaign,
      source_url: url ?? null,
    });
  } catch (error) {
    console.error("Campaign generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
