# Resume TCG

**Interview prep as a trading card game.** Every line of a resume becomes a pack of collectible cards: open a booster, recall the answer, flip the card, and level it up from Plain to Full Art as you master it.

![Home screen](docs/screenshots/home.PNG)

## Why

Flashcard apps work, but they are dull, and generic decks do not cover _your_ projects. Resume TCG builds the deck from one resume, so every card is something an interviewer could actually ask, and wraps spaced repetition in the feel of opening Pokémon-style packs.

## How it plays

|                                                                  |                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![Sealed booster pack](docs/screenshots/pack-sealed.PNG)         | ![Cards revealed from a pack](docs/screenshots/pack-reveal.PNG)     |
| **Open a pack.** Swipe across the top to tear it.                | **Reveal.** Five cards flip one by one; an Ultra Rare gets a flash. |
| ![Card front with the question](docs/screenshots/card-front.PNG) | ![Card back with the answer](docs/screenshots/card-back.PNG)        |
| **Recall.** Read the question and answer it in your head.        | **Flip and grade.** Double tap, compare, then Got it or Not yet.    |

- **Swipe up** for the next card. Swiping without grading skips the card and changes nothing.
- A card you miss comes back once at the end of the pack as a **Second chance**.
- The back of every card ends with a **Weakness**: the follow-up question an interviewer is likely to ask next.

### Packs and sets

Packs always hold **5 cards in fixed slots: Common, Flex, Rare, Rare, Ultra Rare**. You choose how much to study by how much you open:

| Product     | Packs | Cards | Time    |
| ----------- | ----- | ----- | ------- |
| Single Pack | 1     | 5     | ~5 min  |
| Bundle      | 3     | 15    | ~15 min |
| Booster Box | 6     | 30    | ~30 min |

Every pack comes from one **set**. There is one set for the resume itself, and one per skill group, where each group gathers the skills that belong together:

| Set                            | Covers                                                                                                     | Cards |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----- |
| **Resume**                     | Fynd, Workflow Platform, FormHook, and this app (Built With)                                               | 34    |
| **JavaScript & TypeScript**    | TypeScript, JavaScript, React, Next.js, Vue, Redux, Tailwind, Node.js, Express, Vite, Webpack, Jest, Mocha | 15    |
| **Python & ML**                | Machine learning, deep learning, PyTorch, TensorFlow, retrieval, model serving                             | 9     |
| **Data & Databases**           | SQL, PostgreSQL, MySQL, MongoDB, Sequelize, Mongoose                                                       | 8     |
| **APIs & Distributed Systems** | REST, OpenAPI, OAuth 2.0, WebSockets, microservices, event-driven design, Kafka, Temporal, BullMQ, Redis   | 16    |
| **Cloud & DevOps**             | Docker, Kubernetes, Helm, Terraform, Google Cloud, AWS, CI/CD, Git, Bash                                   | 7     |
| **Quality & Observability**    | Contract testing, testing strategy, OpenTelemetry, Grafana                                                 | 5     |

A card never repeats within one opening, so a product only appears for a set with enough cards: a Bundle needs 15, a Booster Box 30.

![Store with the set picker](docs/screenshots/store-sets.PNG)

### Rarity is difficulty, foil is mastery

In a normal card game, rare cards are hard to get. Here that is flipped: **harder cards show up more**, not less.

- **Rarity** (● Common, ◆ Rare, ★ Ultra Rare) is fixed and marks how hard the card is. Every pack is guaranteed an Ultra Rare slot.
- **Foil** is earned. Each card sits in a Leitner box from 1 to 5, shown as **Plain, Silver, Gold, Holo, Full Art**. Got it moves the card up a box; Not yet sends it back to Plain.
- Harder rarities wait less between reviews, so you see them more often:

| Foil     | Common    | Rare      | Ultra Rare |
| -------- | --------- | --------- | ---------- |
| Plain    | next pack | next pack | next pack  |
| Silver   | 2 days    | 1 day     | 1 day      |
| Gold     | 5 days    | 3 days    | 2 days     |
| Holo     | 14 days   | 7 days    | 4 days     |
| Full Art | 30 days   | 21 days   | 10 days    |

![The same card at every foil level](docs/screenshots/foils.jpg)

### Progress

- **Streak:** open at least one pack a day (in your local time zone).
- **XP:** 10, 20 or 30 per correct answer, by rarity.
- **Interview ready:** the share of cards at Gold or better.
- **Binder:** your collection per stack. Cards you have not pulled yet stay face down.

|                                                  |                                        |
| ------------------------------------------------ | -------------------------------------- |
| ![Session summary](docs/screenshots/summary.PNG) | ![Binder](docs/screenshots/binder.jpg) |

## Tech stack

| Layer              | Choice                                                 |
| ------------------ | ------------------------------------------------------ |
| Front end          | React 19, TypeScript, Vite                             |
| Styling and motion | Tailwind CSS 4, Motion (card flip, tilt, pack tearing) |
| Back end           | Supabase: Postgres, Row Level Security, Auth           |
| App shell          | PWA (installable, full screen on a phone)              |

The game logic lives in Postgres functions rather than the client:

- `open_packs(packs, tz, set)` fills each slot with the right rarity: due cards first, then new cards hardest first, then anything else
- `record_answer(card, got_it)` moves the card between boxes, schedules the next review and logs XP
- `get_home(tz)` returns the streak (a gaps-and-islands query), due counts and per-set stats in one call

Every table has RLS, so each user only ever sees their own progress.

## Running it locally

```bash
cd app
npm install
npm run dev
```

Create `app/.env.local`:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# true: email sign-in, progress shared across devices. false: anonymous, one browser only.
VITE_AUTH_ENABLED=true
```

Set up the database by running, in order:

1. `app/supabase/migrations/20261027000000_cards_progress_packs.sql`
2. `app/supabase/migrations/20261028000000_card_sets.sql`
3. `app/supabase/seed.sql`

In the Supabase dashboard, set the Site URL (Authentication, URL Configuration) to where the app runs, so sign-up confirmation links land in the right place. With `VITE_AUTH_ENABLED=false`, turn on anonymous sign-ins instead (Authentication, Sign In / Providers).

## Editing the deck

All card text lives in [`app/src/data/cards.json`](app/src/data/cards.json): sets, stacks and cards.

- Changing text needs nothing else.
- Adding, removing or changing the rarity of cards: run `npm run seed:build` (it validates the deck and rewrites `supabase/seed.sql`), then run the seed against the database.
- Keep card ids stable. Progress is stored per id.
- Open **`/#deck`** to see every card front and back, no sign-in needed.

## Project layout

```
app/
  src/
    data/cards.json        the deck
    components/TcgCard.tsx the card: layout, flip, tilt, foils
    screens/               Home (store), PackOpening, StudySession, Summary, Binder, Auth, DeckPreview
    lib/api.ts             calls to the Postgres functions
  supabase/
    migrations/            schema, RLS and functions
    seed.sql               generated card catalogue
  scripts/build-seed.mjs   deck validator and seed generator
```

## Future scope

- **Bring your own resume.** Upload a PDF, parse it, and generate stacks and cards automatically.
- **Review before you play.** A form, like a job application, pre-filled from the parsed resume, where you check and correct the extracted details (roles, dates, metrics, stack) before any cards are generated.
- **Accounts.** Add Google sign-in alongside email.
- **Fuller skill sets.** More cards per skill group, including syntax and gotcha cards with code, so every set can fill a Bundle and a Booster Box.
- **Answer modes.** Type or speak an answer and get AI feedback, plus a timed Mock Interview mode with no flipping.
- **Offline play.** Cache packs and sync answers when you are back online.
- **Card art.** Memes and custom art in the art box, not only logos.
