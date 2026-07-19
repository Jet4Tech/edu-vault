"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// Frame follows the image's own orientation, clamped so extreme
// panoramas / scans can't collapse or blow up the layout
const MIN_RATIO = 0.72; // slightly narrower than 3:4 portrait
const MAX_RATIO = 1.9; // slightly wider than 16:9 landscape
const DEFAULT_RATIO = 4 / 3;

export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [ratios, setRatios] = useState<Record<string, number>>({});

  function handleImageLoad(src: string, img: HTMLImageElement) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    setRatios((prev) => (prev[src] ? prev : { ...prev, [src]: ratio }));
  }

  function frameRatio(src: string): number {
    const ratio = ratios[src] ?? DEFAULT_RATIO;
    return Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No preview available</p>
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, images.length - 1);
  const activeImage = images[safeIndex];

  function showPrev() {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  function showNext() {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }

  const mainImage = (
    <div
      className="relative w-full overflow-hidden rounded-lg border bg-muted/50 transition-[aspect-ratio] duration-200"
      style={{ aspectRatio: frameRatio(activeImage) }}
    >
      <Image
        src={activeImage}
        alt={title}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-contain"
        // ref covers images already complete before hydration (browser cache),
        // where the load event fires too early for React's onLoad
        ref={(el) => {
          if (el?.complete) handleImageLoad(activeImage, el);
        }}
        onLoad={(e) => handleImageLoad(activeImage, e.currentTarget)}
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={showPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={showNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );

  if (images.length === 1) {
    return mainImage;
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
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/50",
              safeIndex === index && "ring-2 ring-primary"
            )}
          >
            <Image
              src={image}
              alt={title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="min-w-0 flex-1">{mainImage}</div>

      {/* Mobile horizontal thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto md:hidden">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/50",
              safeIndex === index && "ring-2 ring-primary"
            )}
          >
            <Image
              src={image}
              alt={title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
