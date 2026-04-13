import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const {
    campaign_data,
    source_url,
    is_public,
    industry,
    preview_image_url,
  } = await request.json();

  if (!campaign_data) {
    return NextResponse.json(
      { error: "Campaign data is required" },
      { status: 400 }
    );
  }

  try {
    // Get user plan
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = subscription?.plan ?? "free";

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        business_name: campaign_data.business_name ?? "Untitled",
        source_url: source_url ?? null,
        status: "ready",
        is_public: is_public ?? false,
        industry: industry ?? null,
        preview_image_url: preview_image_url ?? null,
        campaign_data,
        plan,
      })
      .select()
      .single();

    if (error) {
      console.error("Campaign save error:", error);
      return NextResponse.json(
        { error: "Failed to save campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaign: data });
  } catch (error) {
    console.error("Campaign save error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
