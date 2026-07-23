import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { adminClient } from "@/lib/supabase/admin";

type SnapshotItem = {
  product_id: string;
  seller_id: string;
  price: number;
  currency: string;
  file_key: string;
  title: string;
};

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

  try {
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

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const checkoutSessionId = paymentIntent.metadata?.checkout_session_id;

      if (!checkoutSessionId) {
        console.log("PaymentIntent not from EduVault, skipping");
        return NextResponse.json({ received: true });
      }

      const { data: checkoutSession } = await adminClient
        .from("checkout_sessions")
        .select("*")
        .eq("id", checkoutSessionId)
        .single();

      if (!checkoutSession) {
        return NextResponse.json({ received: true });
      }

      if (checkoutSession.status === "paid") {
        return NextResponse.json({ received: true });
      }

      const items = checkoutSession.basket_snapshot as SnapshotItem[];

      for (const item of items) {
        const { error: orderError } = await adminClient.from("orders").insert({
          buyer_id: checkoutSession.buyer_id,
          product_id: item.product_id,
          seller_id: item.seller_id,
          amount_paid: item.price,
          currency: item.currency,
          stripe_payment_intent: paymentIntent.id,
          status: "paid",
        });

        // 23505 = duplicate from a prior partial webhook attempt — safe to skip.
        // Any other failure must 500 so Stripe retries before we mark the
        // session paid and clear the basket.
        if (orderError && orderError.code !== "23505") {
          console.error("Order insert failed:", orderError);
          return NextResponse.json(
            { error: "Order insert failed" },
            { status: 500 }
          );
        }
      }

      const totalsBySeller = new Map<string, number>();
      for (const item of items) {
        totalsBySeller.set(
          item.seller_id,
          (totalsBySeller.get(item.seller_id) ?? 0) + item.price
        );
      }

      for (const [sellerId, sellerTotal] of Array.from(totalsBySeller)) {
        const { data: seller } = await adminClient
          .from("users")
          .select("stripe_account_id, stripe_onboarding_complete")
          .eq("id", sellerId)
          .single();

        if (!seller?.stripe_account_id || !seller?.stripe_onboarding_complete) {
          console.error("TRANSFER SKIPPED — seller not onboarded:", {
            seller_id: sellerId,
            checkout_session_id: checkoutSessionId,
          });
          continue;
        }

        const sellerAmountCents = Math.floor(sellerTotal * 100);
        const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT) || 10;
        const transferAmountCents = Math.floor(
          sellerAmountCents * (1 - platformFeePercent / 100)
        );

        await stripe.transfers.create(
          {
            amount: transferAmountCents,
            currency: checkoutSession.currency,
            destination: seller.stripe_account_id,
            transfer_group: `order_${checkoutSessionId}`,
            source_transaction: paymentIntent.latest_charge as string,
            metadata: { seller_id: sellerId, checkout_session_id: checkoutSessionId },
          },
          {
            // Guarantees one transfer per (session, seller) even if Stripe
            // redelivers this event or a retry runs after transfers were
            // created but before the session was marked paid. Without this,
            // a retry would pay every seller a second time.
            idempotencyKey: `transfer_${checkoutSessionId}_${sellerId}`,
          }
        );
      }

      await adminClient
        .from("checkout_sessions")
        .update({ status: "paid" })
        .eq("id", checkoutSessionId);

      await adminClient
        .from("basket_items")
        .delete()
        .eq("user_id", checkoutSession.buyer_id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
