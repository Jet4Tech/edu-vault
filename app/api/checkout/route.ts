import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: items } = await supabase
    .from("basket_items")
    .select("*, products(*, users(id, stripe_account_id, stripe_onboarding_complete))")
    .eq("user_id", user.id);

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Your basket is empty" }, { status: 400 });
  }

  for (const item of items) {
    if (item.products.users.stripe_onboarding_complete !== true) {
      return NextResponse.json(
        {
          error:
            "One or more sellers are not ready to receive payments. Please remove the item and try again.",
        },
        { status: 400 }
      );
    }
  }

  const currencies = new Set(items.map((i) => i.products.currency));

  if (currencies.size > 1) {
    return NextResponse.json(
      {
        error:
          "All items in your basket must use the same currency. Please remove the conflicting item and try again.",
      },
      { status: 400 }
    );
  }

  const currency = Array.from(currencies)[0];

  const totalCents = items.reduce(
    (sum, item) => sum + Math.round(item.products.price * 100),
    0
  );
  const platformFeeCents = Math.floor(
    totalCents * (Number(process.env.PLATFORM_FEE_PERCENT) / 100)
  );

  const basketSnapshot = items.map((item) => ({
    product_id: item.product_id,
    seller_id: item.products.seller_id,
    price: item.products.price,
    currency: item.products.currency,
    file_key: item.products.file_key,
    title: item.products.title,
  }));

  const { data: checkoutSession } = await adminClient
    .from("checkout_sessions")
    .insert({
      buyer_id: user.id,
      basket_snapshot: basketSnapshot,
      total_amount_cents: totalCents,
      currency,
      status: "pending",
    })
    .select()
    .single();

  if (!checkoutSession) {
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/library?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/basket?canceled=1`,
      line_items: items.map((item) => ({
        price_data: {
          currency,
          product_data: { name: item.products.title },
          unit_amount: Math.round(item.products.price * 100),
        },
        quantity: 1,
      })),
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_group: `order_${checkoutSession.id}`,
        metadata: {
          checkout_session_id: checkoutSession.id,
          buyer_id: user.id,
        },
      },
    });

    await adminClient
      .from("checkout_sessions")
      .update({ stripe_session_id: session.id })
      .eq("id", checkoutSession.id);

    return NextResponse.json({ url: session.url });
  } catch {
    await adminClient.from("checkout_sessions").delete().eq("id", checkoutSession.id);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
