import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StartSellingButton } from "@/app/dashboard/start-selling-button";

export default async function SellerDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, stripe_onboarding_complete")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">
        Welcome, {profile?.name || user.email}
      </h1>

      <div className="mt-4">
        {profile?.stripe_onboarding_complete ? (
          <p className="text-green-600">Your Stripe account is connected ✓</p>
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
