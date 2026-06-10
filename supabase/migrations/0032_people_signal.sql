-- people: contacts the user tracks signal & noise for.
create table public.people (
    id         uuid        primary key default gen_random_uuid(),
    user_id    uuid        not null references auth.users(id) on delete cascade,
    name       text        not null,
    created_at timestamptz not null default now()
);

alter table public.people enable row level security;
create policy people_own on public.people
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- person_goals: one goal per person per calendar month.
create table public.person_goals (
    id         uuid        primary key default gen_random_uuid(),
    person_id  uuid        not null references public.people(id) on delete cascade,
    user_id    uuid        not null references auth.users(id) on delete cascade,
    month      date        not null,   -- stored as first day of month
    goal       text        not null,
    created_at timestamptz not null default now(),
    unique (person_id, month)
);

alter table public.person_goals enable row level security;
create policy person_goals_own on public.person_goals
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- person_check_ins: weekly signal + noise notes per person.
create table public.person_check_ins (
    id         uuid        primary key default gen_random_uuid(),
    person_id  uuid        not null references public.people(id) on delete cascade,
    user_id    uuid        not null references auth.users(id) on delete cascade,
    week_ending date       not null,
    signal     text,
    noise      text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (person_id, week_ending)
);

alter table public.person_check_ins enable row level security;
create policy person_check_ins_own on public.person_check_ins
    using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index person_check_ins_person_week on public.person_check_ins (person_id, week_ending desc);
