export const metadata = {
  title: "אודות Kastly — שיווק AI בעברית",
  description:
    "Kastly היא פלטפורמה ישראלית לבניית קמפיינים שיווקיים מלאים עם בינה מלאכותית — בעברית, עם הבנה עמוקה של השוק המקומי.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Kastly
          </span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/gallery" className="text-sm text-muted hover:text-foreground transition-colors">
            גלריה
          </a>
          <a href="/pricing" className="text-sm text-muted hover:text-foreground transition-colors">
            מחירים
          </a>
          <a
            href="/"
            className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
          >
            יצירת קמפיין
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-14">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-foreground tracking-tight leading-tight">
            שיווק שבאמת מדבר
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              עברית
            </span>
          </h1>
          <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            Kastly נוצרה בישראל, עבור עסקים ישראלים. הפלטפורמה מייצרת קמפיינים
            שלמים — טקסטים, תמונות ודפי נחיתה — שמתאימים לקהל המקומי, לטון
            הישיר ולנורמות שלו.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-surface p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">הסיפור שלנו</h2>
          <p className="text-foreground leading-relaxed">
            רוב בעלי העסקים שאנחנו מכירים — מאמנות כושר, בעלי חנויות אונליין,
            מסעדות שכונתיות, סטארט-אפים — יודעים בדיוק מה הם מוכרים, אבל לא
            תמיד יודעים איך לכתוב על זה כמו שצריך. וכשהם מנסים כלים באנגלית,
            מקבלים טקסטים שנשמעים כמו תרגום.
          </p>
          <p className="text-foreground leading-relaxed">
            בנינו את Kastly כדי לפתור בדיוק את זה. הבינה המלאכותית שלנו כותבת
            בעברית חיה — לא מתורגמת, לא מלאכותית. מבינה את ההבדל בין מסר
            לאמא שמחפשת קורס לילדים בתל אביב, לבין יזם שמנסה לגייס בלינקדאין.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">בעברית אמיתית</h3>
            <p className="text-sm text-muted leading-relaxed">
              לא תרגום אוטומטי. הטקסטים נכתבים ישר בעברית, עם הטון והקצב שעובד
              על קהל ישראלי — ישיר, חם, מקצועי.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">מותאם לשוק</h3>
            <p className="text-sm text-muted leading-relaxed">
              דוגמאות וערכים שרלוונטיים לישראל. מחירים בשקלים. תאריכים בפורמט
              מקומי. אפילו CTA שמרגיש טבעי בעברית.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">בלי לסבן</h3>
            <p className="text-sm text-muted leading-relaxed">
              אם לא הצלחנו לסרוק את האתר — אומרים את זה. לא ממציאים מידע שלא
              קיים. כי שיווק שמבוסס על שקר לא עובד לטווח ארוך.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">פרטיות ושליטה</h3>
            <p className="text-sm text-muted leading-relaxed">
              הקמפיינים שלכם שייכים לכם. אתם מחליטים אם לשתף אותם בגלריה או
              לשמור אותם פרטיים. כל הנתונים מוצפנים.
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-8 text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">מוכנים להתחיל?</h2>
          <p className="text-muted max-w-md mx-auto">
            חבילת החינם מאפשרת לכם לייצר קמפיין אחד מלא — בלי אשראי, בלי התחייבות.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-3.5 bg-primary text-white rounded-xl font-medium shadow-md hover:bg-primary-hover transition-all"
          >
            בנו לי קמפיין עכשיו
          </a>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-muted border-t border-border mt-10">
        Kastly &copy; {new Date().getFullYear()} — נבנה בישראל באהבה
      </footer>
    </div>
  );
}
