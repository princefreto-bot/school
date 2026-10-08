-- Intégrité des montants payés (audit 2026-10-08) : la base recalcule elle-même
-- deja_paye / inscription_paye / restant / inscription_restant / status d'un élève à partir
-- de ses transactions (payments_{slug}). Ce que l'appareil envoie pour ces champs est ignoré.
-- Préalable : régularisation "Reprise de solde antérieur" (backfill_reprise_payments) pour
-- qu'aucun total existant ne baisse. Instantané avant opération : _snapshot_paid_20261008.

create or replace function public.students_recompute_paid()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    slug text := substring(TG_TABLE_NAME from '^students_(.*)$');
    e numeric;
    i numeric;
begin
    execute format(
        'select coalesce(sum(montant) filter (where coalesce(type, ''ecolage'') = ''ecolage''), 0),
                coalesce(sum(montant) filter (where type = ''inscription''), 0)
           from public.%I where student_id = $1',
        'payments_' || slug)
    into e, i using NEW.id;

    NEW.deja_paye := e;
    NEW.inscription_paye := i;
    NEW.restant := greatest(coalesce(NEW.ecolage, 0) - e, 0);
    NEW.inscription_restant := greatest(coalesce(NEW.frais_inscription, 0) - i, 0);
    -- Même règle que computeStatus côté application.
    NEW.status := case
        when NEW.restant <= 0 then 'Soldé'
        when coalesce(NEW.ecolage, 0) > 0 and (NEW.ecolage - NEW.restant) / NEW.ecolage >= 0.7 then 'Partiel'
        else 'Non soldé'
    end;
    return NEW;
end;
$$;

create or replace function public.payments_touch_student()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    tbl text := 'students_' || substring(TG_TABLE_NAME from '^payments_(.*)$');
begin
    if TG_OP in ('INSERT', 'UPDATE') then
        execute format('update public.%I set deja_paye = deja_paye where id = $1', tbl) using NEW.student_id;
    end if;
    if TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and OLD.student_id is distinct from NEW.student_id) then
        execute format('update public.%I set deja_paye = deja_paye where id = $1', tbl) using OLD.student_id;
    end if;
    return null;
end;
$$;

create or replace function public.add_payment_integrity_triggers(school_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if to_regclass(format('public.%I', 'students_' || school_slug)) is null
       or to_regclass(format('public.%I', 'payments_' || school_slug)) is null then
        return;
    end if;
    execute format('drop trigger if exists recompute_paid on public.%I', 'students_' || school_slug);
    execute format('create trigger recompute_paid before insert or update on public.%I for each row execute function public.students_recompute_paid()', 'students_' || school_slug);
    execute format('drop trigger if exists touch_student on public.%I', 'payments_' || school_slug);
    execute format('create trigger touch_student after insert or update or delete on public.%I for each row execute function public.payments_touch_student()', 'payments_' || school_slug);
end;
$$;

revoke execute on function public.add_payment_integrity_triggers(text) from public, anon, authenticated;
grant execute on function public.add_payment_integrity_triggers(text) to service_role;

do $$
declare
    r record;
begin
    for r in select slug from schools loop
        perform public.add_payment_integrity_triggers(r.slug);
        if to_regclass(format('public.%I', 'students_' || r.slug)) is not null then
            execute format('update public.%I set deja_paye = deja_paye', 'students_' || r.slug);
        end if;
    end loop;
end;
$$;
