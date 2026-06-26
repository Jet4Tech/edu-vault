import { NextResponse } from "next/server";
import { createProductSchema } from "@/lib/validators/product";
import { getCategoryBySlug } from "@/lib/categories";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE_BYTES = 524288000;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "video/mp4",
  "video/quicktime",
  "application/vnd.anki",
];

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, stripe_onboarding_complete")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller" || profile?.stripe_onboarding_complete !== true) {
    return NextResponse.json(
      { error: "Complete Stripe Connect onboarding before uploading products." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const input = parsed.data;

  if (input.file_size_bytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds the 500 MB limit." },
      { status: 422 }
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(input.file_type)) {
    return NextResponse.json(
      { error: "File type not supported." },
      { status: 422 }
    );
  }

  if (!getCategoryBySlug(input.category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 422 });
  }

  const { data: product, error: insertError } = await supabase
    .from("products")
    .insert({
      seller_id: user.id,
      status: "draft",
      title: input.title,
      description: input.description,
      price: input.price,
      currency: input.currency,
      category: input.category,
      subject_tags: input.subject_tags,
      file_key: input.file_key,
      file_size_bytes: input.file_size_bytes,
      file_type: input.file_type,
      preview_images: input.preview_images,
      whats_included: input.whats_included,
      preview_video_url: input.preview_video_url,
    })
    .select()
    .single();

  if (insertError || !product) {
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }

  const oldPath = input.file_key;
  const filename = oldPath.split("/").pop();
  const newPath = `${user.id}/${product.id}/${filename}`;

  const { error: moveError } = await adminClient.storage
    .from("products")
    .move(oldPath, newPath);

  if (moveError) {
    await supabase.from("products").delete().eq("id", product.id);
    return NextResponse.json({ error: "Failed to finalize file upload." }, { status: 500 });
  }

  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update({ file_key: newPath })
    .eq("id", product.id)
    .select()
    .single();

  if (updateError || !updatedProduct) {
    return NextResponse.json({ error: "Failed to finalize product." }, { status: 500 });
  }

  return NextResponse.json(updatedProduct, { status: 201 });
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  let query = supabase
    .from("products")
    .select("*, users(id, name, avatar_url)")
    .eq("status", "published");

  if (search) {
    query = query.textSearch("fts", search, { type: "websearch" });
  }

  if (category) {
    query = query.eq("category", category);
  }

  const offset = (page - 1) * limit;

  const { data: products, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }

  return NextResponse.json(products);
}
