import { getCard } from '../data/catalog'
import type { AnswerResult, Card, CardProgress, HomeStats, PulledCard } from '../types'
import { supabase } from './supabase'

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

export async function openPacks(count: number, setId: string): Promise<PulledCard[][]> {
  const { data, error } = await supabase.rpc('open_packs', { p_packs: count, p_tz: tz, p_set: setId })
  if (error) throw error

  const packs: PulledCard[][] = []
  for (const row of data) {
    const card = getCard(row.card_key)
    // the database may know a card the app bundle no longer ships
    if (!card) continue
    ;(packs[row.pack_no - 1] ??= []).push({ card, box: row.card_box })
  }
  return packs.filter(Boolean)
}

export async function recordAnswer(card: Card, gotIt: boolean): Promise<AnswerResult> {
  const { data, error } = await supabase.rpc('record_answer', { p_card_id: card.id, p_got_it: gotIt })
  if (error) throw error
  const result = data as { box_before: number | null; box_after: number; xp: number }
  return { card, gotIt, boxBefore: result.box_before, boxAfter: result.box_after, xp: result.xp }
}

export async function getHome(): Promise<HomeStats> {
  const { data, error } = await supabase.rpc('get_home', { p_tz: tz })
  if (error) throw error
  return data as unknown as HomeStats
}

export async function getProgress(): Promise<Map<string, CardProgress>> {
  const { data, error } = await supabase.from('progress').select('card_id, box, due_at')
  if (error) throw error
  return new Map(data.map((row) => [row.card_id, { box: row.box, due_at: row.due_at }]))
}
