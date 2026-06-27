import { NextResponse } from "next/server";
import { addToBasketSchema, removeFromBasketSchema } from "@/lib/validators/basket";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: basketItems, error } = await supabase
    .from("basket_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .eq("products.status", "published");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch basket." }, { status: 500 });
  }

  const { data: paidOrders } = await supabase
    .from("orders")
    .select("product_id")
    .eq("buyer_id", user.id)
    .eq("status", "paid");

  const paidProductIds = new Set((paidOrders ?? []).map((o) => o.product_id));

  const filteredBasketItems = (basketItems ?? []).filter(
    (item) => !paidProductIds.has(item.product_id)
  );

  return NextResponse.json(filteredBasketItems);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = addToBasketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { product_id } = parsed.data;

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", product_id)
    .eq("status", "published")
    .single();

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("product_id", product_id)
    .eq("status", "paid")
    .single();

  if (existingOrder) {
    return NextResponse.json(
      { error: "You already own this product" },
      { status: 409 }
    );
  }

  const { data: basketItem, error: insertError } = await supabase
    .from("basket_items")
    .insert({ user_id: user.id, product_id })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This product is already in your basket" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to add to basket." }, { status: 500 });
  }

  return NextResponse.json(basketItem, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = removeFromBasketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  await supabase
    .from("basket_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", parsed.data.product_id);

  return NextResponse.json({ success: true });
}
