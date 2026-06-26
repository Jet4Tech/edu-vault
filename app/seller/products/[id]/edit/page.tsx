import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProductForm } from "./edit-product-form";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .single();

  if (error || !product) {
    redirect("/seller/products");
  }

  return <EditProductForm product={product} />;
}
