"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <Image src={images[0]} alt={title} fill className="object-cover" />
      </div>
    );
  }

  function showPrev() {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  function showNext() {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Desktop vertical thumbnail strip */}
      <div className="hidden w-20 flex-col gap-2 md:flex">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border",
              activeIndex === index && "ring-2 ring-primary"
            )}
          >
            <Image src={image} alt={title} fill className="object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-lg">
        <Image
          src={images[activeIndex]}
          alt={title}
          fill
          className="object-cover"
        />
        <button
          type="button"
          onClick={showPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={showNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile horizontal thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto md:hidden">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border",
              activeIndex === index && "ring-2 ring-primary"
            )}
          >
            <Image src={image} alt={title} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
