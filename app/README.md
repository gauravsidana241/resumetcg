# Resume TCG

Interview prep as a trading card game. Every card is a question an interviewer could ask about the resume.

## Run it

```
npm install
npm run dev
```

Needs `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

## How it works

- **Packs** are 5 cards in fixed slots: Common, Flex, Rare, Rare, Ultra Rare. A Single is 1 pack, a Bundle 3, a Booster Box 6.
- **Rarity** is difficulty. **Foil** is mastery: Leitner boxes 1 to 5 shown as Plain, Silver, Gold, Holo, Full Art.
- **Got it** moves a card up a box; **Not yet** sends it back to box 1, and it comes back once at the end of the pack.
- Harder rarities wait less between reviews (`review_interval` in the migration).
- **Streak** counts consecutive local days with at least one pack opened.

## Where things live

| Path | What |
|---|---|
| `src/data/cards.json` | The whole deck: stacks and card text |
| `supabase/migrations/` | Tables, RLS policies and the `open_packs`, `record_answer`, `get_home` functions |
| `scripts/build-seed.mjs` | Validates the deck and writes `supabase/seed.sql` |
| `src/screens/` | Auth, Home (store), PackOpening, StudySession, Summary, Binder |
| `src/components/TcgCard.tsx` | The card: layout, flip, tilt, foils |

## Editing cards

Edit `src/data/cards.json`. Changing text needs nothing else. If you add, remove or re-rarity cards, run `npm run seed:build` and run `supabase/seed.sql` against the database so the pack builder knows about them. Keep card ids stable: progress is stored per id.
