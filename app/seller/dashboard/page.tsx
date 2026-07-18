import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { StartSellingButton } from "@/app/dashboard/start-selling-button";

export default async function SellerDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, stripe_account_id, stripe_onboarding_complete")
    .eq("id", user.id)
    .single();

  let onboardingComplete = profile?.stripe_onboarding_complete === true;

  // Sellers land here after Stripe Connect onboarding (it's the return_url).
  // account.updated for Express accounts only reaches Connect-scoped webhooks,
  // so check Stripe directly and sync our record when onboarding just finished.
  if (!onboardingComplete && profile?.stripe_account_id) {
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      if (account.charges_enabled && account.payouts_enabled) {
        await adminClient
          .from("users")
          .update({ stripe_onboarding_complete: true, role: "seller" })
          .eq("id", user.id);
        onboardingComplete = true;
      }
    } catch {
      // Stale/foreign account id (e.g. from a previous Stripe mode) — leave
      // the flow on "not connected" so the seller can restart onboarding.
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">
        Welcome, {profile?.name || user.email}
      </h1>

      <div className="mt-4">
        {onboardingComplete ? (
          <p className="text-green-600 dark:text-green-400">Your Stripe account is connected ✓</p>
        ) : (
          <div className="space-y-3">
            <p>Your Stripe account is not connected.</p>
            <StartSellingButton />
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link href="/seller/products" className="underline">
          Go to your products →
        </Link>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        (Stats will appear here once you have sales)
      </p>
    </div>
  );
}
