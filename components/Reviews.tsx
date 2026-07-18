"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  users: { full_name: string; avatar_url: string | null } | null;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function Reviews({
  productId,
  reviews,
  averageRating,
  currentUserId,
  userOwnsProduct,
  userHasReviewed,
}: {
  productId: string;
  reviews: Review[];
  averageRating: number;
  currentUserId: string | null;
  userOwnsProduct: boolean;
  userHasReviewed: boolean;
}) {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    if (rating < 1) {
      setError("Please select a rating.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          rating,
          body: body || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to submit review.");
        setIsSubmitting(false);
        return;
      }

      setShowForm(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {reviews.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {averageRating.toFixed(1)} ★ ({reviews.length} reviews)
          </span>
        )}
      </div>

      {currentUserId && userOwnsProduct && !userHasReviewed && !showForm && (
        <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
          Leave a review
        </Button>
      )}

      {showForm && (
        <div className="mt-4 space-y-3 rounded-lg border p-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>

          <div>
            <Textarea
              placeholder="Share your thoughts about this resource (optional)"
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">{body.length}/1000</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit review"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first to review this resource.
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <StarDisplay rating={review.rating} />
              {review.body && <p className="mt-2 text-sm">{review.body}</p>}
              <p className="mt-2 text-sm text-muted-foreground">
                {review.users?.full_name ?? "Anonymous"} • {formatDate(review.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
