"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useBasketCount } from "@/lib/hooks/useBasketCount";

export function BasketIcon() {
  const { count } = useBasketCount();

  return (
    <Link href="/basket" className="relative inline-flex">
      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
