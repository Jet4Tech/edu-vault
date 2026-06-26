import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    await supabase
      .from("users")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/connect/refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
