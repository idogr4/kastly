import { NextRequest, NextResponse } from "next/server";
import { Paddle, EventName } from "@paddle/paddle-node-sdk";
import { createClient } from "@supabase/supabase-js";

function getPaddle() {
  return new Paddle(process.env.PADDLE_API_KEY!);
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Map Paddle price IDs to plan IDs
function getPlanFromPriceId(priceId: string): string {
  const mapping: Record<string, string> = {
    [process.env.PADDLE_PRICE_BASIC ?? ""]: "basic",
    [process.env.PADDLE_PRICE_PRO ?? ""]: "pro",
    [process.env.PADDLE_PRICE_BUSINESS ?? ""]: "business",
  };
  return mapping[priceId] ?? "free";
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("paddle-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const paddle = getPaddle();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(
      body,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    );
  } catch (err) {
    console.error("Paddle webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  switch (event.eventType) {
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionCreated: {
      const sub = event.data;
      const customData = sub.customData as Record<string, string> | null;
      const userId = customData?.supabase_user_id;

      if (!userId) {
        console.error("No supabase_user_id in subscription custom_data");
        break;
      }

      const priceId = sub.items?.[0]?.price?.id ?? "";
      const plan = getPlanFromPriceId(priceId);
      const periodEnd = sub.currentBillingPeriod?.endsAt ?? null;

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan,
          paddle_customer_id: sub.customerId,
          paddle_subscription_id: sub.id,
          status: "active",
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case EventName.SubscriptionUpdated: {
      const sub = event.data;
      const paddleCustomerId = sub.customerId;

      const { data: existing } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("paddle_customer_id", paddleCustomerId)
        .single();

      if (existing) {
        const priceId = sub.items?.[0]?.price?.id ?? "";
        const plan = getPlanFromPriceId(priceId);
        const periodEnd = sub.currentBillingPeriod?.endsAt ?? null;

        const status =
          sub.scheduledChange?.action === "cancel"
            ? "canceled"
            : sub.status === "active"
              ? "active"
              : "past_due";

        await supabase
          .from("subscriptions")
          .update({
            plan,
            status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", existing.user_id);
      }
      break;
    }

    case EventName.SubscriptionCanceled: {
      const sub = event.data;
      const paddleCustomerId = sub.customerId;

      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "canceled",
          paddle_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("paddle_customer_id", paddleCustomerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
