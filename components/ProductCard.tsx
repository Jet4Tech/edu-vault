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
    <Link href={`/product/${product.id}`} className="group block">
      <Card className="overflow-hidden border transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {product.preview_images?.[0] ? (
            <Image
              src={product.preview_images[0]}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="line-clamp-2 font-medium leading-snug">{product.title}</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="text-lg font-bold text-primary">
              {formatPrice(product.price, product.currency)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              by {product.users.full_name}
            </p>
          </div>
          {category && (
            <Badge variant="secondary" className="mt-2.5">
              {category.name}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
