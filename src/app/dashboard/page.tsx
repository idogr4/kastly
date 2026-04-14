import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { CampaignRow } from "./campaign-row";

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

interface CampaignStats {
  views: number;
  clicks: number;
  leads: number;
}

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

  const campaigns = campaignsResult.data ?? [];
  const subscription = subscriptionResult.data;
  const plan = subscription?.plan ?? "free";
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlyCount = campaigns.filter((c) => c.created_at >= monthStart).length;

  // Fetch stats per campaign
  const campaignIds = campaigns.map((c) => c.id);
  const stats: Record<string, CampaignStats> = {};
  let totalViews = 0;
  let totalClicks = 0;
  let totalLeads = 0;

  if (campaignIds.length > 0) {
    const [viewsRes, clicksRes, leadsRes] = await Promise.all([
      supabase
        .from("landing_events")
        .select("campaign_id")
        .eq("event_type", "view")
        .in("campaign_id", campaignIds),
      supabase
        .from("landing_events")
        .select("campaign_id")
        .eq("event_type", "click")
        .in("campaign_id", campaignIds),
      supabase
        .from("leads")
        .select("campaign_id")
        .in("campaign_id", campaignIds),
    ]);

    for (const id of campaignIds) stats[id] = { views: 0, clicks: 0, leads: 0 };

    for (const row of viewsRes.data ?? []) {
      stats[row.campaign_id].views++;
      totalViews++;
    }
    for (const row of clicksRes.data ?? []) {
      stats[row.campaign_id].clicks++;
      totalClicks++;
    }
    for (const row of leadsRes.data ?? []) {
      stats[row.campaign_id].leads++;
      totalLeads++;
    }
  }

  const conversionRate =
    totalViews > 0 ? Math.round((totalLeads / totalViews) * 100) : 0;

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

      <main className="max-w-5xl mx-auto px-6 py-12">
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

        {/* Leads overview */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="כניסות לדפי נחיתה" value={totalViews} />
            <StatCard label="לחיצות" value={totalClicks} />
            <StatCard label="לידים שנאספו" value={totalLeads} />
            <StatCard
              label="אחוז המרה"
              value={`${conversionRate}%`}
              subtle={totalViews === 0 ? "אין עדיין כניסות" : undefined}
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">הקמפיינים שלי</h1>
          <a
            href="/"
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            + קמפיין חדש
          </a>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <p className="text-muted text-lg">עוד אין קמפיינים</p>
            <p className="text-muted/60 text-sm mt-1">
              צרו את הקמפיין הראשון שלכם על ידי הדבקת קישור לעסק
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((c) => (
              <CampaignRow
                key={c.id}
                id={c.id}
                businessName={c.business_name}
                sourceUrl={c.source_url}
                previewImageUrl={c.preview_image_url}
                isPublic={c.is_public}
                status={c.status}
                statusLabel={STATUS_LABELS[c.status] || c.status}
                stats={stats[c.id] || { views: 0, clicks: 0, leads: 0 }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtle,
}: {
  label: string;
  value: number | string;
  subtle?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {subtle && <p className="text-[11px] text-muted/60 mt-0.5">{subtle}</p>}
    </div>
  );
}
