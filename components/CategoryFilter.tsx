import Link from "next/link";
import {
  BookOpen,
  FlaskConical,
  GraduationCap,
  Library,
  Palette,
  Puzzle,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { categories } from "@/lib/categories";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  BookOpen,
  Target,
  Library,
  Palette,
  Puzzle,
  Sparkles,
  FlaskConical,
};

export function CategoryFilter({ activeCategory }: { activeCategory?: string }) {
  const chipClass =
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors";

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:justify-center sm:overflow-visible">
      <Link
        href="/search"
        className={cn(
          chipClass,
          !activeCategory
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-card hover:border-primary/40 hover:bg-secondary"
        )}
      >
        All
      </Link>
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.icon];
        return (
          <Link
            key={category.slug}
            href={`/search?category=${category.slug}`}
            className={cn(
              chipClass,
              activeCategory === category.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card hover:border-primary/40 hover:bg-secondary"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
