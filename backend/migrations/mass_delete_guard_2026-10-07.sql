-- Garde-fou anti-suppression massive (incident csyzomacamb 2026-10-07 : un bouton
-- "Nettoyer le Cloud" a vidé élèves, notes, paiements de toutes les années).
-- Toute instruction DELETE qui supprime d'un coup plus de N lignes d'élèves, de
-- paiements ou de notes est annulée par la base, quel que soit le code qui l'envoie.
-- Les suppressions unitaires (un élève, un paiement, une note) restent possibles,
-- y compris les cascades d'un élève vers ses notes/paiements.
-- Maintenance volontaire (support uniquement) : `set local app.allow_mass_delete = 'on';`
-- dans la même transaction.

create or replace function public.guard_mass_delete()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    n bigint;
    lim int := TG_ARGV[0]::int;
begin
    if coalesce(current_setting('app.allow_mass_delete', true), '') = 'on' then
        return null;
    end if;
    select count(*) into n from old_rows;
    if n > lim then
        raise exception 'Suppression massive bloquée sur % : % lignes (limite %). Garde-fou anti-perte de données.',
            TG_TABLE_NAME, n, lim;
    end if;
    return null;
end;
$$;

-- À appeler pour chaque nouvelle école, après create_school_tables.
create or replace function public.add_mass_delete_guards(school_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    rec record;
    tbl text;
begin
    for rec in select * from (values ('students', 5), ('payments', 100), ('notes', 300)) as v(base, lim) loop
        tbl := rec.base || '_' || school_slug;
        if to_regclass(format('public.%I', tbl)) is not null then
            execute format('drop trigger if exists guard_mass_delete on public.%I', tbl);
            execute format(
                'create trigger guard_mass_delete after delete on public.%I referencing old table as old_rows for each statement execute function public.guard_mass_delete(%s)',
                tbl, rec.lim
            );
        end if;
    end loop;
end;
$$;

revoke execute on function public.add_mass_delete_guards(text) from public, anon, authenticated;
grant execute on function public.add_mass_delete_guards(text) to service_role;

do $$
declare
    r record;
begin
    for r in
        select replace(table_name, 'students_', '') as slug
        from information_schema.tables
        where table_schema = 'public' and table_name like 'students\_%'
    loop
        perform public.add_mass_delete_guards(r.slug);
    end loop;
end;
$$;
