import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = 12;
  const offset = (page - 1) * limit;

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select(
      "id, business_name, industry, source_url, preview_image_url, campaign_data, created_at"
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load gallery" },
      { status: 500 }
    );
  }

  // Get total count for pagination
  const { count } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true);

  return NextResponse.json({
    campaigns: campaigns ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
