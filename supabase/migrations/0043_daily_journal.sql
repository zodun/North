-- Daily journal (replaces the weekly "Carry Forward" reflection).
--
-- user_reflections becomes a daily journal: one or more entries per day, each
-- typed or voice-dictated, analysed into signal vs noise. Add entry_date as
-- the day the entry is for. week_ending stays (NOT NULL) and is set to the
-- same date by the reflect function — nothing enforces it as a week boundary.
-- The analysis jsonb shape changes from {themes, alignment, nudge} to
-- {signal[], noise[], read}; jsonb is schemaless so no column change needed.

alter table public.user_reflections
    add column if not exists entry_date date not null default current_date;

create index if not exists user_reflections_user_day_idx
    on public.user_reflections (user_id, entry_date desc);
