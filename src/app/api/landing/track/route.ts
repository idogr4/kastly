import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { campaign_id, event_type } = await request.json();

    if (!campaign_id || !["view", "click"].includes(event_type)) {
      return NextResponse.json(
        { error: "invalid payload" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const referrer = request.headers.get("referer") || null;
    const userAgent = request.headers.get("user-agent") || null;

    const { error } = await supabase.from("landing_events").insert({
      campaign_id,
      event_type,
      referrer,
      user_agent: userAgent,
    });

    if (error) {
      console.error("track error", error);
      return NextResponse.json({ error: "failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
