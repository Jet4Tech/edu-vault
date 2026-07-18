"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { categories } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Product = {
  id: string;
  title: string;
  description: string;
  whats_included: string | null;
  price: number;
  currency: string;
  category: string;
  subject_tags: string[];
  preview_video_url: string | null;
  status: "draft" | "published";
};

export function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [whatsIncluded, setWhatsIncluded] = useState(product.whats_included ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [currency, setCurrency] = useState(product.currency);
  const [category, setCategory] = useState(product.category);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(product.subject_tags ?? []);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(product.preview_video_url ?? "");

  const [status, setStatus] = useState(product.status);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

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

  function addTag() {
    const trimmed = tagInput.trim().replace(/,$/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!price || Number(price) < 0.5 || Number(price) > 500) {
      newErrors.price = "Price must be between 0.50 and 500.";
    }
    if (!category) newErrors.category = "Category is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    setSubmitError(null);
    if (!validate()) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          whats_included: whatsIncluded || undefined,
          price: Number(price),
          currency,
          category,
          subject_tags: tags,
          preview_video_url: previewVideoUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(
          typeof data.error === "string" ? data.error : "Failed to save product."
        );
        setSaving(false);
        return;
      }

      setSuccess(true);
      router.push("/seller/products");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    setTogglingStatus(true);
    const newStatus = status === "published" ? "draft" : "published";

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(
          typeof data.error === "string" ? data.error : "Failed to update status."
        );
        setTogglingStatus(false);
        return;
      }

      setStatus(newStatus);
      setSuccess(true);
      router.push("/seller/products");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setTogglingStatus(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Edit product</h1>

      {success && (
        <p className="mt-4 rounded bg-green-100 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Product updated successfully!
        </p>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        To change the file or images, delete this product and create a new one.
      </p>

      <div className="mt-8 space-y-6">
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

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">{description.length}/2000</p>
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>

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
          <Button onClick={handleSave} disabled={saving || togglingStatus}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={saving || togglingStatus}
          >
            {togglingStatus
              ? "Updating..."
              : status === "published"
              ? "Unpublish"
              : "Publish"}
          </Button>
          <Link href="/seller/products" className="text-sm text-muted-foreground underline">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
