import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { campaign_id, email, name, phone, note } = await request.json();

    if (!campaign_id || !email || typeof email !== "string") {
      return NextResponse.json(
        { error: "חסר מייל או מזהה קמפיין" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "כתובת מייל לא תקינה" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("leads").insert({
      campaign_id,
      email,
      name: name || null,
      phone: phone || null,
      note: note || null,
    });

    if (error) {
      // Unique violation = duplicate email for same campaign — treat as success
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      console.error("lead error", error);
      return NextResponse.json(
        { error: "השמירה נכשלה" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
