import { NextResponse } from "next/server";
import { createReviewSchema } from "@/lib/validators/review";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { product_id, rating, body: reviewBody } = parsed.data;

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("product_id", product_id)
    .eq("status", "paid")
    .limit(1)
    .single();

  if (!order) {
    return NextResponse.json(
      { error: "You can only review products you have purchased." },
      { status: 403 }
    );
  }

  const { data: review, error: insertError } = await supabase
    .from("reviews")
    .insert({
      buyer_id: user.id,
      product_id,
      rating,
      body: reviewBody,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You have already reviewed this product." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to submit review." },
      { status: 500 }
    );
  }

  return NextResponse.json(review, { status: 201 });
}
