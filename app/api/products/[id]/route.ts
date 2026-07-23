import { NextResponse } from "next/server";
import {
  formatMinPrice,
  isPriceAboveMinimum,
  updateProductSchema,
  type SupportedCurrency,
} from "@/lib/validators/product";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, users:profiles(id, name, avatar_url)")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (product.status === "draft" && product.seller_id !== user?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // A price edit can arrive without a currency, so resolve the effective
  // currency from the stored product before checking it against the floor.
  if (parsed.data.price !== undefined) {
    const { data: existing } = await supabase
      .from("products")
      .select("currency")
      .eq("id", params.id)
      .eq("seller_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const currency = (parsed.data.currency ??
      existing.currency) as SupportedCurrency;

    if (!isPriceAboveMinimum(parsed.data.price, currency)) {
      return NextResponse.json(
        { error: `Price must be at least ${formatMinPrice(currency)}.` },
        { status: 422 }
      );
    }
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .select()
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("file_key")
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Sold products can't be hard-deleted: buyers keep lifetime access to the
  // file, and the orders FK (ON DELETE RESTRICT) blocks the row anyway.
  const { count: paidOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", params.id)
    .eq("status", "paid");

  if (paidOrders && paidOrders > 0) {
    return NextResponse.json(
      {
        error:
          "This product has been purchased, so it can't be deleted — buyers keep access to their files. Unpublish it instead to remove it from the marketplace.",
      },
      { status: 409 }
    );
  }

  // Delete the row first; only remove the file once the row is really gone.
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", params.id)
    .eq("seller_id", user.id);

  if (deleteError) {
    console.error("Failed to delete product row:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete product. Please try again." },
      { status: 500 }
    );
  }

  const { error: storageError } = await adminClient.storage
    .from("products")
    .remove([product.file_key]);

  if (storageError) {
    console.error("Failed to delete product file from storage:", storageError);
  }

  return NextResponse.json({ success: true });
}
