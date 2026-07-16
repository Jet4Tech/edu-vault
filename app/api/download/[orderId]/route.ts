import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, products(file_key)")
    .eq("id", params.orderId)
    .single();

  if (!order || order.status !== "paid") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data, error } = await adminClient.storage
    .from("products")
    .createSignedUrl(order.products.file_key, 900);

  if (error) {
    return NextResponse.json(
      { error: "Could not generate download link" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
