-- 10-card packs with review slots and a Rare-or-EX hit slot, EX cards, and mastery that only
-- grows on reviews that were actually due. Missed cards come back the next day.

-- EX cards are rows of their own that point at the card they follow up
alter table public.cards drop constraint cards_rarity_check;
alter table public.cards add constraint cards_rarity_check check (rarity in ('common', 'rare', 'ultra', 'ex'));
alter table public.cards add column base_id text references public.cards (id) on delete cascade;
create index cards_base_id_idx on public.cards (base_id);

-- Box 1 now waits a day: a missed card returns tomorrow, not later in the same session.
-- EX cards fall into the last branch and wait like Rares.
create or replace function public.review_interval(p_rarity text, p_box integer)
returns interval
language sql
immutable
set search_path = ''
as $$
  select case p_box
    when 1 then interval '1 day'
    when 2 then case p_rarity when 'common' then interval '2 days' else interval '1 day' end
    when 3 then case p_rarity when 'common' then interval '5 days' when 'rare' then interval '3 days' else interval '2 days' end
    when 4 then case p_rarity when 'common' then interval '14 days' when 'rare' then interval '7 days' else interval '4 days' end
    else case p_rarity when 'common' then interval '30 days' when 'rare' then interval '21 days' else interval '10 days' end
  end
$$;

drop function public.record_answer(text, boolean);

-- A correct answer only moves a card up when the card was due (or new). Answering early is
-- practice: logged, but no box change and no XP. A miss always counts.
create function public.record_answer(p_card_id text, p_got_it boolean, p_tz text default 'UTC')
returns json
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_end timestamptz := (((now() at time zone p_tz)::date + 1)::timestamp) at time zone p_tz;
  v_rarity text;
  v_box smallint;
  v_due_at timestamptz;
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

  select p.box, p.due_at into v_box, v_due_at from public.progress p
  where p.user_id = v_user and p.card_id = p_card_id;

  if p_got_it and v_box is not null and v_due_at >= v_end then
    update public.progress p
      set reviews = p.reviews + 1, last_reviewed_at = now()
      where p.user_id = v_user and p.card_id = p_card_id;
    insert into public.reviews (user_id, card_id, got_it, box_before, box_after, xp)
    values (v_user, p_card_id, true, v_box, v_box, 0);
    return json_build_object('box_before', v_box, 'box_after', v_box, 'xp', 0, 'counted', false);
  end if;

  v_new := case when p_got_it then least(coalesce(v_box, 1) + 1, 5) else 1 end;
  v_xp := case
    when not p_got_it then 0
    when v_rarity = 'common' then 10
    when v_rarity = 'rare' then 20
    when v_rarity = 'ultra' then 30
    else 50
  end;
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

  return json_build_object('box_before', v_box, 'box_after', v_new, 'xp', v_xp, 'counted', true);
end
$$;

drop function public.open_packs(integer, text, text);

-- 10 slots, like a booster: 4 Common, 3 Uncommon, 2 Review (seen cards that are due), and a hit
-- slot that is a Rare, or 1 time in 5 an EX whose base card has reached Gold.
create function public.open_packs(p_packs integer, p_tz text default 'UTC', p_set text default 'resume')
returns table (pack_no integer, slot_no integer, card_key text, card_box smallint, slot_kind text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_slots text[] := array['common', 'common', 'common', 'common', 'rare', 'rare', 'rare', 'review', 'review', 'hit'];
  v_ex_chance constant double precision := 0.2;
  -- anything due before the end of the user's local day counts as due today
  v_end timestamptz := (((now() at time zone p_tz)::date + 1)::timestamp) at time zone p_tz;
  v_picked text[] := '{}';
  v_want text;
  v_rarity text;
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
    for j in 1..10 loop
      v_want := v_slots[j];
      v_rarity := case v_want when 'hit' then 'ultra' else v_want end;
      card_key := null;
      card_box := null;
      slot_kind := case v_want when 'rare' then 'uncommon' else v_want end;

      if v_want = 'hit' and random() < v_ex_chance then
        select c.id, p.box into card_key, card_box
        from public.cards c
        join public.progress bp on bp.card_id = c.base_id and bp.user_id = v_user and bp.box >= 3
        left join public.progress p on p.card_id = c.id and p.user_id = v_user
        where c.active and c.rarity = 'ex' and c.set_id = p_set and not (c.id = any (v_picked))
          and (p.card_id is null or p.due_at < v_end)
        order by p.due_at nulls last, random()
        limit 1;
        if card_key is not null then
          slot_kind := 'ex';
        end if;
      end if;

      if card_key is null then
        select c.id, p.box into card_key, card_box
        from public.cards c
        left join public.progress p on p.card_id = c.id and p.user_id = v_user
        where c.active and c.set_id = p_set and not (c.id = any (v_picked))
          -- EX cards only arrive through the hit slot, then come back as reviews when due
          and (c.rarity <> 'ex' or (v_want = 'review' and p.due_at < v_end))
        order by
          case
            when v_want = 'review' then
              case when p.due_at < v_end then 0 when p.card_id is null then 1 else 2 end
            when c.rarity = v_rarity and p.due_at < v_end then 0
            when c.rarity = v_rarity and p.card_id is null then 1
            when p.due_at < v_end then 2
            when p.card_id is null then 3
            when c.rarity = v_rarity then 4
            else 5
          end,
          p.box nulls last,
          p.due_at nulls last,
          -- review slots fill with easy cards when nothing is due; other slots start with hard ones
          case
            when v_want = 'review' then case c.rarity when 'common' then 0 when 'rare' then 1 else 2 end
            else case c.rarity when 'ultra' then 0 when 'rare' then 1 else 2 end
          end,
          random()
        limit 1;
      end if;

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

-- totals and mastery count base cards only; EX cards still count as due reviews
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
    'total_cards', (select count(*) from public.cards c where c.active and c.rarity <> 'ex'),
    'seen', (select count(*) from public.progress p join public.cards c on c.id = p.card_id
             where c.active and c.rarity <> 'ex' and p.user_id = v_user),
    'due_today', (select count(*) from public.progress p join public.cards c on c.id = p.card_id
                  where c.active and p.user_id = v_user and p.due_at < v_end),
    'mastered', (select count(*) from public.progress p join public.cards c on c.id = p.card_id
                 where c.active and c.rarity <> 'ex' and p.user_id = v_user and p.box >= 3),
    'xp_total', (select coalesce(sum(r.xp), 0) from public.reviews r where r.user_id = v_user),
    'xp_today', (select coalesce(sum(r.xp), 0) from public.reviews r
                 where r.user_id = v_user and r.reviewed_at >= (v_today::timestamp at time zone p_tz)),
    'sets', (
      select coalesce(json_object_agg(s.set_id, json_build_object('total', s.total, 'seen', s.seen, 'due', s.due)), '{}'::json)
      from (
        select c.set_id,
          count(*) filter (where c.rarity <> 'ex') as total,
          count(p.card_id) filter (where c.rarity <> 'ex') as seen,
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

revoke execute on function public.record_answer(text, boolean, text) from public, anon;
revoke execute on function public.open_packs(integer, text, text) from public, anon;
grant execute on function public.record_answer(text, boolean, text) to authenticated;
grant execute on function public.open_packs(integer, text, text) to authenticated;
