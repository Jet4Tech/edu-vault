import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProductGrid } from "@/components/ProductGrid";

export default async function Home() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, users:profiles(id, full_name:name, avatar_url)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto max-w-7xl px-4">
      <section className="py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Quality educational resources from real teachers
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Revision notes, worksheets, lesson plans, and more. Pay once, download forever.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <SearchBar />
        </div>
        <div className="mt-6">
          <CategoryFilter />
        </div>
      </section>

      <section className="pb-16">
        <h2 className="mb-6 text-2xl font-bold">Latest resources</h2>
        <ProductGrid
          products={products ?? []}
          emptyMessage="No resources yet. Check back soon!"
        />
      </section>
    </main>
  );
}
