import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductGrid } from "@/components/ProductGrid";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function SellerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: seller, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !seller) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, users(id, full_name:name, avatar_url)")
    .eq("seller_id", params.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const memberSince = new Date(seller.created_at).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const productList = products ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:text-left">
        <Avatar className="size-24">
          {seller.avatar_url && <AvatarImage src={seller.avatar_url} alt={seller.name} />}
          <AvatarFallback className="text-xl">{getInitials(seller.name)}</AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-2xl font-bold">{seller.name}</h1>
          {seller.bio && <p className="mt-2 text-muted-foreground">{seller.bio}</p>}
          <p className="mt-2 text-sm text-muted-foreground">Member since {memberSince}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {productList.length} resources
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold">Resources by {seller.name}</h2>
        <div className="mt-6">
          <ProductGrid
            products={productList}
            emptyMessage="This seller hasn't published any resources yet."
          />
        </div>
      </div>
    </main>
  );
}
