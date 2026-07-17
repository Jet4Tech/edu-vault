import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { RemoveButton } from "./remove-button";
import { CheckoutButton } from "./checkout-button";

const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
};

function formatPrice(price: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${price.toFixed(2)}`;
}

export default async function BasketPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirect=/basket");
  }

  const { data: basketItems } = await supabase
    .from("basket_items")
    .select("*, products(*, users:profiles(id, full_name:name, avatar_url))")
    .eq("user_id", user.id)
    .eq("products.status", "published");

  const { data: paidOrders } = await supabase
    .from("orders")
    .select("product_id")
    .eq("buyer_id", user.id)
    .eq("status", "paid");

  const paidProductIds = new Set((paidOrders ?? []).map((o) => o.product_id));

  const items = (basketItems ?? []).filter(
    (item) => item.products && !paidProductIds.has(item.product_id)
  );

  const totalsByCurrency: Record<string, number> = {};
  for (const item of items) {
    const currency = item.products.currency;
    totalsByCurrency[currency] = (totalsByCurrency[currency] ?? 0) + item.products.price;
  }

  const currencies = Object.keys(totalsByCurrency);
  const hasMultipleCurrencies = currencies.length > 1;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Your basket ({items.length} items)</h1>

      {items.length === 0 ? (
        <div className="mt-8">
          <p className="text-muted-foreground">Your basket is empty.</p>
          <Link href="/" className="mt-2 inline-block underline">
            Browse resources
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                  {item.products.preview_images?.[0] ? (
                    <Image
                      src={item.products.preview_images[0]}
                      alt={item.products.title}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium">{item.products.title}</p>
                  <p className="text-sm text-muted-foreground">
                    by {item.products.users.full_name}
                  </p>
                </div>

                <p className="font-medium">
                  {formatPrice(item.products.price, item.products.currency)}
                </p>

                <RemoveButton productId={item.product_id} />
              </div>
            ))}
          </div>

          <div className="md:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Subtotal</p>
                  <div className="text-right">
                    {currencies.map((currency) => (
                      <p key={currency} className="font-medium">
                        {formatPrice(totalsByCurrency[currency], currency)}
                      </p>
                    ))}
                  </div>
                </div>

                {hasMultipleCurrencies && (
                  <p className="mt-4 rounded bg-amber-100 p-3 text-sm text-amber-800">
                    Items in your basket use different currencies. You must have all items
                    in the same currency before checkout.
                  </p>
                )}

                <p className="mt-4 text-sm text-muted-foreground">
                  Note: a small platform fee applies at checkout
                </p>

                <div className="mt-4">
                  <CheckoutButton />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
