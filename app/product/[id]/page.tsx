import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductGallery } from "@/components/ProductGallery";
import { BuyBox } from "@/components/BuyBox";
import { Reviews } from "@/components/Reviews";

function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  return match?.[1] ?? null;
}

async function getProduct(id: string) {
  const supabase = createClient();

  return supabase
    .from("products")
    .select("*, users:profiles(id, full_name:name, avatar_url, bio)")
    .eq("id", id)
    .single();
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data: product } = await getProduct(params.id);

  if (!product) {
    return {};
  }

  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: {
      images: product.preview_images?.[0] ? [product.preview_images[0]] : [],
    },
    alternates: {
      canonical: `/product/${params.id}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: product } = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (product.status !== "published" && product.seller_id !== user?.id) {
    notFound();
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, users:profiles(full_name:name, avatar_url)")
    .eq("product_id", params.id)
    .order("created_at", { ascending: false });

  let alreadyOwns = false;
  let userHasReviewed = false;

  if (user) {
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("product_id", params.id)
      .eq("status", "paid")
      .single();

    alreadyOwns = !!order;

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("product_id", params.id)
      .single();

    userHasReviewed = !!existingReview;
  }

  const reviewList = reviews ?? [];
  const averageRating =
    reviewList.length > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
      : 0;

  const whatsIncludedItems = product.whats_included
    ? product.whats_included.split("\n").filter((line: string) => line.trim())
    : [];

  const youtubeId = product.preview_video_url
    ? getYoutubeId(product.preview_video_url)
    : null;
  const vimeoId = !youtubeId && product.preview_video_url
    ? getVimeoId(product.preview_video_url)
    : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground underline">
        ← Back to browse
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-5">
        <div className="md:col-span-3">
          <ProductGallery images={product.preview_images ?? []} title={product.title} />
        </div>
        <div className="md:col-span-2">
          <BuyBox
            product={product}
            currentUserId={user?.id ?? null}
            alreadyOwns={alreadyOwns}
          />
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <section>
          <h2 className="text-2xl font-bold">About this resource</h2>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
            {product.description}
          </p>
        </section>

        {whatsIncludedItems.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold">What&apos;s included</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              {whatsIncludedItems.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {product.preview_video_url && (youtubeId || vimeoId) && (
          <section>
            <h2 className="text-2xl font-bold">Preview</h2>
            <iframe
              src={
                youtubeId
                  ? `https://www.youtube.com/embed/${youtubeId}`
                  : `https://player.vimeo.com/video/${vimeoId}`
              }
              className="mt-2 aspect-video w-full rounded-lg"
              allowFullScreen
            />
          </section>
        )}

        <Reviews
          productId={params.id}
          reviews={reviewList}
          averageRating={averageRating}
          currentUserId={user?.id ?? null}
          userOwnsProduct={alreadyOwns}
          userHasReviewed={userHasReviewed}
        />
      </div>
    </main>
  );
}
