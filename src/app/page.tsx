"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type InputMode = "url" | "text";

const ASSETS = [
  {
    emoji: "📝",
    title: "טקסטים שיווקיים",
    description:
      "3 וריאציות A/B לפייסבוק, אינסטגרם ולינקדאין — כל אחת עם כותרת, גוף ו-CTA, מדורגות לפי ציון איכות.",
  },
  {
    emoji: "🖼️",
    title: "תמונות שיווקיות",
    description:
      "תמונות AI מ-Flux Pro בגדלים המדויקים של כל רשת — 1200×628, 1080×1080, 1200×627.",
  },
  {
    emoji: "🎬",
    title: "סרטון פרסומת",
    description:
      "MP4 אנכי של 30 שניות עם קריינות AI בעברית, 4 סצנות, מוזיקה ואנימציות בצבעי הברנד.",
  },
  {
    emoji: "🌐",
    title: "דף נחיתה חי",
    description:
      "דף נחיתה עם URL ציבורי, טופס לכידת לידים, מעקב כניסות ולחיצות, וייצוא CSV.",
  },
  {
    emoji: "📱",
    title: "Stories לאינסטגרם",
    description:
      "5 שקפים של 1080×1920 שמספרים סיפור: פתיח, בעיה, פתרון, הוכחה, CTA.",
  },
  {
    emoji: "💬",
    title: "צ'אטבוט לשיפור",
    description:
      'בקשו בעברית — "תקצר", "פחות רשמי", "תחזק את ה-CTA" — והצ׳אטבוט עורך את הקמפיין בזמן אמת.',
  },
];

const STEPS = [
  {
    number: "01",
    title: "מדביקים URL או מתארים",
    description:
      "כתובת האתר שלכם, או תיאור חופשי של העסק. אין צורך בהכנה.",
  },
  {
    number: "02",
    title: "AI סורק ומבין לעומק",
    description:
      "הבינה המלאכותית סורקת את האתר, מחלצת פרופיל מותג, צבעים, קהל יעד וכאב.",
  },
  {
    number: "03",
    title: "כל הנכסים נוצרים",
    description:
      "טקסטים, תמונות, סרטון, דף נחיתה ו-Stories — הכול בעקביות עיצובית מלאה.",
  },
  {
    number: "04",
    title: "מורידים ומפרסמים",
    description:
      "מעתיקים טקסטים, מורידים תמונות וסרטון, משתפים את דף הנחיתה. מוכן להעלאה.",
  },
];

const PIPELINE_STEPS = [
  "סורק את האתר",
  "מחלץ פרופיל מותג",
  "כותב 9 מודעות",
  "מייצר 3 תמונות",
  "בונה 5 שקפי Story",
  "מרנדר סרטון 30 שניות",
  "מפרסם דף נחיתה",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const router = useRouter();

  function handleGenerate() {
    if (inputMode === "url") {
      if (!url.trim()) return;
      router.push(`/campaign/preview?url=${encodeURIComponent(url.trim())}`);
    } else {
      if (!description.trim()) return;
      router.push(
        `/campaign/preview?description=${encodeURIComponent(description.trim())}`
      );
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ─── NAV ─── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Kastly</span>
          </a>

          <div className="hidden items-center gap-6 text-sm text-muted sm:flex">
            <a href="/gallery" className="transition-colors hover:text-foreground">
              גלריה
            </a>
            <a href="/pricing" className="transition-colors hover:text-foreground">
              מחירים
            </a>
            <a href="/about" className="transition-colors hover:text-foreground">
              אודות
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleGoogleSignIn}
              className="hidden rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground sm:block"
            >
              התחברות
            </button>
            <button
              onClick={handleGoogleSignIn}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm transition-all hover:opacity-90"
            >
              התחלה
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-primary/5 via-accent/5 to-transparent" />

          <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 sm:py-28">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              שיווק מלא ב-AI, בעברית
            </div>

            <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              בנית עסק מדהים.
              <br />
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                אף אחד לא יודע שאתה קיים.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
              Kastly הופכת את האתר שלך לחבילת שיווק מלאה — טקסטים, תמונות,
              סרטון, Stories ודף נחיתה — בלחיצה אחת, בעברית.
            </p>

            {/* ─── INPUT ─── */}
            <div className="mx-auto mt-10 max-w-xl">
              <div className="mb-3 inline-flex rounded-xl border border-border bg-surface p-1 text-sm">
                <button
                  onClick={() => setInputMode("url")}
                  className={`rounded-lg px-4 py-1.5 font-medium transition-all ${
                    inputMode === "url"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  קישור לאתר
                </button>
                <button
                  onClick={() => setInputMode("text")}
                  className={`rounded-lg px-4 py-1.5 font-medium transition-all ${
                    inputMode === "text"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  תיאור חופשי
                </button>
              </div>

              {inputMode === "url" ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleGenerate();
                    }}
                    placeholder="https://העסק-שלכם.co.il"
                    dir="ltr"
                    className="flex-1 rounded-xl border border-border bg-surface px-4 py-3.5 text-right text-foreground placeholder:text-muted/50 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!url.trim()}
                    className="whitespace-nowrap rounded-xl bg-primary px-6 py-3.5 font-medium text-white shadow-md transition-all hover:bg-primary-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    בנו לי קמפיין
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="למשל: מאפייה משפחתית במרכז תל אביב, עובדת עם קמחים אורגניים ולחמים לחמים קלאסיים. יש גם קפה ופינת ישיבה קטנה."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3.5 text-foreground placeholder:text-muted/50 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!description.trim()}
                    className="w-full rounded-xl bg-primary px-6 py-3.5 font-medium text-white shadow-md transition-all hover:bg-primary-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    בנו לי קמפיין
                  </button>
                </div>
              )}

              <p className="mt-3 text-xs text-muted/70">
                קמפיין ראשון בחינם. בלי אשראי, בלי התחייבות.
              </p>
            </div>

            {/* ─── PROGRESS ANIMATION ─── */}
            <div
              aria-hidden
              className="mx-auto mt-12 max-w-xl rounded-2xl border border-border bg-surface/60 p-4 text-right shadow-sm backdrop-blur"
            >
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted">
                <span>מה קורה אחרי שמדביקים URL</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                </span>
              </div>
              <ul className="space-y-2">
                {PIPELINE_STEPS.map((step) => (
                  <li
                    key={step}
                    className="pipeline-step flex items-center gap-3 text-sm text-foreground"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-muted">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ─── ASSETS GRID ─── */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                מה תקבלו בכל קמפיין
              </h2>
              <p className="mt-4 text-muted">
                לא עוד "פוסט" או "באנר". חבילת שיווק מלאה — הכול ברמת פריסה,
                לא סקיצה.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ASSETS.map((asset) => (
                <div
                  key={asset.title}
                  className="group rounded-2xl border border-border bg-background p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-xl">
                    {asset.emoji}
                  </div>
                  <h3 className="text-base font-semibold">{asset.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {asset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PROCESS ─── */}
        <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ארבעה צעדים, שש דקות
            </h2>
            <p className="mt-4 text-muted">
              אותו תהליך שהיה לוקח שבועות עם סוכנות — קורה אוטומטית.
            </p>
          </div>

          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li
                key={step.number}
                className="relative rounded-2xl border border-border bg-surface p-6"
              >
                <span className="font-mono text-xs font-bold text-primary">
                  {step.number}
                </span>
                <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ─── HONESTY NOTE ─── */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              בלי שקרים שיווקיים
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted">
              Kastly לא תמציא לכם סטטיסטיקות, לא תכתוב על פרסים שלא קיבלתם,
              ולא תכניס ציטוטים של לקוחות מדומים. אם חסר מידע באתר שלכם, ה-AI
              יכתוב טקסט חזק על הערך הכללי במקום למלא את החסר בבדיה.
            </p>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary-soft/40 to-transparent" />
          <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              מוכנים שהעולם ידע שאתם קיימים?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">
              קמפיין אחד בחינם. כל הנכסים, להורדה. בלי אשראי.
            </p>
            <button
              onClick={() => {
                document.querySelector("input[type=url], textarea")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
                const el = document.querySelector<HTMLElement>(
                  "input[type=url], textarea"
                );
                el?.focus();
              }}
              className="mt-8 rounded-xl bg-primary px-8 py-3.5 font-medium text-white shadow-md transition-all hover:bg-primary-hover hover:shadow-lg"
            >
              בנו לי קמפיין עכשיו
            </button>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <span className="text-[10px] font-bold text-white">K</span>
            </div>
            <span>Kastly © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/pricing" className="hover:text-foreground">
              מחירים
            </a>
            <a href="/gallery" className="hover:text-foreground">
              גלריה
            </a>
            <a href="/about" className="hover:text-foreground">
              אודות
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
