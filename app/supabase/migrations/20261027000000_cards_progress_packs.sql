-- Applied to the Supabase project via the MCP server on 2026-10-27 (migration "cards_progress_packs").

-- Card catalogue (content lives in the app; this holds what the pack builder needs)
create table public.cards (
  id text primary key,
  stack text not null,
  rarity text not null check (rarity in ('common', 'rare', 'ultra')),
  active boolean not null default true
);

-- One row per card a user has reviewed. Box 1-5 is the Leitner box (shown as foil).
create table public.progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id text not null references public.cards (id) on delete cascade,
  box smallint not null default 1 check (box between 1 and 5),
  due_at timestamptz not null default now(),
  lapses integer not null default 0,
  reviews integer not null default 0,
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);
create index progress_card_id_idx on public.progress (card_id);

-- Every answer, for XP and history
create table public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id text not null references public.cards (id) on delete cascade,
  got_it boolean not null,
  box_before smallint,
  box_after smallint not null,
  xp integer not null default 0,
  reviewed_at timestamptz not null default now()
);
create index reviews_user_time_idx on public.reviews (user_id, reviewed_at);
create index reviews_card_id_idx on public.reviews (card_id);

-- Pack openings drive the streak
create table public.pack_opens (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pack_count smallint not null check (pack_count between 1 and 6),
  opened_at timestamptz not null default now()
);
create index pack_opens_user_time_idx on public.pack_opens (user_id, opened_at);

-- RLS
alter table public.cards enable row level security;
alter table public.progress enable row level security;
alter table public.reviews enable row level security;
alter table public.pack_opens enable row level security;

create policy "signed-in users read the catalogue" on public.cards
  for select to authenticated using (true);

create policy "read own progress" on public.progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own progress" on public.progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own progress" on public.progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "read own reviews" on public.reviews
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own reviews" on public.reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "read own pack opens" on public.pack_opens
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own pack opens" on public.pack_opens
  for insert to authenticated with check ((select auth.uid()) = user_id);

revoke all on public.cards, public.progress, public.reviews, public.pack_opens from anon;
grant select on public.cards to authenticated;
grant select, insert, update on public.progress to authenticated;
grant select, insert on public.reviews, public.pack_opens to authenticated;

-- How long a card waits before its next review. Harder rarities wait less.
create function public.review_interval(p_rarity text, p_box integer)
returns interval
language sql
immutable
set search_path = ''
as $$
  select case p_box
    when 1 then interval '0'
    when 2 then case p_rarity when 'common' then interval '2 days' else interval '1 day' end
    when 3 then case p_rarity when 'common' then interval '5 days' when 'rare' then interval '3 days' else interval '2 days' end
    when 4 then case p_rarity when 'common' then interval '14 days' when 'rare' then interval '7 days' else interval '4 days' end
    else case p_rarity when 'common' then interval '30 days' when 'rare' then interval '21 days' else interval '10 days' end
  end
$$;

-- Got it: up one box. Not yet: back to box 1.
create function public.record_answer(p_card_id text, p_got_it boolean)
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_rarity text;
  v_box smallint;
  v_new smallint;
  v_xp integer;
  v_due timestamptz;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  select c.rarity into v_rarity from public.cards c where c.id = p_card_id;
  if v_rarity is null then
    raise exception 'unknown card %', p_card_id;
  end if;

  select p.box into v_box from public.progress p
  where p.user_id = v_user and p.card_id = p_card_id;

  v_new := case when p_got_it then least(coalesce(v_box, 1) + 1, 5) else 1 end;
  v_xp := case when not p_got_it then 0 when v_rarity = 'common' then 10 when v_rarity = 'rare' then 20 else 30 end;
  v_due := now() + public.review_interval(v_rarity, v_new);

  insert into public.progress as p (user_id, card_id, box, due_at, lapses, reviews, last_reviewed_at)
  values (v_user, p_card_id, v_new, v_due, case when p_got_it then 0 else 1 end, 1, now())
  on conflict (user_id, card_id) do update
    set box = excluded.box,
        due_at = excluded.due_at,
        lapses = p.lapses + excluded.lapses,
        reviews = p.reviews + 1,
        last_reviewed_at = excluded.last_reviewed_at;

  insert into public.reviews (user_id, card_id, got_it, box_before, box_after, xp)
  values (v_user, p_card_id, p_got_it, v_box, v_new, v_xp);

  return json_build_object('box_before', v_box, 'box_after', v_new, 'xp', v_xp, 'due_at', v_due);
end
$$;

-- Builds p_packs packs of 5 slots: Common, Flex, Rare, Rare, Ultra (the boss slot comes last).
-- Each slot prefers its rarity: due cards first, then new cards (hardest first), then anything else.
create function public.open_packs(p_packs integer, p_tz text default 'UTC')
returns table (pack_no integer, slot_no integer, card_key text, card_box smallint)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_slots text[] := array['common', 'flex', 'rare', 'rare', 'ultra'];
  -- anything due before the end of the user's local day counts as due today
  v_end timestamptz := (((now() at time zone p_tz)::date + 1)::timestamp) at time zone p_tz;
  v_picked text[] := '{}';
  v_want text;
  i integer;
  j integer;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;
  if p_packs not between 1 and 6 then
    raise exception 'pack count must be between 1 and 6';
  end if;

  for i in 1..p_packs loop
    for j in 1..5 loop
      v_want := v_slots[j];
      card_key := null;

      select c.id, p.box into card_key, card_box
      from public.cards c
      left join public.progress p on p.card_id = c.id and p.user_id = v_user
      where c.active and not (c.id = any (v_picked))
      order by
        case
          when (v_want = 'flex' or c.rarity = v_want) and p.due_at < v_end then 0
          when (v_want = 'flex' or c.rarity = v_want) and p.card_id is null then 1
          when p.due_at < v_end then 2
          when p.card_id is null then 3
          when c.rarity = v_want then 4
          else 5
        end,
        p.box nulls last,
        p.due_at nulls last,
        case c.rarity when 'ultra' then 0 when 'rare' then 1 else 2 end,
        random()
      limit 1;

      exit when card_key is null;
      v_picked := v_picked || card_key;
      pack_no := i;
      slot_no := j;
      return next;
    end loop;
  end loop;

  insert into public.pack_opens (user_id, pack_count) values (v_user, p_packs);
end
$$;

-- Everything the home screen needs in one call
create function public.get_home(p_tz text default 'UTC')
returns json
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone p_tz)::date;
  v_end timestamptz := ((v_today + 1)::timestamp) at time zone p_tz;
  v_streak integer;
  v_best integer;
  v_opened_today boolean;
  v_result json;
begin
  if v_user is null then
    raise exception 'not signed in';
  end if;

  -- gaps and islands: date minus row number is constant across consecutive days
  with days as (
    select distinct (o.opened_at at time zone p_tz)::date as d
    from public.pack_opens o
    where o.user_id = v_user
  ),
  runs as (
    select max(d) as last_day, count(*)::integer as len
    from (select d, d - (row_number() over (order by d))::integer as grp from days) g
    group by grp
  )
  select
    coalesce((select r.len from runs r where r.last_day >= v_today - 1 order by r.last_day desc limit 1), 0),
    coalesce((select max(r.len) from runs r), 0),
    exists (select 1 from days where d = v_today)
  into v_streak, v_best, v_opened_today;

  select json_build_object(
    'streak', v_streak,
    'best_streak', v_best,
    'opened_today', v_opened_today,
    'total_cards', (select count(*) from public.cards c where c.active),
    'seen', (select count(*) from public.progress p join public.cards c on c.id = p.card_id where c.active and p.user_id = v_user),
    'due_today', (select count(*) from public.progress p join public.cards c on c.id = p.card_id where c.active and p.user_id = v_user and p.due_at < v_end),
    'mastered', (select count(*) from public.progress p join public.cards c on c.id = p.card_id where c.active and p.user_id = v_user and p.box >= 3),
    'xp_total', (select coalesce(sum(r.xp), 0) from public.reviews r where r.user_id = v_user),
    'xp_today', (select coalesce(sum(r.xp), 0) from public.reviews r where r.user_id = v_user and r.reviewed_at >= (v_today::timestamp at time zone p_tz))
  ) into v_result;

  return v_result;
end
$$;

revoke execute on function public.record_answer(text, boolean) from public, anon;
revoke execute on function public.open_packs(integer, text) from public, anon;
revoke execute on function public.get_home(text) from public, anon;
grant execute on function public.record_answer(text, boolean) to authenticated;
grant execute on function public.open_packs(integer, text) to authenticated;
grant execute on function public.get_home(text) to authenticated;
