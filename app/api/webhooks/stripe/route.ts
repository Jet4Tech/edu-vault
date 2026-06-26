import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 400 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const isComplete = account.charges_enabled && account.payouts_enabled;

    const updateObject: { stripe_onboarding_complete: boolean; role?: string } = {
      stripe_onboarding_complete: isComplete,
    };

    if (isComplete) {
      updateObject.role = "seller";
    }

    await adminClient
      .from("users")
      .update(updateObject)
      .eq("stripe_account_id", account.id);
  }

  return NextResponse.json({ received: true });
}
