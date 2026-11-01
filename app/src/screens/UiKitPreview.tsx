import { useState } from "react";
import { BinderIcon, CheckIcon, FlameIcon, HomeIcon, RotateIcon } from "../components/Icons";
import { TcgCard } from "../components/TcgCard";
import { Button, Chip, Counter, HeaderBar, Panel, ProgressBar, TabBar, useTicker } from "../components/ui";
import { getCard, sets } from "../data/catalog";
import { TYPE_META } from "../lib/meta";

// The arcade theme's kit, for review before any screen moves to it. Shown at the top of /#preview.
export function UiKitPreview() {
  const [tab, setTab] = useState<"home" | "binder">("home");
  const xp = useTicker(1240, 10, 1500);
  const set = sets[1] ?? sets[0];

  return (
    <section className="ui-table -mx-4 -mt-8 flex flex-col gap-8 px-4 py-8" data-card="ui-kit">
      <div>
        <h2 className="ui-heading text-4xl">Arcade theme: UI kit</h2>
        <p className="text-sm text-[var(--ui-ink-soft)]">
          Lilita One headings, Cabin body, Barlow labels. Flat navy table, silver-rimmed panels, buttons with a lip.
        </p>
      </div>

      <div className="flex flex-wrap gap-10">
        {/* a mock Home screen, to judge the pieces together */}
        <div className="flex w-[380px] flex-col gap-4" data-card="ui-mock-home">
          <HeaderBar title="Card Desk">
            <Counter icon={<FlameIcon className="size-4 text-orange-400" />} value={7} />
            <Counter value={`${xp} XP`} />
          </HeaderBar>

          <Panel className="flex flex-col gap-3 p-4">
            <div
              className="flex h-24 items-end rounded-[10px] p-3"
              style={{ background: `linear-gradient(135deg, ${set.from}, ${set.to})` }}
            >
              <h3 className="ui-heading text-2xl drop-shadow-[0_2px_0_rgb(0_0_0_/_0.4)]">{set.name}</h3>
            </div>
            <p className="text-sm text-[var(--ui-ink-soft)]">{set.tagline}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={0.62} />
              </div>
              <span className="ui-heading text-sm">62%</span>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1">Open pack</Button>
              <Button tone="metal">x5</Button>
            </div>
          </Panel>

          <TabBar
            tabs={[
              { key: "home", label: "Home", icon: <HomeIcon className="size-6" /> },
              { key: "binder", label: "Binder", icon: <BinderIcon className="size-6" /> },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {/* a mock study screen */}
        <div className="flex w-[380px] flex-col gap-4" data-card="ui-mock-study">
          <HeaderBar title="Study">
            <Counter value="4 / 10" />
          </HeaderBar>
          <ProgressBar value={0.4} color={TYPE_META.concept.color} />
          <div className="flex justify-center">
            <div style={{ zoom: 0.8 }}>
              <TcgCard card={getCard("fe-ts-basics")!} foil={0} still />
            </div>
          </div>
          <div className="flex gap-3">
            <Button tone="bad" className="flex-1">
              <RotateIcon className="size-5" /> Again
            </Button>
            <Button tone="good" className="flex-1">
              <CheckIcon className="size-5" /> Got it
            </Button>
          </div>
        </div>

        {/* every piece on its own */}
        <div className="flex w-[380px] flex-col gap-5" data-card="ui-pieces">
          <Panel className="flex flex-col gap-3 p-4">
            <p className="ui-label text-sm text-[var(--ui-ink-soft)]">Buttons</p>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button tone="metal">Metal</Button>
              <Button tone="good">Good</Button>
              <Button tone="bad">Bad</Button>
              <Button small>Small</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3 p-4">
            <p className="ui-label text-sm text-[var(--ui-ink-soft)]">Chips in energy colors</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(TYPE_META).map((t) => (
                <Chip key={t.label} color={t.color} ink={t.ink}>
                  {t.label}
                </Chip>
              ))}
              <Chip>New</Chip>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-3 p-4">
            <p className="ui-label text-sm text-[var(--ui-ink-soft)]">Progress</p>
            {Object.values(TYPE_META)
              .slice(0, 4)
              .map((t, i) => (
                <ProgressBar key={t.label} value={0.25 + i * 0.22} color={t.color} />
              ))}
          </Panel>

          <Panel className="flex flex-col gap-2 p-4">
            <p className="ui-label text-sm text-[var(--ui-ink-soft)]">Type</p>
            <p className="ui-heading text-3xl">Lilita One heading</p>
            <p className="text-[15px]">Cabin body text, solid white, readable at a glance.</p>
            <p className="text-sm text-[var(--ui-ink-soft)]">Secondary text is a soft blue-white, not gray.</p>
          </Panel>
        </div>
      </div>
    </section>
  );
}
