# Stripe Connect recommendation — EduVault

Business: https://edu-vault-tree.vercel.app/ — marketplace for educational resources
(revision notes, worksheets, lesson plans) sold by teachers and students to teachers
and students. Instant digital download, pay once, own forever. 90% to creators.

## Recommended configuration

| Dimension | Value | Status |
|---|---|---|
| Dashboard | `express` | ✅ matches current code |
| Fees collector | `application` (platform) | ✅ |
| Losses collector | `application` (platform) | ✅ required for this charge pattern |
| Charge pattern | **Separate charges and transfers** | ✅ correct — see below |
| Merchant of record | **Platform (EduVault)** | ⚠️ tax implications |

Compatibility matrix result: **ALLOWED (with caution)** — `express` + `application` +
`application` + separate charges and transfers.

### Why separate charges and transfers is correct here

A basket can hold items from multiple sellers. Destination charges support only
**one** destination account per charge, so they cannot express a multi-seller
basket. The current implementation (one charge, then one transfer per seller,
grouped by `seller_id`) is the right pattern and should be kept.

Caution that comes with it: connected accounts can't manage refunds, disputes, or
Radar rules from their Express dashboard on this charge pattern. Sellers will
contact EduVault for those, not Stripe.

---

## Finding 1 — Platform fee may be below cost on cheap resources (CRITICAL)

With separate charges and transfers, **Stripe assesses processing fees on the
platform**, not the seller. EduVault keeps 10% gross but pays the full processing
fee on the whole transaction.

Net platform margin per sale:

```
margin = 0.10 × price − (pct × price + fixed_fee)
```

Approximate break-even (check stripe.com/pricing for exact regional rates):

| Region | Approx. card rate | Platform breaks even at |
|---|---|---|
| UK domestic | ~1.5% + 20p | **~£2.35** |
| US domestic | ~2.9% + 30¢ | **~$4.23** |

Below that price, **EduVault loses money on every sale** — the seller still
receives 90%, but the fixed per-transaction fee exceeds the 10% cut. A £1.50 set of
flashcards would cost the platform money to sell.

Options:
1. **Set a minimum resource price** above break-even (simplest).
2. **Raise `PLATFORM_FEE_PERCENT`**, or move to percentage + fixed fee
   (e.g. 10% + 20p) so the fixed cost is always covered.
3. **Encourage multi-item baskets** — the fixed fee is charged once per *checkout*,
   not per item, so a 5-item basket amortises it. Current code already charges once
   per basket, which helps.

Note: `application_fee_amount` is **not compatible** with separate charges and
transfers. Margin must be preserved by calculating the transfer amount — which is
what `app/api/webhooks/stripe/route.ts` already does. Only the percentage needs
revisiting.

Monitor via the Connect margin report in the Dashboard.

## Finding 2 — Invoicing conflicts with this architecture

Stripe guidance: Billing / Invoicing / Payment Links should use **direct charges**.
Direct charges cannot support multi-seller baskets, so adopting Invoicing would mean
abandoning the basket model.

Assessment: **EduVault does not need Invoicing.** It sells instant-download digital
goods at point of sale; Stripe Checkout already emails receipts. Invoicing is for
billing a customer to pay later — not this flow.

Recommendation: **drop Invoicing** from the product list. Enable receipts in
Checkout instead. Revisit only if selling to schools/institutions on purchase
orders, which would be a separate direct-charge flow.

## Finding 3 — Stripe Tax is worth enabling (platform is merchant of record)

Because the platform is merchant of record under separate charges and transfers,
**EduVault owes the sales tax / VAT**, not the individual sellers. For digital
educational products sold cross-border (GCSE/A-Level/university buyers anywhere),
VAT on digital services is generally owed in the buyer's country.

Recommendation: enable Stripe Tax and turn it on in the Checkout Session
(`automatic_tax: { enabled: true }`), plus set a tax code on the line items for
digital goods. Requires registering tax thresholds in the Dashboard.

This is a code change to `app/api/checkout/route.ts` — not yet implemented.

## Finding 4 — No dispute or refund handling (code gap)

With this charge pattern, Stripe debits a disputed amount from the **platform**
balance, but the seller has already received their 90%. Recovery is **not
automatic** — it requires explicitly reversing the transfer.

`app/api/webhooks/stripe/route.ts` currently handles only `payment_intent.succeeded`
and `account.updated`. There is no `charge.dispute.created` or `charge.refunded`
handler, so today **EduVault absorbs 100% of every dispute and refund** while the
seller keeps their cut.

Recommendation: add handlers that call `stripe.transfers.createReversal` to claw
back the seller's share, and decide a refund policy for instant-download goods.

---

## Split of work

**In code** (not yet done):
- Revisit `PLATFORM_FEE_PERCENT` / minimum price (Finding 1)
- Add `automatic_tax` to the Checkout Session (Finding 3)
- Add dispute + refund webhook handlers with transfer reversal (Finding 4)

**In the Stripe Dashboard** (blocked on account creation):
- Activate payments; complete Connect platform profile with
  **platform responsible for losses** (`losses_collector: application`)
- Register tax thresholds for Stripe Tax
- Two webhook endpoints → `/api/webhooks/stripe`
  (account events: `payment_intent.succeeded`; connected-account events:
  `account.updated`) — see `docs/STRIPE_SETUP.md`

**Already correct, no change needed:**
- Express account creation + onboarding links
- Multi-seller basket → separate charges and transfers
- Per-seller transfer grouping with idempotency keys
- Onboarding gating on product upload and checkout
