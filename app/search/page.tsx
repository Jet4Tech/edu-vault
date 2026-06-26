import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const q = searchParams.q;
  const category = searchParams.category;

  const supabase = createClient();

  let query = supabase
    .from("products")
    .select("*, users(id, full_name:name, avatar_url)")
    .eq("status", "published");

  if (q) {
    query = query.textSearch("fts", q, { type: "websearch" });
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data: products } = await query
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto max-w-xl">
        <SearchBar defaultValue={q} category={category} />
      </div>
      <div className="mt-6">
        <CategoryFilter activeCategory={category} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {products?.length ?? 0} results{q ? ` for "${q}"` : ""}
      </p>

      <div className="mt-6">
        <ProductGrid
          products={products ?? []}
          emptyMessage="No resources found. Try a different search or category."
        />
      </div>
    </main>
  );
}
