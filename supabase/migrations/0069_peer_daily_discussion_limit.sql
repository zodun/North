-- Community: one new discussion per user per day. Replies stay unlimited, that's
-- participation, which we want to encourage. Enforced in the database (a BEFORE
-- INSERT trigger on peer_posts) so the cap holds no matter what the client does.
-- The day boundary is Jamaica time (UTC-5, the launch market), matching the
-- app's greeting/clock logic so "today" lines up with what the user sees.

create or replace function public.peer_posts_daily_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if exists (
        select 1
        from public.peer_posts
        where user_id = new.user_id
          and created_at >= date_trunc('day', now() at time zone 'America/Jamaica')
                            at time zone 'America/Jamaica'
    ) then
        raise exception 'You can start one discussion per day. Come back tomorrow.'
            using errcode = 'check_violation';
    end if;
    return new;
end;
$$;

drop trigger if exists peer_posts_daily_limit_bi on public.peer_posts;
create trigger peer_posts_daily_limit_bi
    before insert on public.peer_posts
    for each row execute function public.peer_posts_daily_limit();
