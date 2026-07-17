-- users.email and users.stripe_account_id were readable by anyone because the
-- SELECT policy was USING (true). Restrict full-row access to the row owner and
-- expose only safe columns through a public view for marketplace joins.
-- Applied to production 2026-07-17 via Supabase MCP (migration name:
-- restrict_users_select_add_profiles_view).

drop policy "Public profiles are viewable" on public.users;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Owned by postgres, so it bypasses users RLS for exactly these columns.
create or replace view public.profiles as
  select id, name, avatar_url, bio, created_at
  from public.users;

alter view public.profiles owner to postgres;
grant select on public.profiles to anon, authenticated;

notify pgrst, 'reload schema';
