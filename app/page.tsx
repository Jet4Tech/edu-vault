import { Download, ShieldCheck, HeartHandshake } from "lucide-react";
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
    <main>
      <section className="border-b bg-gradient-to-b from-secondary/70 via-secondary/30 to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Quality educational resources from{" "}
            <span className="relative whitespace-nowrap">
              real teachers
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 rounded-sm bg-accent/70"
              />
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Revision notes, worksheets, lesson plans, and more. Pay once,
            download forever.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar />
          </div>

          <div className="mt-8">
            <CategoryFilter />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Download className="h-4 w-4 text-primary" /> Instant downloads
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Secure checkout
            </span>
            <span className="flex items-center gap-1.5">
              <HeartHandshake className="h-4 w-4 text-primary" /> 90% goes to
              teachers
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Latest resources</h2>
        <ProductGrid
          products={products ?? []}
          emptyMessage="No resources yet. Check back soon!"
        />
      </section>
    </main>
  );
}
