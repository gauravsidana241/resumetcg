-- Special Art: an extremely rare single-color pull that ignores every other rule.
-- Each pack rolls once: 1 in 150 an EX-FA (an EX card in the Full Art layout, even if locked),
-- otherwise 1 in 40 an FA special (one card in the pack, transformed). The color is random.

create table public.special_pulls (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id text not null references public.cards (id) on delete cascade,
  kind text not null check (kind in ('fa', 'ex-fa')),
  color text not null,
  pulled_at timestamptz not null default now()
);
create index special_pulls_user_idx on public.special_pulls (user_id, pulled_at);
create index special_pulls_card_id_idx on public.special_pulls (card_id);

alter table public.special_pulls enable row level security;

create policy "read own special pulls" on public.special_pulls
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own special pulls" on public.special_pulls
  for insert to authenticated with check ((select auth.uid()) = user_id);

revoke all on public.special_pulls from anon;
grant select, insert on public.special_pulls to authenticated;

drop function public.open_packs(integer, text, text);

-- 10 slots, like a booster: 4 Common, 3 Uncommon, 2 Review (seen cards that are due), and a hit
-- slot that is a Rare, or 1 time in 5 an EX whose base card has reached Gold.
-- Then the Special Art roll, which can transform one card in the pack.
create function public.open_packs(p_packs integer, p_tz text default 'UTC', p_set text default 'resume')
returns table (
  pack_no integer,
  slot_no integer,
  card_key text,
  card_box smallint,
  slot_kind text,
  special_kind text,
  special_color text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_slots text[] := array['common', 'common', 'common', 'common', 'rare', 'rare', 'rare', 'review', 'review', 'hit'];
  v_ex_chance constant double precision := 0.2;
  v_exfa_chance constant double precision := 1.0 / 150;
  v_fa_chance constant double precision := 1.0 / 40;
  v_colors constant text[] := array['red', 'gold', 'black', 'white', 'silver', 'blue', 'green', 'purple', 'rose'];
  -- anything due before the end of the user's local day counts as due today
  v_end timestamptz := (((now() at time zone p_tz)::date + 1)::timestamp) at time zone p_tz;
  v_picked text[] := '{}';
  v_keys text[];
  v_boxes smallint[];
  v_kinds text[];
  v_want text;
  v_rarity text;
  v_key text;
  v_box smallint;
  v_kind text;
  v_roll double precision;
  v_special text;
  v_special_slot integer;
  v_color text;
  n integer;
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
    v_keys := '{}';
    v_boxes := '{}';
    v_kinds := '{}';

    for j in 1..10 loop
      v_want := v_slots[j];
      v_rarity := case v_want when 'hit' then 'ultra' else v_want end;
      v_key := null;
      v_box := null;
      v_kind := case v_want when 'rare' then 'uncommon' else v_want end;

      if v_want = 'hit' and random() < v_ex_chance then
        select c.id, p.box into v_key, v_box
        from public.cards c
        join public.progress bp on bp.card_id = c.base_id and bp.user_id = v_user and bp.box >= 3
        left join public.progress p on p.card_id = c.id and p.user_id = v_user
        where c.active and c.rarity = 'ex' and c.set_id = p_set and not (c.id = any (v_picked))
          and (p.card_id is null or p.due_at < v_end)
        order by p.due_at nulls last, random()
        limit 1;
        if v_key is not null then
          v_kind := 'ex';
        end if;
      end if;

      if v_key is null then
        select c.id, p.box into v_key, v_box
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

      exit when v_key is null;
      v_picked := v_picked || v_key;
      v_keys := v_keys || v_key;
      v_boxes := v_boxes || v_box;
      v_kinds := v_kinds || v_kind;
    end loop;

    n := coalesce(array_length(v_keys, 1), 0);
    exit when n = 0;

    -- Special Art: no unlocks, no foil, no due dates. Pure luck.
    v_special := null;
    v_special_slot := null;
    v_roll := random();
    if v_roll < v_exfa_chance then
      select c.id, p.box into v_key, v_box
      from public.cards c
      left join public.progress p on p.card_id = c.id and p.user_id = v_user
      where c.active and c.rarity = 'ex' and c.set_id = p_set and not (c.id = any (v_picked))
      order by random()
      limit 1;
      if v_key is not null then
        v_special := 'ex-fa';
        v_special_slot := n;
        v_picked := v_picked || v_key;
        v_keys[n] := v_key;
        v_boxes[n] := v_box;
        v_kinds[n] := 'ex';
      end if;
    elsif v_roll < v_exfa_chance + v_fa_chance then
      v_special := 'fa';
      v_special_slot := 1 + floor(random() * n)::integer;
    end if;

    if v_special is not null then
      v_color := v_colors[1 + floor(random() * array_length(v_colors, 1))::integer];
      insert into public.special_pulls (user_id, card_id, kind, color)
      values (v_user, v_keys[v_special_slot], v_special, v_color);
    end if;

    for j in 1..n loop
      pack_no := i;
      slot_no := j;
      card_key := v_keys[j];
      card_box := v_boxes[j];
      slot_kind := v_kinds[j];
      special_kind := case when j = v_special_slot then v_special end;
      special_color := case when j = v_special_slot then v_color end;
      return next;
    end loop;
  end loop;

  insert into public.pack_opens (user_id, pack_count) values (v_user, p_packs);
end
$$;

revoke execute on function public.open_packs(integer, text, text) from public, anon;
grant execute on function public.open_packs(integer, text, text) to authenticated;
