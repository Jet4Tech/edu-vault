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

  // Live mode uses two dashboard endpoints (account events + Connect events),
  // each with its own signing secret. Locally, `stripe listen` uses just one.
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
  ].filter((s): s is string => Boolean(s));

  let event: Stripe.Event | null = null;

  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature!, secret);
      break;
    } catch {
      // try the next secret
    }
  }

  if (!event) {
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
        .update({ status: "paid", stripe_payment_intent: paymentIntent.id })
        .eq("id", checkoutSessionId);

      await adminClient
        .from("basket_items")
        .delete()
        .eq("user_id", checkoutSession.buyer_id);
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentIntentId =
        typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : dispute.payment_intent?.id;

      if (!paymentIntentId) {
        return NextResponse.json({ received: true });
      }

      const { data: checkoutSession } = await adminClient
        .from("checkout_sessions")
        .select("id, total_amount_cents")
        .eq("stripe_payment_intent", paymentIntentId)
        .single();

      if (!checkoutSession) {
        return NextResponse.json({ received: true });
      }

      // Under separate charges and transfers, Stripe debits the disputed amount
      // from the platform balance while sellers keep the share already
      // transferred to them. Recovery is never automatic — without reversing
      // these transfers the platform absorbs the entire chargeback.
      const disputedFraction = Math.min(
        1,
        dispute.amount / checkoutSession.total_amount_cents
      );

      const transfers = await stripe.transfers.list({
        transfer_group: `order_${checkoutSession.id}`,
        limit: 100,
      });

      for (const transfer of transfers.data) {
        const target = Math.floor(transfer.amount * disputedFraction);
        const remaining = transfer.amount - transfer.amount_reversed;
        const amount = Math.min(target, remaining);

        if (amount <= 0) continue;

        await stripe.transfers.createReversal(
          transfer.id,
          {
            amount,
            metadata: {
              dispute_id: dispute.id,
              checkout_session_id: checkoutSession.id,
            },
          },
          {
            // Stripe redelivers events; without this a retry would claw back
            // the seller's share a second time.
            idempotencyKey: `reversal_${dispute.id}_${transfer.id}`,
          }
        );
      }

      // Only a full-amount dispute revokes access. A basket can span several
      // sellers, so a partial dispute can't be attributed to one product and
      // shouldn't strip the buyer of everything they paid for.
      if (disputedFraction >= 1) {
        await adminClient
          .from("orders")
          .update({ status: "disputed" })
          .eq("stripe_payment_intent", paymentIntentId);

        await adminClient
          .from("checkout_sessions")
          .update({ status: "disputed" })
          .eq("id", checkoutSession.id);
      }
    }

    if (event.type === "charge.dispute.closed") {
      const dispute = event.data.object as Stripe.Dispute;

      // Winning a dispute returns the funds to the platform, but the seller's
      // transfer stays reversed — they're left short until someone re-pays
      // them. Deliberately manual: re-transferring needs a judgement call on
      // whether the seller should be made whole.
      if (dispute.status === "won") {
        console.warn(
          "[stripe] Dispute won — seller transfers remain reversed and may need re-paying manually:",
          { dispute_id: dispute.id, payment_intent: dispute.payment_intent }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
