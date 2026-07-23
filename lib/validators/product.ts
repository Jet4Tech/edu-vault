import { z } from "zod";

// Stripe charges the platform ~1.5% + 20p per checkout (UK rates), and the
// seller still takes 90%, so the platform's 10% cut doesn't cover the fixed fee
// on cheap items — anything under ~£2.35 loses money on a single-item sale.
// These floors keep every sale above break-even with a little headroom for
// EEA/international cards, which carry higher percentages.
export const MIN_PRICE_BY_CURRENCY = {
  gbp: 3,
  usd: 4,
  eur: 3.5,
} as const;

export type SupportedCurrency = keyof typeof MIN_PRICE_BY_CURRENCY;

const CURRENCY_SYMBOL: Record<SupportedCurrency, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
};

export function formatMinPrice(currency: SupportedCurrency) {
  return `${CURRENCY_SYMBOL[currency]}${MIN_PRICE_BY_CURRENCY[currency].toFixed(2)}`;
}

/**
 * Rejects prices below the per-currency floor. Applied via superRefine so the
 * error is attached to `price` and names the currency the seller actually
 * chose, rather than a generic "too small" message.
 */
function enforceMinPrice(
  input: { price?: number; currency?: SupportedCurrency },
  ctx: z.RefinementCtx
) {
  if (input.price === undefined) return;

  const currency = input.currency ?? "gbp";
  const min = MIN_PRICE_BY_CURRENCY[currency];

  if (input.price < min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: `Price must be at least ${formatMinPrice(currency)}.`,
    });
  }
}

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
}).superRefine(enforceMinPrice);

// Edits deliberately exclude file_key / file_type / file_size_bytes /
// preview_images: those are set once at creation and must stay immutable so a
// seller can't swap the delivered file (or repoint it at another path) after a
// product has sold. Changing the file requires deleting and recreating the
// product. .strict() rejects any of those fields if a client sends them.
export const updateProductSchema = z
  .object({
    title: z.string().min(5).max(120).optional(),
    description: z.string().min(20).max(2000).optional(),
    price: z.number().min(0.5).max(500).optional(),
    currency: z.enum(["gbp", "usd", "eur"]).optional(),
    category: z.string().min(1).optional(),
    subject_tags: z.array(z.string()).max(10).optional(),
    whats_included: z.string().max(2000).optional(),
    preview_video_url: z.string().url().optional(),
    status: z.enum(["draft", "published"]).optional(),
  })
  .strict();

/**
 * Price-floor guard for the update path. `updateProductSchema` deliberately
 * doesn't refine this: a seller can change price without sending currency, and
 * the authoritative currency lives on the stored product — so the route
 * resolves the effective currency and calls this.
 */
export function isPriceAboveMinimum(price: number, currency: SupportedCurrency) {
  return price >= MIN_PRICE_BY_CURRENCY[currency];
}

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
