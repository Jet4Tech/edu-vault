import { z } from "zod";

export const addToBasketSchema = z.object({
  product_id: z.string().uuid(),
});

export const removeFromBasketSchema = z.object({
  product_id: z.string().uuid(),
});

export type AddToBasketInput = z.infer<typeof addToBasketSchema>;
export type RemoveFromBasketInput = z.infer<typeof removeFromBasketSchema>;
