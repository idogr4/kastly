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

// --- Prompts ---

const BASE_SYSTEM = `אתה קופירייטר ישראלי בכיר עם 20 שנות ניסיון.
כתבת קמפיינים לחברות כמו בזק, שטראוס, ופרטנר.
אתה כותב עברית מקורית — לא תרגום.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
כללי ברזל לכתיבה
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- כל משפט צריך לעבור את מבחן ה-Thumb Stop — האם יעצור אדם שגולל?
- אסור לגמרי: "הצטרפו אלינו", "אנחנו מציעים", "שירות מקצועי", "פנו אלינו",
  "הפתרון המוביל", "איכות ללא פשרות", "מגוון רחב", "פתרון מקצה לקצה",
  "חווית לקוח ברמה הגבוהה ביותר", "שירות אישי ומקצועי" — כל אלה מתו ב-2015.
- חובה: hook חזק בשורה הראשונה שמדבר ישר לכאב או לרצון של הקורא
- פייסבוק: שיחה ישירה, אנושית — כאילו חבר כותב לחבר. פותחים בסיפור או סצנה
  קונקרטית ("יושבת פה ב-2 בלילה..." / "לא האמנתי שזה קורה לי שוב..."),
  גוף שמזיז רגש, CTA רך שמרגיש כמו הזמנה, לא דחיפה.
- אינסטגרם: קצר וחד. 1-3 משפטים עוצמתיים. 3-5 אמוג'י מדויקים ורלוונטיים
  (לא ספאם של 🔥🔥🔥). האשטאגים ישראליים רלוונטיים (#תלאביב #אוכל_ביתי
  #ישראל) מעורבבים עם 1-2 באנגלית אם מתאים לתחום.
- לינקדאין: תובנה מקצועית או נתון מעניין בשורה הראשונה ("רוב בעלי העסקים
  לא יודעים ש..." / "מה שלמדנו השנה..."). טון בגובה העיניים, לא ג'רגון
  יועצים. בלי אמוג'י מיותרים.
- CTA: הבטחה ברורה של מה הקורא מקבל — לא פקודה. "בואו נכיר" / "רוצים
  לטעום?" / "נשלח לכם דוגמה" / "בואו נדבר" — לא "לחצו עכשיו!!".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
אפס שקרים — רק מה שסרקת מהאתר
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
אסור להמציא: מספרי לקוחות, ציטוטים, פרסים, תקנים, שנות ותק, סניפים,
שמות מייסדים או שותפים, סטטיסטיקות, או כל עובדה שאינה בקלט שקיבלת.
מותר: מה שנסרק, רגשות ומוטיבציות אוניברסליות של הקהל, תיאור הכאב,
מסרי ערך כלליים על הקטגוריה.
כשאין מידע ספציפי: כתוב קופי חזק על הערך הרגשי — לא על מספרים. עדיף
אמיתי וכללי מאשר ספציפי ושקרי.`;

const CALL_A_SYSTEM = `${BASE_SYSTEM}

אתה בשלב ראשון: הגדרת זהות המותג, פרסונת הקהל, ופרומפטים ויזואליים. הבסיס לכל שאר הנכסים יתבסס עליך — דייק.`;

const CALL_B_SYSTEM = `${BASE_SYSTEM}

אתה בשלב שני: כתיבת המודעות ודף הנחיתה. כל וריאציה חייבת לעצור גלילה באמת — לא לעבור מבחן "כן, עוד מודעה". אם אתה כותב טיוטה שמרגישה גנרית — שכתב אותה עד שהיא קונקרטית לעסק הזה.`;

function buildCallAPrompt(inputContext: string, missingDataWarning: string) {
  return `נתח את העסק לעומק ובנה את הבסיס: פרופיל מותג מלא, פרסונת קהל, ופרומפטים ויזואליים לתמונות.

${inputContext}

${missingDataWarning}

━━━ פרופיל מותג ━━━
- category: food | tech | beauty | fitness | professional | luxury | home | other
- tone רגשי: warm | professional | energetic | luxurious | cozy | tech | playful
- צבעים (hex): חייבים להתאים לקטגוריה ולטון — לא ברירות מחדל גנריות
  · אוכל: ענבר/בורדו/חום חם (#8b2f1d, #f4a261, #ffd166)
  · טכנולוגיה: כחול/סגול/שחור קר (#0a0f2c, #2e5bff, #00e5ff)
  · יופי/ספא: פודרה/ורד/שמנת (#ffd6e0, #f7b2c1, #c7b6f5)
  · כושר: שחור/ניאון אנרגטי (#0b0b0d, #ff3d3d, #d6ff2a)
  · יוקרה: שחור/זהב/לבן (#0c0c0c, #b08d57, #e8c77d)
  · ביתי: קרם/זית/חמרה (#6b4f3b, #d8c3a5, #e98a58)
  בחר גוונים ייחודיים שמתאימים לעסק הספציפי — לא אוטומטיים.
- font_style: modern-sans | serif-elegant | handwritten-warm | bold-geometric | clean-sans

━━━ פרומפטים לתמונות ━━━
הפרומפטים באנגלית בלבד — לא עברית. כל פרומפט חייב להיות ספציפי למוצר/שירות שנסרק (לא generic).

מבנה של כל פרומפט:
[SCENE קונקרטי מהעסק] + [COMPOSITION] + [LIGHTING] + [CAMERA: 85mm f/1.4 / 35mm / etc.] + [COLOR PALETTE: include the brand hex colors] + [STYLE: professional marketing photo, editorial ad photography]

דוגמה לבית קפה:
"cozy Israeli specialty coffee shop interior, warm golden morning light spilling through large windows, wooden communal table with freshly pulled espresso and buttery croissant in the foreground, barista in background steaming milk with soft focus, rich amber and deep brown palette (#8b2f1d, #f4a261) with cream accents, shot on 85mm lens at f/1.4, shallow depth of field, editorial food photography, warm inviting mood, professional marketing campaign photo, no text"

דוגמה לאפליקציית פיננסים:
"minimal modern product photography of a sleek smartphone displaying a clean financial dashboard on a matte dark desk, cool blue and violet palette (#0a0f2c, #2e5bff) with crisp white type, soft studio lighting from the left, subtle glow around the screen, 50mm lens at f/2.8, shallow focus, premium tech editorial style, professional marketing ad, no text overlays"

החזר JSON בלבד (בלי markdown fences):
{
  "business_name": "שם העסק בעברית טבעית",
  "business_description": "משפט אחד מדויק — מה העסק עושה ולמה זה חשוב לקהל שלו",
  "brand_profile": {
    "category": "...",
    "tone": "...",
    "colors": { "primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": "#RRGGBB", "background": "#RRGGBB", "text": "#RRGGBB" },
    "font_style": "...",
    "audience": { "age": "25-40", "gender": "נשים / גברים / כולם", "interests": ["3-5 תחומי עניין"] },
    "core_message": "המסר המרכזי במשפט אחד",
    "differentiation": "מה מבדיל את העסק הזה מהמתחרים הישירים",
    "pain_solved": "הכאב הספציפי שהעסק פותר",
    "music_mood": "upbeat | calm | elegant | energetic | warm | tech-modern"
  },
  "persona": {
    "age_range": "25-40",
    "gender": "נשים / גברים / כולם",
    "pain_points": ["3 נקודות כאב ספציפיות לקהל"],
    "desires": ["3 רצונות/שאיפות ספציפיות"],
    "scroll_stoppers": ["3 רעיונות ויזואליים שעוצרים גלילה"],
    "objections": ["3 התנגדויות קנייה עיקריות"],
    "tone": "תיאור קול המותג האידיאלי לקהל הזה"
  },
  "image_prompts": {
    "facebook": "English prompt, 1200x628 landscape composition, scene specific to THIS business. Include brand hex colors.",
    "instagram": "English prompt, 1080x1080 square composition, instagram-native aesthetic, scroll-stopping. Include brand hex colors.",
    "linkedin": "English prompt, 1200x627 landscape, business-grade editorial photography. Include brand hex colors."
  }
}

JSON חוקי בלבד. בלי טקסט נוסף.`;
}

function buildCallBPrompt(inputContext: string, missingDataWarning: string) {
  return `נתח את העסק וכתוב 9 מודעות ודף נחיתה — כל מילה קונקרטית לעסק הזה, שפת קופי ישראלית אותנטית.

${inputContext}

${missingDataWarning}

━━━ 3 וריאציות לכל פלטפורמה ━━━
לכל פלטפורמה (facebook, instagram, linkedin) בדיוק 3 וריאציות:
1. "pain" — פותחת עם הכאב הלא-ממומש של הקהל
2. "curiosity" — פותחת פער ידע שמחייב לחיצה
3. "numbers" — פותחת עם נתון ספציפי ומפתיע (רק אם מופיע בקלט; אחרת — זווית אחרת שמרגישה קונקרטית)

דרישות איכות קשיחות:
- כותרת: עד 60 תווים, עוצרת גלילה אמיתית, לא קלישאה
- גוף: טבעי כמו חבר מדבר. בפייסבוק 3-5 משפטים סיפוריים. באינסטגרם 2-3 קצרים עם אימוג'י מדויקים. בלינקדאין תובנה מקצועית קצרה עם זווית מעניינת.
- CTA: הצעה טבעית, לא פקודה ("בואו נכיר" / "רוצה לטעום?" / "נשלח לכם דוגמה" / "בואו נדבר" — לא "לחצו עכשיו!")
- אינסטגרם: 3-6 האשטאגים רלוונטיים (שילוב עברית ואנגלית: #תלאביב #coffee_lover)
- לינקדאין: ללא אימוג'י מוגזמים, טון מקצועי ישראלי ("מה שלמדנו לאחרונה..." / "תובנה מהשטח...")

━━━ ציון איכות לכל וריאציה ━━━
דרג כל וריאציה (1-10): hook, clarity, cta, platform_fit, overall
אם overall < 7 — שכתב לפני החזרה. תחזיר רק איכות 7+.

━━━ דף נחיתה מלא (חייב להיות ברמת סוכנות Base44/Webflow) ━━━
- hero_eyebrow: טקסט קצר מעל הכותרת (עד 30 תווים), קונקרטי למה שהעסק נותן
- hero_headline: כותרת ענקית חזקה, עד 70 תווים, ספציפית לעסק
- hero_subheadline: 1-2 משפטים שמסבירים ערך ברור ומזיז
- primary_cta: פועל ברור (כמו "בואו נכיר" / "רוצים לטעום?")
- secondary_cta: טקסט פעולה משני ("איך זה עובד?" / "קראו עוד")
- social_proof_line: שורה שמגבה אמינות בלי להמציא (לדוגמה "העסק הקטן של שכונת פלורנטין" / "מאפייה משפחתית מאז הקמתה") — בלי להמציא מספרים/פרסים
- testimonial_quote: ציטוט קצר אותנטי-מרגיש (לא שקר ציוני) — אם אין בסיס לציטוט אמיתי, השתמש בהצהרת ערך בגוף ראשון כאילו מדבר בעל העסק ("אני מכין כל כיכר ביד בחמישה בבוקר")
- testimonial_attribution: שם העסק או "מבעל העסק" — בלי להמציא שמות לקוחות
- features: בדיוק 4 יתרונות קונקרטיים, כל אחד עם title (2-4 מילים) ו-description (משפט קצר)
- how_it_works: בדיוק 3 שלבים, כל אחד עם title (2-4 מילים) ו-description (משפט קצר) שמתארים איך הלקוח משיג את הערך
- final_cta_headline: כותרת לאזור ה-CTA התחתון, עד 60 תווים
- final_cta_subline: תת-כותרת ל-CTA התחתון, 1 משפט

החזר JSON בלבד (בלי markdown fences):
{
  "facebook": [
    { "hook_type": "pain", "headline": "...", "body": "...", "cta": "...", "scores": { "hook": 9, "clarity": 8, "cta": 8, "platform_fit": 9, "overall": 9 } },
    { "hook_type": "curiosity", "headline": "...", "body": "...", "cta": "...", "scores": { ... } },
    { "hook_type": "numbers", "headline": "...", "body": "...", "cta": "...", "scores": { ... } }
  ],
  "instagram": [ 3 וריאציות באותו מבנה ],
  "linkedin": [ 3 וריאציות באותו מבנה ],
  "landing_page": {
    "hero_eyebrow": "...",
    "hero_headline": "...",
    "hero_subheadline": "...",
    "primary_cta": "...",
    "secondary_cta": "...",
    "social_proof_line": "...",
    "testimonial_quote": "...",
    "testimonial_attribution": "...",
    "features": [
      { "title": "...", "description": "..." },
      { "title": "...", "description": "..." },
      { "title": "...", "description": "..." },
      { "title": "...", "description": "..." }
    ],
    "how_it_works": [
      { "title": "...", "description": "..." },
      { "title": "...", "description": "..." },
      { "title": "...", "description": "..." }
    ],
    "final_cta_headline": "...",
    "final_cta_subline": "...",
    "cta": "..."
  }
}

JSON חוקי בלבד. בלי טקסט נוסף.`;
}

function stripJsonFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return s;
}

async function callClaude(
  anthropic: Anthropic,
  system: string,
  user: string,
  maxTokens: number
): Promise<unknown> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Empty Claude response");
  }
  return JSON.parse(stripJsonFences(textBlock.text));
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

    // Run brand+persona+image_prompts and ads+landing_page in PARALLEL
    // to comfortably beat Vercel's 60s cap on paid plans and stay <120s.
    const [foundation, content] = await Promise.all([
      callClaude(
        anthropic,
        CALL_A_SYSTEM,
        buildCallAPrompt(inputContext, missingDataWarning),
        2500
      ) as Promise<{
        business_name: string;
        business_description: string;
        brand_profile: unknown;
        persona: unknown;
        image_prompts: unknown;
      }>,
      callClaude(
        anthropic,
        CALL_B_SYSTEM,
        buildCallBPrompt(inputContext, missingDataWarning),
        4500
      ) as Promise<{
        facebook: unknown;
        instagram: unknown;
        linkedin: unknown;
        landing_page: unknown;
      }>,
    ]);

    const campaign = {
      business_name: foundation.business_name,
      business_description: foundation.business_description,
      brand_profile: foundation.brand_profile,
      persona: foundation.persona,
      image_prompts: foundation.image_prompts,
      facebook: content.facebook,
      instagram: content.instagram,
      linkedin: content.linkedin,
      landing_page: content.landing_page,
    };

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
