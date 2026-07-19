"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { categories } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/ProductGallery";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_PREVIEW_IMAGES = 5;
const MAX_PREVIEW_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const MAIN_FILE_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  zip: "application/zip",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  mp4: "video/mp4",
  mov: "video/quicktime",
  apkg: "application/vnd.anki",
};

type PreviewImage = {
  file: File;
  objectUrl: string;
  uploading: boolean;
  url: string | null;
  error: string | null;
};

export default function NewProductPage() {
  const router = useRouter();

  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [mainFile, setMainFile] = useState<{
    file: File;
    uploading: boolean;
    fileKey: string | null;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [whatsIncluded, setWhatsIncluded] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("gbp");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState<"draft" | "published" | null>(null);

  async function handlePreviewImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remainingSlots = MAX_PREVIEW_IMAGES - previewImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const oversized = filesToAdd.find((f) => f.size > MAX_PREVIEW_IMAGE_SIZE);
    if (oversized) {
      setErrors((prev) => ({ ...prev, previewImages: "Each image must be under 2MB." }));
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newEntries: PreviewImage[] = filesToAdd.map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
      uploading: true,
      url: null,
      error: null,
    }));

    setPreviewImages((prev) => [...prev, ...newEntries]);

    for (const entry of newEntries) {
      const path = `${user.id}/preview-${Date.now()}-${entry.file.name}`;
      const { error } = await supabase.storage
        .from("previews")
        .upload(path, entry.file);

      if (error) {
        setPreviewImages((prev) =>
          prev.map((p) =>
            p.file === entry.file
              ? { ...p, uploading: false, error: error.message }
              : p
          )
        );
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("previews")
        .getPublicUrl(path);

      setPreviewImages((prev) =>
        prev.map((p) =>
          p.file === entry.file
            ? { ...p, uploading: false, url: publicUrlData.publicUrl }
            : p
        )
      );
    }
  }

  function removePreviewImage(file: File) {
    setPreviewImages((prev) => {
      const removed = prev.find((p) => p.file === file);
      if (removed) URL.revokeObjectURL(removed.objectUrl);
      return prev.filter((p) => p.file !== file);
    });
  }

  async function handleMainFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, mainFile: "File exceeds the 500 MB limit." }));
      return;
    }

    setErrors((prev) => ({ ...prev, mainFile: "" }));
    setMainFile({ file, uploading: true, fileKey: null });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/temp-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("products").upload(path, file);

    if (error) {
      setMainFile({ file, uploading: false, fileKey: null });
      setErrors((prev) => ({ ...prev, mainFile: "Upload failed. Please try again." }));
      return;
    }

    setMainFile({ file, uploading: false, fileKey: path });
  }

  function addTag() {
    const trimmed = tagInput.trim().replace(/,$/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function handleTagInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value.endsWith(",")) {
      const trimmed = value.slice(0, -1).trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags((prev) => [...prev, trimmed]);
      }
      setTagInput("");
    } else {
      setTagInput(value);
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function getMainFileMimeType(filename: string): string | null {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext ? MAIN_FILE_MIME_TYPES[ext] ?? null : null;
  }

  function extractErrorMessage(data: unknown, fallback: string): string {
    if (typeof (data as { error?: unknown })?.error === "string") {
      return (data as { error: string }).error;
    }

    const fieldErrors = (
      data as { error?: { fieldErrors?: Record<string, string[]> } }
    )?.error?.fieldErrors;

    if (fieldErrors) {
      const firstMessage = Object.values(fieldErrors).flat()[0];
      if (firstMessage) return firstMessage;
    }

    return fallback;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (title.trim().length < 5) newErrors.title = "Title must be at least 5 characters.";
    if (description.trim().length < 20) newErrors.description = "Description must be at least 20 characters.";
    if (!price || Number(price) < 0.5 || Number(price) > 500) {
      newErrors.price = "Price must be between 0.50 and 500.";
    }
    if (!category) newErrors.category = "Category is required.";
    const successfulImages = previewImages.filter((p) => p.url);
    if (successfulImages.length === 0) newErrors.previewImages = "At least one preview image is required.";
    if (previewImages.some((p) => p.uploading)) newErrors.previewImages = "Wait for image uploads to finish.";
    if (previewImages.some((p) => p.error)) newErrors.previewImages = "Remove or retry the failed image upload.";
    if (!mainFile) newErrors.mainFile = "Main file is required.";
    if (mainFile?.uploading) newErrors.mainFile = "Wait for the file upload to finish.";
    if (mainFile && !mainFile.fileKey) newErrors.mainFile = "File upload failed. Please re-upload.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(status: "draft" | "published") {
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(status);

    const mimeType = mainFile ? getMainFileMimeType(mainFile.file.name) : null;

    const body = {
      title,
      description,
      whats_included: whatsIncluded || undefined,
      price: Number(price),
      currency,
      category,
      subject_tags: tags,
      file_key: mainFile!.fileKey,
      file_size_bytes: mainFile!.file.size,
      file_type: mimeType,
      preview_images: previewImages.map((p) => p.url).filter(Boolean) as string[],
      preview_video_url: previewVideoUrl || undefined,
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(extractErrorMessage(data, "Failed to save product."));
        setSubmitting(null);
        return;
      }

      if (status === "published") {
        const publishRes = await fetch(`/api/products/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        });

        if (!publishRes.ok) {
          const publishData = await publishRes.json();
          setSubmitError(
            extractErrorMessage(publishData, "Saved as draft, but failed to publish.")
          );
          setSubmitting(null);
          return;
        }
      }

      setSuccess(true);
      router.push("/seller/products");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setSubmitting(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Add new product</h1>

      {success && (
        <p className="mt-4 rounded bg-green-100 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Product saved successfully!
        </p>
      )}

      <div className="mt-8 space-y-6">
        {/* Preview images */}
        <div className="space-y-2">
          <Label>Preview images (max 5, 2MB each)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePreviewImagesChange}
            disabled={previewImages.length >= MAX_PREVIEW_IMAGES}
          />
          {errors.previewImages && (
            <p className="text-sm text-destructive">{errors.previewImages}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {previewImages.map((img) => (
              <div
                key={img.file.name + img.file.lastModified}
                className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.objectUrl}
                  alt={img.file.name}
                  className={cn(
                    "h-full w-full object-cover",
                    (img.uploading || img.error) && "opacity-40"
                  )}
                />
                {img.uploading && (
                  <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                )}
                {!img.uploading && img.error && (
                  <p className="absolute inset-x-0 bottom-0 bg-destructive/90 px-1 py-0.5 text-center text-[10px] leading-tight text-destructive-foreground">
                    Failed
                  </p>
                )}
                {!img.uploading && (
                  <button
                    type="button"
                    aria-label={`Remove ${img.file.name}`}
                    onClick={() => removePreviewImage(img.file)}
                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live buyer preview */}
        {previewImages.some((p) => p.url) && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <Label>What buyers will see</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                This is exactly how your preview appears on the product page —
                the frame adapts to landscape or portrait images.
              </p>
            </div>
            <ProductGallery
              images={previewImages.map((p) => p.url).filter(Boolean) as string[]}
              title={title || "Your product"}
            />
          </div>
        )}

        {/* Main file */}
        <div className="space-y-2">
          <Label>Main file (max 500MB)</Label>
          <Input
            type="file"
            accept=".pdf,.zip,.pptx,.docx,.txt,.mp4,.mov,.apkg"
            onChange={handleMainFileChange}
          />
          {mainFile?.uploading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </p>
          )}
          {errors.mainFile && <p className="text-sm text-destructive">{errors.mainFile}</p>}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">{title.length}/120</p>
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">{description.length}/2000</p>
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        {/* What's included */}
        <div className="space-y-2">
          <Label htmlFor="whats-included">What&apos;s included (optional)</Label>
          <Textarea
            id="whats-included"
            placeholder="One item per line"
            maxLength={2000}
            value={whatsIncluded}
            onChange={(e) => setWhatsIncluded(e.target.value)}
          />
        </div>

        {/* Price + Currency */}
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min={0.5}
              max={500}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
          </div>
          <div className="w-32 space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gbp">GBP</SelectItem>
                <SelectItem value="usd">USD</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
        </div>

        {/* Subject tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Subject tags</Label>
          <Input
            id="tags"
            placeholder="Type a tag and press comma"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} className="flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Preview video URL */}
        <div className="space-y-2">
          <Label htmlFor="preview-video">Preview video URL (optional)</Label>
          <Input
            id="preview-video"
            placeholder="YouTube or Vimeo URL"
            value={previewVideoUrl}
            onChange={(e) => setPreviewVideoUrl(e.target.value)}
          />
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={() => handleSubmit("draft")} disabled={submitting !== null}>
            {submitting === "draft" ? "Saving..." : "Save as draft"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit("published")}
            disabled={submitting !== null}
          >
            {submitting === "published" ? "Publishing..." : "Save and publish"}
          </Button>
          <Link href="/seller/products" className="text-sm text-muted-foreground underline">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
