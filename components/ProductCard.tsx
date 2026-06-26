import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryBySlug } from "@/lib/categories";

const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
};

function formatPrice(price: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${price.toFixed(2)}`;
}

type Product = {
  id: string;
  title: string;
  price: number;
  currency: string;
  preview_images: string[];
  category: string;
  users: { id: string; full_name: string };
};

export function ProductCard({ product }: { product: Product }) {
  const category = getCategoryBySlug(product.category);

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="overflow-hidden transition hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          {product.preview_images?.[0] ? (
            <Image
              src={product.preview_images[0]}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="line-clamp-2 font-medium">{product.title}</p>
          <p className="mt-1 font-semibold">
            {formatPrice(product.price, product.currency)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            by {product.users.full_name}
          </p>
          {category && (
            <Badge variant="secondary" className="mt-2">
              {category.name}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
