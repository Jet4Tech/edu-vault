import Link from "next/link";
import { categories } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryFilter({ activeCategory }: { activeCategory?: string }) {
  const chipClass =
    "rounded-full px-3 py-1 text-sm whitespace-nowrap border";

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <Link
        href="/search"
        className={cn(
          chipClass,
          !activeCategory
            ? "bg-primary text-primary-foreground border-primary"
            : "border-input"
        )}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/search?category=${category.slug}`}
          className={cn(
            chipClass,
            activeCategory === category.slug
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input"
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
