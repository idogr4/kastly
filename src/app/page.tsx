"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const FEATURES = [
  {
    label: "טקסטים למודעות",
    description: "כותרות, גוף וקריאה לפעולה",
    color: "bg-primary-soft text-primary",
  },
  {
    label: "3 וריאציות A/B",
    description: "לכל פלטפורמה",
    color: "bg-accent-soft text-accent",
  },
  {
    label: "פרסונת קהל יעד",
    description: "ניתוח עמוק של הלקוח",
    color: "bg-success-soft text-success",
  },
  {
    label: "ציוני איכות",
    description: "דירוג AI לכל מודעה",
    color: "bg-primary-soft text-primary",
  },
];

const PLATFORMS = [
  { label: "פייסבוק" },
  { label: "אינסטגרם" },
  { label: "לינקדאין" },
];

type InputMode = "url" | "text";

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
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Kastly
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/gallery"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            גלריה
          </a>
          <a
            href="/pricing"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            מחירים
          </a>
          <a
            href="/about"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            אודות
          </a>
          <button
            onClick={handleGoogleSignIn}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            התחברות
          </button>
          <button
            onClick={handleGoogleSignIn}
            className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            יאללה, מתחילים
          </button>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-16 px-6">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/5 via-accent/5 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success-soft border border-success/20 text-sm text-success">
              <span className="flex -space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-success-soft bg-gradient-to-br from-primary to-accent inline-block"
                  />
                ))}
              </span>
              <span className="font-medium">יותר מ-200 עסקים ישראלים כבר איתנו</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
                {inputMode === "url" ? (
                  <>
                    הדביקו קישור.
                    <br />
                  </>
                ) : (
                  <>
                    ספרו על העסק.
                    <br />
                  </>
                )}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  קבלו קמפיין מלא.
                </span>
              </h1>
              <p className="text-lg text-muted max-w-md mx-auto leading-relaxed">
                Kastly סורקת לעומק את המותג שלכם ובונה קמפיין מקצועי עם
                וריאציות A/B, פרסונה של קהל יעד וציוני איכות — לכל הערוצים,
                בעברית.
              </p>
            </div>

            <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-surface border border-border w-fit mx-auto">
              <button
                onClick={() => setInputMode("url")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "url"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                קישור לאתר
              </button>
              <button
                onClick={() => setInputMode("text")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "text"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                תיאור בטקסט חופשי
              </button>
            </div>

            {inputMode === "url" ? (
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://העסק-שלכם.co.il"
                  dir="ltr"
                  className="flex-1 px-4 py-3.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm text-right"
                />
                <button
                  onClick={handleGenerate}
                  className="px-6 py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  בנו לי קמפיין
                </button>
              </div>
            ) : (
              <div className="max-w-lg mx-auto space-y-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="לדוגמה: אני מאמנת כושר בתל אביב, עובדת עם נשים אחרי לידה. מציעה אימונים אישיים ותוכניות אונליין לשיקום הליבה וחזרה לביטחון עצמי."
                  rows={4}
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm resize-none"
                />
                <button
                  onClick={handleGenerate}
                  className="w-full px-6 py-3.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all shadow-md hover:shadow-lg"
                >
                  בנו לי קמפיין
                </button>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {FEATURES.map((f) => (
                <span
                  key={f.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full font-medium ${f.color}`}
                >
                  <span>{f.label}</span>
                  <span className="text-xs opacity-60">— {f.description}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted">
              <span>פרסום ב-</span>
              <div className="flex gap-2">
                {PLATFORMS.map((p) => (
                  <span
                    key={p.label}
                    className="px-2.5 py-1 rounded-md bg-surface border border-border text-xs font-medium text-foreground"
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6 bg-surface border-y border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-4">
              איך זה עובד
            </h2>
            <p className="text-center text-muted mb-14 max-w-md mx-auto">
              שלושה שלבים. קלט אחד. קמפיין שיווקי מלא — לייב בכל הערוצים.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "מדביקים קישור או מתארים",
                  description:
                    "הדביקו את כתובת האתר או תארו את העסק בטקסט חופשי. Kastly סורקת לעומק כמה עמודים — ראשי, אודות, מוצרים, המלצות.",
                  gradient: "from-primary to-primary",
                },
                {
                  step: "2",
                  title: "ה-AI בונה מודעות מנצחות",
                  description:
                    "ניתוח פרסונה, 3 וריאציות A/B לכל פלטפורמה (כאב, סקרנות, מספרים), וציוני איכות לפני שמוציאים החוצה.",
                  gradient: "from-primary to-accent",
                },
                {
                  step: "3",
                  title: "מפרסמים בכל הערוצים",
                  description:
                    "בלחיצה אחת — שולחים את הוריאציה המנצחת לפייסבוק, אינסטגרם ולינקדאין. או לכל שלושתם ביחד.",
                  gradient: "from-accent to-accent",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative text-center group"
                >
                  <div
                    className={`w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform font-bold text-xl`}
                  >
                    {item.step}
                  </div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                    שלב {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground mt-1 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Example output */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-4">
              מה Kastly יוצרת
            </h2>
            <p className="text-center text-muted mb-14 max-w-md mx-auto">
              דוגמה אמיתית מקישור אחד — פרסונה, וריאציות A/B, ציוני איכות.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Ad Copy Card */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-foreground">3 וריאציות מודעה</span>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    { hook: "וריאציית כאב", text: "הקפה שלך נטחן לפני 4 חודשים" },
                    { hook: "וריאציית סקרנות", text: "למה ברמן מריח את השקית לפני הכול?" },
                    { hook: "וריאציית מספרים", text: "2,847 ישראלים ויתרו על בית קפה החודש" },
                  ].map((v, i) => (
                    <div key={v.hook} className="p-3 rounded-lg bg-background">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs uppercase tracking-wide text-muted">{v.hook}</p>
                        <span className="text-[10px] font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded">{9 - i}/10</span>
                      </div>
                      <p className="text-foreground font-semibold text-sm">
                        {v.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Persona Card */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-foreground">פרסונת יעד</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">טווח גילאים</p>
                    <p className="text-foreground font-medium">28–42</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">נקודת כאב עיקרית</p>
                    <p className="text-foreground font-medium">קפה בסופר שאיבד את הטעם</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-xs uppercase tracking-wide text-muted mb-1">עוצר גלילה</p>
                    <p className="text-foreground font-medium">השוואה צד-לצד של טריות</p>
                  </div>
                </div>
              </div>

              {/* Score Card */}
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-foreground">ציוני איכות</span>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "עוצמת הוק", score: 9 },
                    { label: "בהירות מסר", score: 9 },
                    { label: "אפקטיביות CTA", score: 8 },
                    { label: "התאמה לפלטפורמה", score: 9 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-background">
                      <span className="text-muted">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                            style={{ width: `${item.score * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{item.score}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-primary-soft/50 to-background">
          <div className="max-w-lg mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              מוכנים להריץ את הקמפיין הבא?
            </h2>
            <p className="text-muted">
              הצטרפו ל-200+ עסקים ישראלים שעושים שיווק חכם יותר עם Kastly.
              מתחילים בחינם — בלי אשראי.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="inline-flex items-center gap-3 px-6 py-3.5 bg-surface border border-border rounded-xl hover:bg-surface-hover transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-medium text-foreground">
                התחברות עם Google
              </span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted border-t border-border">
        Kastly &copy; {new Date().getFullYear()} — נבנה בישראל באהבה
      </footer>
    </div>
  );
}
