import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";

// The arcade theme's shared kit. Styles live in index.css under "Arcade theme".

type Tone = "action" | "metal" | "good" | "bad";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  small?: boolean;
}

// a chunky button that presses down onto its lip
export function Button({ tone = "action", small = false, className = "", ...rest }: ButtonProps) {
  const toneClass = tone === "action" ? "" : `ui-button-${tone}`;
  return <button className={`ui-button ${toneClass} ${small ? "ui-button-sm" : ""} ${className}`} {...rest} />;
}

// a flat panel in a silver rim, with a lip below
export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`ui-panel ${className}`}>{children}</div>;
}

// the metal strip across the top of a screen, with the title and counters
export function HeaderBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="ui-header">
      <h1 className="ui-heading flex-1 truncate">{title}</h1>
      {children}
    </header>
  );
}

// a number in a recessed slot; it pops when the value changes
export function Counter({ icon, value }: { icon?: ReactNode; value: number | string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    el.classList.remove("ui-pop");
    void el.offsetWidth;
    el.classList.add("ui-pop");
  }, [value]);
  return (
    <span className="ui-counter">
      {icon}
      <span ref={ref}>{value}</span>
    </span>
  );
}

// a small label plate with the type pill's swept end, in any color
export function Chip({ color, ink, children }: { color?: string; ink?: string; children: ReactNode }) {
  const style = { ...(color && { "--chip": color }), ...(ink && { "--chip-ink": ink }) } as CSSProperties;
  return (
    <span className="ui-chip" style={style}>
      {children}
    </span>
  );
}

// value from 0 to 1
export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const style = { width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`, ...(color && { "--bar": color }) };
  return (
    <div className="ui-progress" role="progressbar" aria-valuenow={Math.round(value * 100)}>
      <span style={style as CSSProperties} />
    </div>
  );
}

export interface Tab<K extends string> {
  key: K;
  label: string;
  icon: ReactNode;
}

export function TabBar<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <nav className="ui-tabbar ui-panel">
      {tabs.map((t) => (
        <button
          key={t.key}
          className="ui-tab"
          aria-current={t.key === active ? "page" : undefined}
          onClick={() => onChange(t.key)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// keeps a demo counter ticking in the kit preview
export function useTicker(start: number, step: number, ms: number) {
  const [n, setN] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setN((v) => v + step), ms);
    return () => clearInterval(id);
  }, [step, ms]);
  return n;
}

// the CSS variables for a set's signature color (used by .ui-set-face and the packs)
export function setVars(set: { color: string; ink: string }): CSSProperties {
  return { "--set": set.color, "--set-ink": set.ink } as CSSProperties;
}
