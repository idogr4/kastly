import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaign_id");

  if (!campaignId) {
    return NextResponse.json(
      { error: "חסר מזהה קמפיין" },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, user_id, business_name")
    .eq("id", campaignId)
    .single();

  if (!campaign || campaign.user_id !== user.id) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const { data: leads, error } = await supabase
    .from("leads")
    .select("email, name, phone, note, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "שגיאה" }, { status: 500 });
  }

  const rows = leads || [];
  const header = ["email", "name", "phone", "note", "created_at"];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      header
        .map((h) => {
          const v = (r as Record<string, string | null>)[h] ?? "";
          const s = String(v).replace(/"/g, '""');
          return /[",\n]/.test(s) ? `"${s}"` : s;
        })
        .join(",")
    ),
  ].join("\n");

  const fileBase = (campaign.business_name || "campaign").replace(/[^a-zA-Z0-9\u0590-\u05FF_-]+/g, "_");

  return new NextResponse("\ufeff" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kastly-leads-${fileBase}.csv"`,
    },
  });
}
