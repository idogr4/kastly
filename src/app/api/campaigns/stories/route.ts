import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

interface Persona {
  age_range?: string;
  gender?: string;
  pain_points?: string[];
  desires?: string[];
  tone?: string;
}

interface BrandProfile {
  category?: string;
  tone?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  core_message?: string;
  differentiation?: string;
  pain_solved?: string;
}

interface StoriesRequest {
  business_name: string;
  business_description?: string;
  persona?: Persona;
  brand_profile?: BrandProfile;
}

const SYSTEM_PROMPT = `אתה אמן סטוריטלינג לאינסטגרם — מתמחה ב-Stories שעוצרים גלילה ומובילים לפעולה. אתה כותב בעברית ישירה וחמה, מותאמת לקהל ישראלי.

כל סט של 5 שקפים חייב לספר סיפור אחד רציף:
- שקף 1 (hook): שאלה או משפט קצר שפותח לולאת סקרנות
- שקף 2 (problem): הכאב של הקהל
- שקף 3 (solution): העסק כפתרון
- שקף 4 (proof): הוכחה / תוצאה / ערך קונקרטי
- שקף 5 (cta): קריאה לפעולה עם "החליקו למעלה"

כללי ברזל:
- טקסטים קצרים (מסך 1080×1920) — כל title עד 6 מילים, body עד 15 מילים
- בלי המצאות — לא מספרים, לא ציטוטים, לא פרסים שלא הוזכרו
- רק אמת שמבוססת על פרטי העסק שקיבלת
- CTA בשקף האחרון חייב להיות פועל ברור בעברית + הצעה להחליק למעלה`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StoriesRequest;
    const { business_name, business_description, persona, brand_profile } = body;

    if (!business_name) {
      return NextResponse.json(
        { error: "חסר שם העסק" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const brandColors = brand_profile?.colors
      ? `צבעי ברנד: primary ${brand_profile.colors.primary || ""}, secondary ${brand_profile.colors.secondary || ""}, accent ${brand_profile.colors.accent || ""}`
      : "";

    const userPrompt = `צור 5 שקפי Stories לאינסטגרם לעסק הבא:

שם: ${business_name}
${business_description ? `תיאור: ${business_description}` : ""}
${brand_profile?.core_message ? `מסר מרכזי: ${brand_profile.core_message}` : ""}
${brand_profile?.pain_solved ? `כאב שהעסק פותר: ${brand_profile.pain_solved}` : ""}
${brand_profile?.differentiation ? `ייחוד: ${brand_profile.differentiation}` : ""}
${brand_profile?.category ? `קטגוריה: ${brand_profile.category}` : ""}
${brand_profile?.tone ? `טון: ${brand_profile.tone}` : ""}
${brandColors}

${persona?.age_range ? `קהל: גילאי ${persona.age_range}${persona.gender ? `, ${persona.gender}` : ""}` : ""}
${persona?.pain_points?.length ? `נקודות כאב: ${persona.pain_points.slice(0, 2).join(" / ")}` : ""}
${persona?.desires?.length ? `רצונות: ${persona.desires.slice(0, 2).join(" / ")}` : ""}
${persona?.tone ? `קול המותג: ${persona.tone}` : ""}

החזר JSON חוקי במבנה המדויק הזה (בלי markdown fences):
{
  "stories": [
    {
      "slide": 1,
      "role": "hook",
      "title": "כותרת קצרה (עד 6 מילים)",
      "body": "משפט קצר (עד 15 מילים)",
      "cta": "טקסט קצר לסטיקר (2-4 מילים)",
      "background_style": "תיאור קצר של הרקע המומלץ בצבעי הברנד",
      "visual_prompt": "image-generation prompt באנגלית לתמונה 1080x1920 כולל hex colors של הברנד, בלי טקסט על התמונה"
    },
    { "slide": 2, "role": "problem", ... },
    { "slide": 3, "role": "solution", ... },
    { "slide": 4, "role": "proof", ... },
    { "slide": 5, "role": "cta", ... }
  ]
}

דרישות:
- בדיוק 5 שקפים בנרטיב hook → problem → solution → proof → cta
- כל שקף חייב title, body, cta, background_style, visual_prompt
- השקף האחרון (cta) חייב "החליקו למעלה" או "swipe up" במשפט ה-body
- הטקסטים בעברית, ה-visual_prompt באנגלית
- בלי להמציא מספרים/טסטימוניאלים`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "לא הצלחנו לייצר Stories" },
        { status: 500 }
      );
    }

    let raw = textBlock.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(raw);
    const stories = parsed.stories || parsed;

    if (!Array.isArray(stories) || stories.length === 0) {
      return NextResponse.json(
        { error: "פורמט Stories לא תקין" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stories });
  } catch (error) {
    console.error("Stories generation error:", error);
    return NextResponse.json(
      { error: "משהו השתבש ב-Stories. נסו שוב." },
      { status: 500 }
    );
  }
}
