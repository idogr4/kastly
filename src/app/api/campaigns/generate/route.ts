import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/plans";

export const maxDuration = 120;

// --- URL classification & smart scanning ---

type ScanSource = "appstore" | "playstore" | "website";

interface ScanResult {
  content: string;
  title: string;
  description: string;
  source: ScanSource;
  effectiveUrl: string;
}

function classifyUrl(rawUrl: string): { type: ScanSource; normalized: string } {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host.endsWith("apps.apple.com") || host === "itunes.apple.com") {
      return { type: "appstore", normalized: u.toString() };
    }
    if (host === "play.google.com" || host.endsWith(".play.google.com")) {
      return { type: "playstore", normalized: u.toString() };
    }
    return { type: "website", normalized: u.toString() };
  } catch {
    return { type: "website", normalized: rawUrl };
  }
}

function baseDomainOf(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (u.pathname === "/" || u.pathname === "") return null;
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}

async function scrapeSingle(
  firecrawl: FirecrawlApp,
  url: string,
  cap = 6000
): Promise<{ content: string; title: string; description: string } | null> {
  try {
    const result = await firecrawl.scrape(url, { formats: ["markdown"] });
    const markdown = result.markdown?.slice(0, cap) ?? "";
    if (!markdown.trim()) return null;
    return {
      content: markdown,
      title: result.metadata?.title ?? "",
      description: result.metadata?.description ?? "",
    };
  } catch {
    return null;
  }
}

async function deepScrapeWebsite(
  firecrawl: FirecrawlApp,
  baseUrl: string
): Promise<{ content: string; title: string; description: string } | null> {
  const main = await scrapeSingle(firecrawl, baseUrl, 4000);
  if (!main) return null;

  const baseOrigin = (() => {
    try {
      return new URL(baseUrl).origin;
    } catch {
      return null;
    }
  })();

  let allContent = main.content;

  if (baseOrigin) {
    const subPages = ["/about", "/about-us", "/product", "/products", "/reviews", "/testimonials"];
    const results = await Promise.allSettled(
      subPages.map((p) => scrapeSingle(firecrawl, `${baseOrigin}${p}`, 2000))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value?.content) {
        allContent += "\n\n---\n\n" + r.value.content;
      }
    }
  }

  return {
    content: allContent.slice(0, 12000),
    title: main.title,
    description: main.description,
  };
}

async function smartScan(
  firecrawl: FirecrawlApp,
  rawUrl: string
): Promise<ScanResult | null> {
  const { type, normalized } = classifyUrl(rawUrl);

  if (type === "appstore" || type === "playstore") {
    const single = await scrapeSingle(firecrawl, normalized, 8000);
    if (!single) return null;
    return { ...single, source: type, effectiveUrl: normalized };
  }

  // Website: try deep scrape, then fallback to base domain
  const deep = await deepScrapeWebsite(firecrawl, normalized);
  if (deep && deep.content.trim().length > 200) {
    return { ...deep, source: "website", effectiveUrl: normalized };
  }

  const base = baseDomainOf(normalized);
  if (base) {
    const fallback = await deepScrapeWebsite(firecrawl, base);
    if (fallback && fallback.content.trim().length > 200) {
      return { ...fallback, source: "website", effectiveUrl: base };
    }
  }

  return null;
}

// --- Prompt ---

const SYSTEM_PROMPT = `אתה מנהל קריאייטיב בכיר, ישראלי, שהוביל קמפיינים למותגים גדולים בארץ ובחו״ל. אתה כותב בעברית חיה, ישירה וחמה — כמו חבר חכם שמייעץ, לא כמו תאגיד.

עקרונות הכתיבה שלך:
- כל כותרת חייבת לעבור את מבחן "עצירת הגלילה" — האם מישהו באמת יעצור?
- הטקסט הוא שיחה, לא שידור. מדברים כמו לחבר, לא כמו לציבור.
- ספציפיות מוכרת. "2,847 אנשים" חזק יותר מ"אלפים". "48 שעות" חזק יותר מ"מהר".
- כל מודעה חייבת מתח רגשי — פער בין איפה שהקורא נמצא לאן שהוא רוצה להגיע.
- CTA זו הבטחה, לא פקודה. "תטעמו את ההבדל" חזק מ"לחצו עכשיו".
- עברית טבעית: בלי ניסוחים מליציים, בלי תרגומית, כן עם הומור מקומי כשמתאים.

חשוב מאוד: אל תמציא מידע שלא מופיע בקלט. אם חסר פרט (טלפון, כתובת, שם מייסד, סטטיסטיקה) — אל תמציא. הישאר צמוד למה שיש, והשלם רק השלמות סבירות ומקובלות לכל עסק מהסוג הזה.`;

function buildUserPrompt(args: {
  inputContext: string;
  missingDataWarning?: string;
}) {
  return `נתח את העסק לעומק וצור קמפיין שיווקי פרימיום — הכול בעברית ישראלית טבעית.

${args.inputContext}

${args.missingDataWarning ?? ""}

שלב 1 — פרסונה
בנה פרסונה מפורטת של קהל היעד האידיאלי בישראל. חשוב: מי הקונה האידיאלי? מה מטריד אותו בלילה? מה יגרום לו לעצור את הגלילה?

שלב 2 — וריאציות
עבור כל פלטפורמה (פייסבוק, אינסטגרם, לינקדאין), צור בדיוק 3 וריאציות:
1. "pain" — פותחת עם הכאב או הצורך הלא-ממומש של הקהל
2. "curiosity" — פותחת פער ידע שמחייב לחיצה
3. "numbers" — פותחת עם מספר או נתון ספציפי ומפתיע

כל וריאציה חייבת:
- כותרת שעוצרת גלילה (לא גנרית — חייבת ליצור מתח או הפתעה)
- גוף שמספר סיפור-זעיר שבונה מומנטום רגשי לקראת ה-CTA
- CTA שמרגיש כמו צעד טבעי הבא, לא מכירה כבדה
- מותאם לתרבות הפלטפורמה בישראל (פייסבוק: סיפורי / אינסטגרם: ויזואלי עם אימוג׳י והאשטגים בעברית / לינקדאין: תובנות מקצועיות)

שלב 3 — ציוני איכות
דרג כל וריאציה (1-10) על:
- hook: האם זה באמת יעצור גלילה?
- clarity: האם ההצעה ברורה בתוך 3 שניות?
- cta: האם ה-CTA מרגיש טבעי ולא-מאיים?
- platform_fit: האם זה מרגיש ילידי לפלטפורמה?
- overall: ציון איכות כולל

הוצא רק וריאציות עם ציון 7+. אם טיוטה מתחת ל-7, כתוב אותה מחדש.

החזר תגובה ב-JSON במבנה המדויק הזה. כל הטקסטים בעברית (חוץ מ-hook_type שנשאר באנגלית):
{
  "business_name": "שם העסק בעברית",
  "business_description": "משפט אחד משכנע על מה שהם עושים ולמה זה חשוב",
  "persona": {
    "age_range": "לדוגמה 25-40",
    "gender": "נשים / גברים / כולם",
    "pain_points": ["3 נקודות כאב ספציפיות"],
    "desires": ["3 רצונות/שאיפות ספציפיות"],
    "scroll_stoppers": ["3 רעיונות ויזואליים שעוצרים גלילה"],
    "objections": ["3 התנגדויות קנייה עיקריות"],
    "tone": "תיאור קול המותג האידיאלי לקהל הזה"
  },
  "facebook": [
    {
      "hook_type": "pain",
      "headline": "כותרת שעוצרת גלילה",
      "body": "גוף מודעה (3-5 משפטים, בגישה סיפורית)",
      "cta": "קריאה לפעולה",
      "scores": { "hook": 9, "clarity": 8, "cta": 8, "platform_fit": 9, "overall": 9 }
    },
    { "hook_type": "curiosity", ... },
    { "hook_type": "numbers", ... }
  ],
  "instagram": [אותו מבנה 3-וריאציות עם האשטגים ואימוג׳י],
  "linkedin": [אותו מבנה 3-וריאציות בטון מקצועי],
  "landing_page": {
    "hero_headline": "כותרת דף נחיתה משכנעת",
    "hero_subheadline": "תת-כותרת תומכת",
    "features": ["יתרון 1", "יתרון 2", "יתרון 3"],
    "cta": "טקסט כפתור ראשי"
  },
  "image_prompts": {
    "facebook": "prompt באנגלית ליצירת תמונה 1200x628 לפייסבוק — תיאור סצנה, תאורה, קומפוזיציה, סגנון",
    "instagram": "prompt באנגלית ליצירת תמונה 1080x1080 לאינסטגרם",
    "linkedin": "prompt באנגלית ליצירת תמונה 1200x627 ללינקדאין"
  },
  "stories": [
    {
      "slide": 1,
      "role": "hook",
      "title": "כותרת קצרה שעוצרת גלילה (עד 6 מילים)",
      "body": "משפט קצר בגוף הסטורי (עד 15 מילים)",
      "cta": "טקסט קצר לסטיקר או כפתור (2-4 מילים)",
      "background_style": "תיאור קצר של הרקע המומלץ (צבע/מרקם/אמוציה)",
      "visual_prompt": "prompt באנגלית ליצירת תמונה 1080x1920 (9:16) — ויזואל אנכי, ללא טקסט"
    },
    { "slide": 2, "role": "problem", ... },
    { "slide": 3, "role": "solution", ... },
    { "slide": 4, "role": "proof", ... },
    { "slide": 5, "role": "cta", ... }
  ]
}

דרוש: בדיוק 5 שקפי סטורי לאינסטגרם. השקפים חייבים לבנות נראטיב: hook → problem → solution → proof → cta. כל שקף חייב title, body, cta (גם אם קצר), background_style, ו-visual_prompt באנגלית. הטקסטים קצרים במכוון — מותאמים למסך נייד 9:16.

image_prompts נשארים באנגלית (כי מנוע התמונות פועל באנגלית). כל שאר הטקסטים — בעברית.

חשוב: אם המידע שקיבלת דל או חסר פרטים מסוימים, השתמש רק במה שמופיע. אל תמציא שמות, מספרים, סטטיסטיקות או עובדות שלא נתתי לך.

השב רק ב-JSON חוקי, בלי גדרי markdown ובלי טקסט נוסף.`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, description } = body;

  const hasUrl = url && typeof url === "string";
  const hasDescription = description && typeof description === "string";

  if (!hasUrl && !hasDescription) {
    return NextResponse.json(
      { error: "חייבים לספק קישור או תיאור של העסק" },
      { status: 400 }
    );
  }

  // Check plan limits for authenticated users
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userPlan: PlanId = "free";

  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    userPlan = (subscription?.plan as PlanId) ?? "free";
    const plan = getPlan(userPlan);

    if (plan.limits.campaignsPerMonth !== -1) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count } = await supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", monthStart);

      const used = count ?? 0;

      if (userPlan === "free") {
        const { count: totalCount } = await supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        if ((totalCount ?? 0) >= 1) {
          return NextResponse.json(
            {
              error: "חבילת החינם מאפשרת קמפיין אחד בלבד. שדרגו כדי לייצר עוד.",
              code: "PLAN_LIMIT",
            },
            { status: 403 }
          );
        }
      } else if (used >= plan.limits.campaignsPerMonth) {
        return NextResponse.json(
          {
            error: `ניצלתם את כל ${plan.limits.campaignsPerMonth} הקמפיינים החודש. שדרגו לעוד.`,
            code: "PLAN_LIMIT",
          },
          { status: 403 }
        );
      }
    }
  }

  try {
    let inputContext = "";
    let missingDataWarning = "";

    if (hasUrl) {
      const firecrawl = new FirecrawlApp({
        apiKey: process.env.FIRECRAWL_API_KEY!,
      });

      const scan = await smartScan(firecrawl, url);

      if (!scan) {
        return NextResponse.json(
          {
            error:
              "לא הצלחנו לסרוק את הקישור. אפשר לנסות קישור אחר, להדביק את דף הבית של הדומיין, או לתאר את העסק בטקסט חופשי ולהעלות תמונות.",
            code: "SCAN_FAILED",
          },
          { status: 422 }
        );
      }

      const sourceLabel =
        scan.source === "appstore"
          ? "דף אפליקציה ב-App Store"
          : scan.source === "playstore"
            ? "דף אפליקציה ב-Google Play"
            : "אתר אינטרנט";

      inputContext = `מקור: ${sourceLabel}
URL: ${scan.effectiveUrl}
כותרת: ${scan.title}
תיאור: ${scan.description}

תוכן שנסרק:
${scan.content}`;

      if (scan.effectiveUrl !== url) {
        missingDataWarning =
          "(הקישור המקורי לא היה זמין — בוצעה נפילה חזרה לדומיין הבסיס.)";
      }
    } else {
      inputContext = `תיאור עסק (סופק ע״י בעל העסק):
${description}

הערה: לא סופק אתר. השתמש אך ורק במידע מהתיאור. אל תמציא פרטים חסרים.`;
      missingDataWarning =
        "חשוב: אין אתר זמין. אם חסרים פרטים בתיאור — אל תמציא. השלם רק השלמות סבירות, והמנע ממספרים ספציפיים או הישגים שלא הוזכרו.";
    }

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
          content: buildUserPrompt({ inputContext, missingDataWarning }),
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "משהו השתבש ביצירת הקמפיין. נסו שוב." },
        { status: 500 }
      );
    }

    let raw = textBlock.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const campaign = JSON.parse(raw);

    return NextResponse.json({
      campaign,
      source_url: url ?? null,
      plan: userPlan,
    });
  } catch (error) {
    console.error("Campaign generation error:", error);
    return NextResponse.json(
      { error: "משהו השתבש. נסו שוב בעוד רגע." },
      { status: 500 }
    );
  }
}
