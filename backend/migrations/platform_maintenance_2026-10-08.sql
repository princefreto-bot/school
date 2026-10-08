-- Interrupteur "Mise à jour en cours" : quand active = true, l'API refuse les requêtes
-- des écoles (503) et l'application affiche un écran de maintenance. Le superadmin
-- garde l'accès. Ligne unique id = 'current'.
create table if not exists public.platform_maintenance (
    id text primary key default 'current',
    active boolean not null default false,
    message text not null default 'DGhubSchool est en cours de mise à jour. Vos données sont en sécurité. Merci de réessayer dans quelques minutes.',
    updated_at timestamptz not null default now(),
    constraint platform_maintenance_single_row check (id = 'current')
);

insert into public.platform_maintenance (id) values ('current') on conflict (id) do nothing;

alter table public.platform_maintenance enable row level security;
