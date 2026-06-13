-- Peer stories shown on the For You card ("someone on your path used this").
-- Public, read-only social proof. Rows with a source_url are real, attributed
-- stories and render a "Read the story" link; rows without one are illustrative
-- placeholders. Replace the seeded placeholders with real, sourced stories.
create table if not exists public.peer_stories (
	id uuid primary key default gen_random_uuid(),
	focus_area text not null, -- career | mindset | money | skills | health
	name text not null,
	who text not null, -- short descriptor, e.g. "20, Kingston"
	quote text not null,
	outcome text not null,
	source_name text, -- e.g. "r/GetDisciplined" (null = illustrative)
	source_url text, -- link to the real story (null = illustrative)
	sort_order int not null default 0,
	created_at timestamptz not null default now()
);

alter table public.peer_stories enable row level security;

drop policy if exists "peer_stories are readable by everyone" on public.peer_stories;
create policy "peer_stories are readable by everyone"
	on public.peer_stories for select
	using (true);

-- Seed: the current illustrative stories (source_url null = placeholder).
-- Replace / extend with real, attributed, linked stories.
insert into public.peer_stories (focus_area, name, who, quote, outcome, sort_order) values
	('career', 'Andre', '20, Kingston', 'I almost talked myself out of applying. I sent it anyway, and two weeks later I was in my first real interview.', 'Got the callback', 1),
	('career', 'Renee', '23, Spanish Town', 'I stopped waiting to feel ready and messaged one person already doing the work. That single message opened the door.', 'Found a mentor', 2),
	('mindset', 'Tiana', '22, Montego Bay', 'I started writing one honest line each night. The noise got quieter and I could finally hear what I actually wanted.', 'Found her focus', 1),
	('mindset', 'Marcus', '19, Portmore', 'I used to wait for motivation. I tried the two minute version instead, and showing up got easy.', 'Built the habit', 2),
	('money', 'Shanice', '21, Ocho Rios', 'I set aside a little before I could spend it. Small at first, but six months in I had a real cushion.', 'Started saving', 1),
	('money', 'Dwayne', '24, Kingston', 'I finally tracked where my money actually went. Seeing it written down changed every choice after that.', 'Cleared a debt', 2),
	('skills', 'Keisha', '20, May Pen', 'I practiced fifteen minutes a day instead of waiting for a free weekend. The progress added up fast.', 'Shipped her first project', 1),
	('skills', 'Tariq', '22, Mandeville', 'I taught the thing I just learned to a friend. Explaining it once made it finally stick.', 'Landed freelance work', 2),
	('health', 'Aaliyah', '21, Kingston', 'I swapped one habit, not my whole life. Better sleep gave me back the energy I kept saying I didn''t have.', 'Feels steadier', 1),
	('health', 'Jelani', '23, Spanish Town', 'I started with a ten minute walk. It was never about the walk, it was about proving I keep promises to myself.', 'Found his rhythm', 2);
