-- Chargebacks: when a buyer disputes a completed order, Stripe debits the
-- platform balance immediately while the seller has already been paid their
-- share. The webhook reverses the seller transfers and marks the order
-- 'disputed'. Every read path (download, library, reviews, re-purchase checks)
-- gates on status = 'paid', so this single status change revokes access.
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'refunded', 'disputed'));

alter table public.checkout_sessions drop constraint checkout_sessions_status_check;
alter table public.checkout_sessions add constraint checkout_sessions_status_check
  check (status in ('pending', 'paid', 'failed', 'disputed'));

-- The dispute handler looks up the session by payment intent.
create index if not exists checkout_sessions_stripe_payment_intent_idx
  on public.checkout_sessions (stripe_payment_intent);
