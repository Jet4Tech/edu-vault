import Stripe from "stripe";

let client: Stripe | null = null;

function getClient(): Stripe {
  if (!client) {
    const apiKey = process.env.STRIPE_SECRET_KEY;

    if (!apiKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Add it to .env.local (and to the Vercel project settings for deployments)."
      );
    }

    client = new Stripe(apiKey, {
      apiVersion: "2026-06-24.dahlia",
    });
  }

  return client;
}

// Constructed lazily on first use. The Stripe SDK throws as soon as it's
// instantiated without a key, and Next evaluates every route module while
// collecting page data during `next build` — so an eager client turns a missing
// key into a failed build for the entire app rather than a clear error on the
// routes that actually call Stripe.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop);
  },
});
