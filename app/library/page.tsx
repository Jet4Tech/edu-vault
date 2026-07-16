import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DownloadButton } from "./download-button";

const CURRENCY_SYMBOLS: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
};

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/zip": "ZIP",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
  "video/mp4": "MP4",
  "video/quicktime": "MOV",
  "application/vnd.anki": "Anki",
};

function formatPrice(price: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${price.toFixed(2)}`;
}

function formatFileType(mimeType: string) {
  return MIME_LABELS[mimeType] ?? mimeType;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "*, products(id, title, price, currency, preview_images, file_type, file_size_bytes)"
    )
    .eq("buyer_id", user.id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  const orderList = orders ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Your library</h1>

      {searchParams.success === "1" && (
        <Alert variant="success" className="mt-4">
          <AlertDescription>
            Purchase complete! Your resources are ready to download below.
          </AlertDescription>
        </Alert>
      )}

      {orderList.length === 0 ? (
        <div className="mt-8">
          <p className="text-muted-foreground">You haven&apos;t bought anything yet.</p>
          <Link href="/" className="mt-2 inline-block underline">
            Browse resources
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {orderList.map((order) => (
            <Card key={order.id}>
              <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                {order.products.preview_images?.[0] ? (
                  <Image
                    src={order.products.preview_images[0]}
                    alt={order.products.title}
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
                <p className="line-clamp-2 font-medium">{order.products.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPrice(order.amount_paid, order.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Purchased {formatDate(order.created_at)}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {formatFileType(order.products.file_type)}
                </Badge>

                <div className="mt-4 space-y-2">
                  <DownloadButton orderId={order.id} />
                  <Link
                    href={`/product/${order.products.id}#reviews`}
                    className="block text-center text-sm underline"
                  >
                    Leave a review
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
