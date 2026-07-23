# Stripe re-implementation guide (EduVault)

Everything Stripe touches in this codebase, plus the exact dashboard setup needed
to bring it back to life. The code is complete and working — re-implementing
Stripe is **purely a configuration task**, no code changes required.

## How money flows

```
Buyer pays full price ──► Platform Stripe account (yours)
                              │
                              ├── 90% transferred to seller's Express account
                              └── 10% stays (PLATFORM_FEE_PERCENT)
```

Model: **Stripe Connect, Express accounts, separate charges & transfers.**
Payment happens on the platform account; sellers are paid via
`stripe.transfers.create` in the webhook after the payment succeeds.

## Code map

| File | Role |
|---|---|
| `lib/stripe/client.ts` | Stripe SDK client (`STRIPE_SECRET_KEY`, apiVersion `2026-06-24.dahlia`) |
| `app/api/stripe/connect/route.ts` | Creates Express account + onboarding link for sellers. Auto-recovers if stored account id is from a dead/wrong-mode account. |
| `app/api/checkout/route.ts` | Builds Checkout Session from basket. Validates sellers are onboarded, single currency. Snapshot stored in `checkout_sessions`. |
| `app/api/webhooks/stripe/route.ts` | Handles `payment_intent.succeeded` (create orders, transfer 90% to sellers, mark session paid, clear basket) and `account.updated` (flip `stripe_onboarding_complete`, promote to `seller` role). Idempotent: duplicate orders skipped (23505), transfers use idempotency keys. Accepts two signing secrets. |
| `app/api/products/route.ts` | Blocks product upload until `role = seller` and onboarding complete |
| `app/seller/dashboard/page.tsx` | Shows connect status. Fallback: polls `stripe.accounts.retrieve` on page load in case the Connect webhook didn't arrive. |
| `app/dashboard/start-selling-button.tsx` | "Start selling" → POST `/api/stripe/connect` → redirect to Stripe onboarding |
| `app/seller/connect/refresh/page.tsx` | Retry page if seller abandons onboarding (Stripe `refresh_url`) |

## Env vars (`.env.local` + Vercel)

| Var | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY` | Dashboard → Developers → API keys (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the **account-events** webhook endpoint (locally: the `stripe listen` secret) |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | Signing secret of the **connected-accounts** webhook endpoint (prod only) |
| `PLATFORM_FEE_PERCENT` | Your cut, defaults to 10 |
| `NEXT_PUBLIC_APP_URL` | Used in Checkout success/cancel URLs and Connect return/refresh URLs |

## Database columns used

- `users.stripe_account_id` — seller's Express account (`acct_...`)
- `users.stripe_onboarding_complete` — gates checkout + product upload
- `users.stripe_customer_id` — currently unused (reserved)
- `users.role` — set to `seller` when onboarding completes
- `checkout_sessions.stripe_session_id`, `.stripe_payment_intent` — Checkout tracking
- `orders.stripe_payment_intent` — receipt reference

## Stripe dashboard checklist (in order)

1. **Create account** at dashboard.stripe.com/register
2. **Activate payments** — business profile, bank account, identity. Live keys
   don't work until approved.
3. **Enable Connect** — complete the platform profile, including the
   loss-liability questionnaire (**platform is responsible for losses** —
   required for Express + separate charges & transfers). Sellers get a
   "platform setup isn't finished" error until this is done
   (`app/api/stripe/connect/route.ts` detects this case).
4. **Copy the secret key** → `STRIPE_SECRET_KEY`
5. **Create two webhook endpoints**, both →
   `https://<your-domain>/api/webhooks/stripe`:

   | Listen to | Event | Secret goes into |
   |---|---|---|
   | Your account | `payment_intent.succeeded` | `STRIPE_WEBHOOK_SECRET` |
   | Connected accounts | `account.updated` | `STRIPE_CONNECT_WEBHOOK_SECRET` |

6. Update env vars in `.env.local` **and** Vercel → redeploy.

## Local development

Live webhooks can't reach localhost. Use the Stripe CLI:

```
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`. The CLI forwards both
account and connect events, so one secret is enough locally.

## Smoke test after setup

1. Sign in → "Start selling" → complete Express onboarding → dashboard shows
   "Your Stripe account is connected ✓" and role becomes `seller`.
2. Upload + publish a product.
3. Buy it from a second account → order appears in library, transfer (90%)
   appears in the seller's Stripe balance, basket is cleared.
