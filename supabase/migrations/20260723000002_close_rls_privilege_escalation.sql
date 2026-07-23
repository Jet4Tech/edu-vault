-- The API routes enforced rules that RLS did not, and the anon key lets a
-- browser skip the API entirely. These policies move each rule into the
-- database so the route checks become defence in depth rather than the only
-- thing standing between a user and someone else's money or files.

-- 1. users: authorization columns must not be self-writable.
--
-- `authenticated` held UPDATE on every column, and the policy only checked
-- `auth.uid() = id` — so any signed-in user could set role = 'seller' and
-- stripe_onboarding_complete = true on their own row and bypass Connect
-- onboarding completely. Rows are created by the handle_new_user trigger
-- (security definer) and the payout columns are written only by the webhook's
-- service-role client, so neither needs a grant here.
revoke insert, update on public.users from anon, authenticated;

-- Profile fields stay self-editable; role and the Stripe columns do not.
grant update (name, bio, avatar_url) on public.users to authenticated;

-- 2. products: only onboarded sellers, and only their own files.
--
-- The old policy checked `auth.uid() = seller_id` and nothing else, so a direct
-- insert bypassed the onboarding gate, the price floor and the file
-- validation. Worse, file_key was attacker-controlled: the download route signs
-- whatever path the row holds using the admin client, so a cheap product
-- pointing at another seller's file handed over their content. Uploads always
-- land under '<user id>/', both the temp path and the post-move path, so
-- requiring that prefix keeps a row pointing only at its owner's storage.
drop policy if exists "Sellers can insert products" on public.products;
create policy "Onboarded sellers can insert products"
  on public.products for insert to authenticated
  with check (
    auth.uid() = seller_id
    and file_key like auth.uid()::text || '/%'
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role = 'seller'
        and u.stripe_onboarding_complete
    )
  );

drop policy if exists "Sellers can update own products" on public.products;
create policy "Sellers can update own products"
  on public.products for update to authenticated
  using (auth.uid() = seller_id)
  with check (
    auth.uid() = seller_id
    and file_key like auth.uid()::text || '/%'
  );

-- 3. reviews: a review requires a paid order for that product.
--
-- The purchase check lived only in the API route, so a direct insert let anyone
-- review — or review-bomb — a product they never bought. Reviews are publicly
-- readable, so this was seller reputation open to anyone with an account.
drop policy if exists "Buyers can insert reviews" on public.reviews;
create policy "Buyers can review purchased products"
  on public.reviews for insert to authenticated
  with check (
    auth.uid() = buyer_id
    and exists (
      select 1 from public.orders o
      where o.buyer_id = auth.uid()
        and o.product_id = reviews.product_id
        and o.status = 'paid'
    )
  );
