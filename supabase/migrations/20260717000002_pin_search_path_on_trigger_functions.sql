-- Supabase security advisor flagged both trigger functions for a mutable
-- search_path (lint 0011_function_search_path_mutable). Pin it.
-- Applied to production 2026-07-17 via Supabase MCP.

alter function public.products_fts_trigger() set search_path = public;
alter function public.set_updated_at() set search_path = public;
