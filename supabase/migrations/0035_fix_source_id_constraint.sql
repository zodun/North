-- Add a proper UNIQUE CONSTRAINT on source_id so PostgREST can
-- resolve ON CONFLICT. Wrapped in a DO block so it's idempotent.
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'opportunities_source_id_unique'
    ) then
        alter table public.opportunities
            add constraint opportunities_source_id_unique unique (source_id);
    end if;
end $$;

drop index if exists public.opportunities_source_id_idx;
