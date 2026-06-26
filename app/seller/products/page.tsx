import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublishToggleButton } from "./publish-toggle-button";
import { DeleteButton } from "./delete-button";

const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
};

function formatPrice(price: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${price.toFixed(2)}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SellerProductsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const count = products?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your products</h1>
          <p className="text-sm text-muted-foreground">{count} products</p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">Add new product</Link>
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {products?.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
              {product.preview_images?.[0] ? (
                <Image
                  src={product.preview_images[0]}
                  alt={product.title}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FileText className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{product.title}</p>
                <Badge
                  className={
                    product.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {product.status === "published" ? "Published" : "Draft"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatPrice(product.price, product.currency)} ·{" "}
                {formatDate(product.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/seller/products/${product.id}/edit`}>Edit</Link>
              </Button>
              <PublishToggleButton productId={product.id} status={product.status} />
              <DeleteButton productId={product.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
