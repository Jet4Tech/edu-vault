import { NextResponse } from "next/server";
import { updateProductSchema } from "@/lib/validators/product";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, users(id, name, avatar_url)")
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

  const { error: storageError } = await adminClient.storage
    .from("products")
    .remove([product.file_key]);

  if (storageError) {
    console.error("Failed to delete product file from storage:", storageError);
  }

  await supabase
    .from("products")
    .delete()
    .eq("id", params.id)
    .eq("seller_id", user.id);

  return NextResponse.json({ success: true });
}
