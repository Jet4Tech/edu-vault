import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("[stripe/connect] NEXT_PUBLIC_APP_URL is not set");
      return NextResponse.json(
        { error: "Server is misconfigured. Please contact support." },
        { status: 500 }
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({ type: "express" });
      accountId = account.id;

      // adminClient: the payout columns are no longer self-writable, so a user
      // can't promote themselves to seller by updating their own row.
      await adminClient
        .from("users")
        .update({ stripe_account_id: accountId, stripe_onboarding_complete: false })
        .eq("id", user.id);
    }

    const linkParams = {
      refresh_url: `${appUrl}/seller/connect/refresh`,
      return_url: `${appUrl}/seller/dashboard`,
      type: "account_onboarding" as const,
    };

    let accountLink;
    try {
      accountLink = await stripe.accountLinks.create({ account: accountId, ...linkParams });
    } catch {
      // Stored account id is invalid for this Stripe mode (e.g. created in a
      // sandbox) — start over with a fresh account.
      const account = await stripe.accounts.create({ type: "express" });
      accountId = account.id;

      await adminClient
        .from("users")
        .update({ stripe_account_id: accountId, stripe_onboarding_complete: false })
        .eq("id", user.id);

      accountLink = await stripe.accountLinks.create({ account: accountId, ...linkParams });
    }

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    // Surface a useful message instead of an empty 500 body (which the client
    // can't parse as JSON). The most common cause is an incomplete Connect
    // platform profile in the Stripe dashboard.
    if (err instanceof Stripe.errors.StripeError) {
      console.error("[stripe/connect] Stripe error:", err.message);
      const needsPlatformSetup = err.message.includes(
        "responsibilities of managing losses"
      );
      return NextResponse.json(
        {
          error: needsPlatformSetup
            ? "Your Stripe Connect platform setup isn't finished yet. The site owner needs to complete the Connect platform profile in the Stripe dashboard before sellers can onboard."
            : err.message,
        },
        { status: 400 }
      );
    }

    console.error("[stripe/connect] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong starting Stripe onboarding. Please try again." },
      { status: 500 }
    );
  }
}
