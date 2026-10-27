-- Adds card sets (resume, plus one per skill group) and a set filter for packs.
-- Run this, then supabase/seed.sql, which tags every card with its set.

-- Cards belong to a set. Packs are opened from one set.
alter table public.cards add column set_id text not null default 'resume';
create index cards_set_id_idx on public.cards (set_id);

drop function public.open_packs(integer, text);

create function public.open_packs(p_packs integer, p_tz text default 'UTC', p_set text default 'resume')
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
      where c.active and c.set_id = p_set and not (c.id = any (v_picked))
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

revoke execute on function public.open_packs(integer, text, text) from public, anon;
grant execute on function public.open_packs(integer, text, text) to authenticated;

-- get_home gains per-set counts for the store
create or replace function public.get_home(p_tz text default 'UTC')
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
    'xp_today', (select coalesce(sum(r.xp), 0) from public.reviews r where r.user_id = v_user and r.reviewed_at >= (v_today::timestamp at time zone p_tz)),
    'sets', (
      select coalesce(json_object_agg(s.set_id, json_build_object('total', s.total, 'seen', s.seen, 'due', s.due)), '{}'::json)
      from (
        select c.set_id,
          count(*) as total,
          count(p.card_id) as seen,
          count(*) filter (where p.due_at < v_end) as due
        from public.cards c
        left join public.progress p on p.card_id = c.id and p.user_id = v_user
        where c.active
        group by c.set_id
      ) s
    )
  ) into v_result;

  return v_result;
end
$$;
