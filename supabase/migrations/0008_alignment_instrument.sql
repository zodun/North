-- North · alignment instrument (operating-doc DEC-09; tracker DEC-04)
-- Implements docs/north-core-metrics-spec.md DEC-04:
--   Layer 1 — weekly pulse: single-item, 5-point scale, once a week
--             (table public.weekly_pulses already exists; this migration
--              adds the public.weekly_pulse_due helper)
--   Layer 2 — baseline + day-28 measure: a published validated scale,
--             items taken verbatim from the source. The spec selects
--             MLQ presence-of-meaning (Steger 2006); items are stored
--             as PLACEHOLDERS in this migration and the parent scale's
--             license_status gates client-side display so the
--             placeholders never reach a real user.

-- ─────────────────────────────────────────────────────────────────────
-- alignment_scales — one row per scale (only MLQ pom in v0).
-- license_status governs whether items are visible to clients.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.alignment_scales (
    id                   text primary key,
    label                text not null,
    source_citation      text not null,
    scale_min            int  not null,
    scale_max            int  not null check (scale_max > scale_min),
    license_status       text not null
        check (license_status in ('pending_acquisition','licensed','revoked'))
        default 'pending_acquisition',
    license_evidence_url text,
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────
-- alignment_scale_items — per-item rows for each scale.
-- Items with placeholder text are never readable by clients because
-- the RLS policy joins back to alignment_scales.license_status.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.alignment_scale_items (
    scale_id       text not null references public.alignment_scales(id) on delete cascade,
    ordering       int  not null check (ordering >= 1),
    prompt         text not null,
    reverse_scored boolean not null default false,
    created_at     timestamptz not null default now(),
    primary key (scale_id, ordering)
);

-- ─────────────────────────────────────────────────────────────────────
-- Seed: MLQ presence-of-meaning subscale (Steger 2006).
-- license_status = pending_acquisition until operator runs the
-- runbook in docs/north-core-metrics-spec.md (DEC-04 appendix).
-- ─────────────────────────────────────────────────────────────────────
insert into public.alignment_scales
    (id, label, source_citation, scale_min, scale_max, license_status)
values (
    'mlq-pom',
    'Meaning in Life Questionnaire — presence-of-meaning subscale (5 items)',
    'Steger, M. F., Frazier, P., Oishi, S., & Kaler, M. (2006). The Meaning in Life Questionnaire: Assessing the presence of and search for meaning in life. Journal of Counseling Psychology, 53(1), 80–93.',
    1, 7,
    'pending_acquisition'
)
on conflict (id) do nothing;

insert into public.alignment_scale_items (scale_id, ordering, prompt, reverse_scored) values
    ('mlq-pom', 1, 'PLACEHOLDER — replace with verbatim item 1 from Steger 2006 MLQ presence-of-meaning subscale', false),
    ('mlq-pom', 2, 'PLACEHOLDER — replace with verbatim item 2 from Steger 2006 MLQ presence-of-meaning subscale', false),
    ('mlq-pom', 3, 'PLACEHOLDER — replace with verbatim item 3 from Steger 2006 MLQ presence-of-meaning subscale', false),
    ('mlq-pom', 4, 'PLACEHOLDER — replace with verbatim item 4 from Steger 2006 MLQ presence-of-meaning subscale', false),
    ('mlq-pom', 5, 'PLACEHOLDER — replace with verbatim item 5 from Steger 2006 MLQ presence-of-meaning subscale', true)
on conflict (scale_id, ordering) do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- baseline_endpoint_responses gets a scale_id so responses are tied
-- to a specific instrument (forward-compatible with adding more scales
-- later, e.g., if the operator decides MLQ doesn't fit).
-- ─────────────────────────────────────────────────────────────────────
alter table public.baseline_endpoint_responses
    add column if not exists scale_id text not null default 'mlq-pom'
        references public.alignment_scales(id) on delete restrict;

-- ─────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────
alter table public.alignment_scales      enable row level security;
alter table public.alignment_scale_items enable row level security;

create policy alignment_scales_read_all on public.alignment_scales
    for select using (true);

-- Items are readable only when the parent scale is licensed. Placeholders
-- therefore never reach a real client — even if the developer forgot
-- to gate the UI.
create policy alignment_scale_items_read_licensed on public.alignment_scale_items
    for select using (
        exists (
            select 1 from public.alignment_scales s
            where s.id = scale_id
              and s.license_status = 'licensed'
        )
    );

-- Admin writes on both tables (writes happen under service role in v0,
-- but explicit admin-write policies keep the door open for an admin UI).
create policy alignment_scales_admin_write on public.alignment_scales
    for all using (public.is_admin()) with check (public.is_admin());
create policy alignment_scale_items_admin_write on public.alignment_scale_items
    for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- compute_alignment_composite — averages a response payload over the
-- scale's items, reversing scoring where flagged. Returns numeric
-- on the scale's native range (e.g., 1–7 for MLQ).
--
-- items shape: jsonb object keyed by ordering as text → integer score.
--   e.g., {"1": 4, "2": 5, "3": 3, "4": 6, "5": 4}
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.compute_alignment_composite(
    items jsonb,
    scale_id_in text
)
returns numeric
language plpgsql
stable
set search_path = public
as $$
declare
    s_min int; s_max int;
    total numeric := 0;
    n     int     := 0;
    r     record;
    raw   numeric;
begin
    select scale_min, scale_max into s_min, s_max
    from public.alignment_scales where id = scale_id_in;
    if s_min is null then
        raise exception 'unknown scale_id: %', scale_id_in;
    end if;

    for r in
        select ordering, reverse_scored
        from public.alignment_scale_items
        where scale_id = scale_id_in
        order by ordering
    loop
        raw := (items ->> r.ordering::text)::numeric;
        if raw is null then continue; end if;
        if r.reverse_scored then
            raw := (s_min + s_max) - raw;
        end if;
        total := total + raw;
        n := n + 1;
    end loop;

    if n = 0 then return null; end if;
    return round((total / n)::numeric, 3);
end;
$$;

-- Auto-compute composite on every insert/update.
create or replace function public.baseline_endpoint_responses_set_composite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.composite := public.compute_alignment_composite(new.items, new.scale_id);
    return new;
end;
$$;

drop trigger if exists trg_alignment_composite on public.baseline_endpoint_responses;
create trigger trg_alignment_composite
    before insert or update of items, scale_id
    on public.baseline_endpoint_responses
    for each row
    execute function public.baseline_endpoint_responses_set_composite();

-- ─────────────────────────────────────────────────────────────────────
-- weekly_pulse_due — Layer 1 dispatch helper. Returns true iff the
-- caller has no weekly_pulses row for the ISO week containing `as_of`.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.weekly_pulse_due(
    uid uuid,
    as_of date default current_date
)
returns boolean
language sql
stable
set search_path = public
as $$
    select not exists (
        select 1 from public.weekly_pulses
        where user_id = uid
          and date_trunc('week', week_ending) = date_trunc('week', as_of)
    );
$$;
