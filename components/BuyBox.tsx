"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
};

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/zip": "ZIP",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word document",
  "text/plain": "Text file",
  "video/mp4": "MP4 video",
  "video/quicktime": "MOV video",
  "application/vnd.anki": "Anki deck",
};

function formatPrice(price: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${price.toFixed(2)}`;
}

function formatFileType(mimeType: string) {
  return MIME_LABELS[mimeType] ?? mimeType;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type Product = {
  id: string;
  title: string;
  price: number;
  currency: string;
  file_type: string;
  file_size_bytes: number;
  users: { id: string; full_name: string };
};

function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="pb-3 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function BuyBox({
  product,
  currentUserId,
  alreadyOwns,
}: {
  product: Product;
  currentUserId: string | null;
  alreadyOwns: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddToBasket() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/basket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to add to basket.");
        setLoading(false);
        return;
      }

      window.dispatchEvent(new CustomEvent("basket-updated"));
      setAdded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="sticky top-4">
      <CardContent className="p-6">
        <p className="text-3xl font-bold">{formatPrice(product.price, product.currency)}</p>
        <p className="mt-1 text-sm">{product.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sold by{" "}
          <Link href={`/seller/${product.users.id}`} className="underline">
            {product.users.full_name}
          </Link>
        </p>

        <div className="mt-4">
          {alreadyOwns ? (
            <div className="space-y-2">
              <Badge className="bg-green-100 text-green-800">You own this ✓</Badge>
              <Link href="/library" className="block text-sm underline">
                View in your library →
              </Link>
            </div>
          ) : currentUserId === null ? (
            <Button asChild className="w-full">
              <Link href="/sign-in">Add to basket</Link>
            </Button>
          ) : added ? (
            <p className="text-center text-sm text-green-700">Added to basket!</p>
          ) : (
            <Button onClick={handleAddToBasket} disabled={loading} className="w-full">
              {loading ? "Adding..." : "Add to basket"}
            </Button>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-6">
          <CollapsibleSection title="Item details">
            <ul className="space-y-1">
              <li>Digital download</li>
              <li>{formatFileType(product.file_type)}</li>
              <li>{formatFileSize(product.file_size_bytes)}</li>
              <li>Instant access</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Delivery">
            Instant Download — Your files will be available once payment is confirmed
          </CollapsibleSection>

          <CollapsibleSection title="Copyright">
            This document and its content are copyright of {product.users.full_name}. All
            rights reserved.
          </CollapsibleSection>
        </div>
      </CardContent>
    </Card>
  );
}
