-- Mission rituals follow the mission model onto monthly steps.
--
-- 0042 retired the daily `missions` model in favour of monthly_missions /
-- monthly_mission_steps, but mission_check_ins.mission_id and
-- mission_reflections.mission_id still hard-reference public.missions — a
-- table nothing populates anymore — so the check-in and reflection rituals
-- could not attach to the mission the product actually runs on.
--
-- From now on the client stores the id of the day's DAILY STEP
-- (monthly_mission_steps.id) in mission_id: one check-in / reflection per
-- day, through the same unique (user_id, mission_id) upsert path. The FK is
-- dropped rather than repointed because plan-month rewrites a mission's whole
-- step set whenever the user edits their goal; a cascading FK would silently
-- erase ritual history on every goal edit. Legacy rows keep their old
-- missions ids untouched, and RLS still scopes every row to its owner.

alter table public.mission_check_ins
    drop constraint if exists mission_check_ins_mission_id_fkey;

alter table public.mission_reflections
    drop constraint if exists mission_reflections_mission_id_fkey;
