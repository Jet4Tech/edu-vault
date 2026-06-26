import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(2000),
  price: z.number().min(0.5).max(500),
  currency: z.enum(["gbp", "usd", "eur"]).default("gbp"),
  category: z.string().min(1),
  subject_tags: z.array(z.string()).max(10),
  file_key: z.string().min(1),
  file_size_bytes: z.number().positive(),
  file_type: z.string().min(1),
  preview_images: z.array(z.string()).min(1).max(5),
  whats_included: z.string().max(2000).optional(),
  preview_video_url: z.string().url().optional(),
});

export const updateProductSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).max(2000).optional(),
  price: z.number().min(0.5).max(500).optional(),
  currency: z.enum(["gbp", "usd", "eur"]).optional(),
  category: z.string().min(1).optional(),
  subject_tags: z.array(z.string()).max(10).optional(),
  file_key: z.string().min(1).optional(),
  file_size_bytes: z.number().positive().optional(),
  file_type: z.string().min(1).optional(),
  preview_images: z.array(z.string()).min(1).max(5).optional(),
  whats_included: z.string().max(2000).optional(),
  preview_video_url: z.string().url().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
