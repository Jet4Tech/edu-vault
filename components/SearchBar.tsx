"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({
  defaultValue,
  category,
}: {
  defaultValue?: string;
  category?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const params = new URLSearchParams();
    params.set("q", query);
    if (category) params.set("category", category);

    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      method="GET"
      action="/search"
      onSubmit={handleSubmit}
      className="flex w-full flex-row gap-2"
    >
      <Input
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for GCSE maths, flashcards, lesson plans..."
        className="flex-1"
      />
      <input type="hidden" name="category" value={category || ""} />
      <Button type="submit" size="icon">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
