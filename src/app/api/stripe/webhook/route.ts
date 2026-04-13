import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

// Use service role client for webhook — no user session available
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getSubscriptionEnd(sub: Stripe.Subscription): string | null {
  // In newer Stripe APIs, current_period_end may be on items
  const raw = (sub as unknown as Record<string, unknown>)["current_period_end"];
  if (typeof raw === "number") {
    return new Date(raw * 1000).toISOString();
  }
  // Fallback: try first item
  const item = sub.items?.data?.[0];
  if (item) {
    const itemRaw = (item as unknown as Record<string, unknown>)["current_period_end"];
    if (typeof itemRaw === "number") {
      return new Date(itemRaw * 1000).toISOString();
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const planId = session.metadata?.plan_id;

      if (!userId || !planId) break;

      const subscriptionId = session.subscription as string;
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = getSubscriptionEnd(sub);

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: planId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          status: "active",
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: existing } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (existing) {
        const status = sub.cancel_at_period_end
          ? "canceled"
          : sub.status === "active"
            ? "active"
            : "past_due";

        const periodEnd = getSubscriptionEnd(sub);

        await supabase
          .from("subscriptions")
          .update({
            status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", existing.user_id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "canceled",
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
