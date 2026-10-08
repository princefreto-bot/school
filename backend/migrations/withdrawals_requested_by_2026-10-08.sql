-- Traçabilité des demandes de retrait : qui a demandé (id, nom, rôle).
alter table public.school_withdrawals
  add column if not exists requested_by_id text,
  add column if not exists requested_by_name text,
  add column if not exists requested_by_role text;
