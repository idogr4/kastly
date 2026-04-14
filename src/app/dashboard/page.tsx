import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const PLAN_LABELS: Record<string, { name: string; color: string; limit: string }> = {
  free: { name: "חינם", color: "bg-gray-100 text-gray-700", limit: "קמפיין אחד (חד פעמי)" },
  basic: { name: "בסיסי", color: "bg-blue-100 text-blue-700", limit: "3 קמפיינים בחודש" },
  pro: { name: "פרו", color: "bg-purple-100 text-purple-700", limit: "7 קמפיינים בחודש" },
  business: { name: "עסקי", color: "bg-amber-100 text-amber-700", limit: "ללא הגבלה" },
};

const STATUS_LABELS: Record<string, string> = {
  ready: "מוכן",
  published: "פורסם",
  failed: "נכשל",
  draft: "טיוטה",
  processing: "בעיבוד",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [campaignsResult, subscriptionResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .single(),
  ]);

  const campaigns = campaignsResult.data;
  const subscription = subscriptionResult.data;
  const plan = subscription?.plan ?? "free";
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlyCount =
    campaigns?.filter((c) => c.created_at >= monthStart).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-xl font-semibold text-foreground tracking-tight">
            Kastly
          </span>
        </a>
        <div className="flex items-center gap-4">
          <a
            href="/gallery"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            גלריה
          </a>
          <div className="flex items-center gap-3">
            {user.user_metadata.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-foreground">
              {user.user_metadata.full_name || user.email}
            </span>
          </div>
          <SignOutButton />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-border bg-surface p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  החבילה שלך
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${planInfo.color}`}
                >
                  {planInfo.name}
                </span>
              </div>
              <p className="text-sm text-muted">{planInfo.limit}</p>
              {plan !== "free" && plan !== "business" && (
                <p className="text-sm text-muted">
                  ניצול החודש:{" "}
                  <span className="font-medium text-foreground">
                    {monthlyCount}
                  </span>{" "}
                  /{" "}
                  {plan === "basic" ? 3 : plan === "pro" ? 7 : "?"}
                </p>
              )}
              {plan === "business" && (
                <p className="text-sm text-muted">
                  קמפיינים החודש:{" "}
                  <span className="font-medium text-foreground">
                    {monthlyCount}
                  </span>
                </p>
              )}
              {subscription?.current_period_end && (
                <p className="text-xs text-muted/60">
                  מתחדש בתאריך{" "}
                  {new Date(
                    subscription.current_period_end
                  ).toLocaleDateString("he-IL")}
                </p>
              )}
            </div>
            {plan === "free" ? (
              <a
                href="/pricing"
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all shadow-md whitespace-nowrap"
              >
                שדרוג חבילה
              </a>
            ) : (
              <a
                href="/pricing"
                className="px-5 py-2.5 border border-border bg-surface text-foreground rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors whitespace-nowrap"
              >
                ניהול חבילה
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">הקמפיינים שלי</h1>
          <a
            href="/"
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            + קמפיין חדש
          </a>
        </div>

        {!campaigns || campaigns.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <p className="text-muted text-lg">עוד אין קמפיינים</p>
            <p className="text-muted/60 text-sm mt-1">
              צרו את הקמפיין הראשון שלכם על ידי הדבקת קישור לעסק
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-5 bg-surface border border-border rounded-xl hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    {campaign.preview_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={campaign.preview_image_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border"
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {campaign.business_name || campaign.source_url}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {campaign.source_url && (
                          <p className="text-sm text-muted truncate" dir="ltr">
                            {campaign.source_url}
                          </p>
                        )}
                        {campaign.is_public && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-soft text-primary font-medium shrink-0">
                            פומבי
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ml-4 ${
                      campaign.status === "ready" ||
                      campaign.status === "published"
                        ? "bg-green-100 text-green-700"
                        : campaign.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {STATUS_LABELS[campaign.status] || campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
