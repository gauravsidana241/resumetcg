import { cards, sets } from "../data/catalog";
import type { AnswerResult, PulledCard } from "../types";
import { BinderScreen } from "./BinderScreen";
import { HomeScreen } from "./HomeScreen";
import { PackOpening } from "./PackOpening";
import { StudySession } from "./StudySession";
import { SummaryScreen } from "./SummaryScreen";

// Open /#screens to see the real screens with sample data, without signing in.
// Pick one with ?s=home|binder|opening|study|summary before the hash, and a set with &set=<id>.
const pack: PulledCard[] = cards.slice(40, 50).map((card, i) => ({
  card,
  box: i % 3 === 0 ? null : 1,
  slot: i === 9 ? "hit" : i === 8 ? "review" : "common",
}));

const results: AnswerResult[] = pack.map((p, i) => ({
  card: p.card,
  gotIt: i % 4 !== 0,
  boxBefore: p.box,
  boxAfter: i % 4 !== 0 ? 2 : 0,
  xp: i % 4 !== 0 ? 10 : 0,
  counted: true,
}));

export function ScreensPreview() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get("s") ?? "home";
  const set = sets.find((x) => x.id === params.get("set")) ?? sets[0];
  const noop = () => {};
  switch (screen) {
    case "binder":
      return <BinderScreen />;
    case "opening":
      return <PackOpening set={set} pack={pack} label={set.name} onDone={noop} />;
    case "study":
      return <StudySession pack={pack} label={sets[0].name} onDone={noop} onQuit={noop} />;
    case "summary":
      return <SummaryScreen results={results} specials={[]} onHome={noop} />;
    default:
      return <HomeScreen onOpen={async () => {}} />;
  }
}
