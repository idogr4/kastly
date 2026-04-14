import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `אתה עורך קמפיינים שיווקיים בכיר שעובד בעברית ישראלית. תפקידך: לשפר ולערוך קמפיינים קיימים לפי בקשות המשתמש.

כללים:
- מבין בקשות בעברית חופשית ("שנה את הטון לפחות רשמי", "תכתוב גרסה קצרה יותר", "תוסיף דחיפות", "תתאים לקהל נשים", "תכתוב מחדש את הכותרת של פייסבוק", וכו').
- עובד על האובייקט המלא של הקמפיין שמסופק, לא מייצר אותו מאפס.
- עורך רק את מה שהתבקשת לערוך. אל תיגע בשאר השדות.
- אם בקשה לא ברורה — בקש הבהרה קצרה, בלי לערוך כלום.
- הישאר ב-JSON מבני זהה לקלט (אותם שדות, אותו מבנה). אל תמציא שדות חדשים.
- אל תמציא עובדות שלא קיימות בקמפיין המקורי (שמות, מספרים, הישגים).
- כותב בעברית טבעית, ישירה וחמה — לא תרגומית.

פורמט תגובה: תמיד מחזיר JSON חוקי במבנה:
{
  "reply": "תגובה קצרה וחמה למשתמש בעברית — מה שיניתי ולמה, 1-3 משפטים.",
  "campaign": { ... הקמפיין המעודכן המלא במבנה זהה לקלט ... }
}

אם אין צורך בעריכה (המשתמש שאל שאלה בלבד או בקשה לא ברורה) — החזר את ה-campaign כמו שהוא בלי שינוי.

רק JSON. בלי markdown, בלי גדרים, בלי טקסט נוסף.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign, message, history } = body as {
      campaign: unknown;
      message: string;
      history?: ChatMessage[];
    };

    if (!campaign || !message || typeof message !== "string") {
      return NextResponse.json(
        { error: "חסר קמפיין או הודעה" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const convoHistory: ChatMessage[] = Array.isArray(history) ? history : [];

    const userContent = `הקמפיין הנוכחי (JSON):
${JSON.stringify(campaign, null, 2)}

בקשת המשתמש:
${message}

החזר JSON במבנה { "reply": "...", "campaign": { ... } }`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        ...convoHistory.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: "user" as const,
          content: userContent,
        },
      ],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "משהו השתבש בצ'אט. נסו שוב." },
        { status: 500 }
      );
    }

    let raw = textBlock.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(raw);

    return NextResponse.json({
      reply: parsed.reply ?? "",
      campaign: parsed.campaign ?? campaign,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "משהו השתבש. נסו שוב בעוד רגע." },
      { status: 500 }
    );
  }
}
