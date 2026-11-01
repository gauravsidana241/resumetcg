import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// How far the shape leans right: the top runs ahead of the bottom by this much per pixel of height
const SLANT = 0.27;
// rim thickness along the top and bottom
const EDGE = 2;
// corner rounding: each shape is drawn inset by this much, then stroked in its own paint with round
// joins, which rounds every corner (even the sharp tips of the "(" curves) by the same radius
const ROUND_OUTER = 2.5;
const ROUND_INNER = 2;
// the default end shape as a share of the plate's height, capped for tall boxes
const BOW_RATIO = 0.35;
const RIM_RATIO = 0.28;
const MAX_BOW = 8;
const MAX_RIM = 7;

interface Props {
  // how far each "(" end bows left, and how thick the rim is at the middle of each end; both scale
  // with the plate's height by default, so every plate reads as the same metal at its own size
  bow?: number;
  rim?: number;
  // the right end: "(" curving inward (shallower than the left, so it doesn't pinch),
  // or ")" mirroring the left end
  rightEnd?: "inward" | "mirror";
  // the ex rule box: a label tab in the top-left corner, joined to the rim, this wide and tall
  label?: { w: number; h: number };
  // the rim casts an inner shadow so the inside reads as recessed (always on with a label)
  inset?: boolean;
  className?: string;
  children: ReactNode;
}

// A slanted plate drawn as an SVG at its real size, so the curves never stretch. The ends are "("
// curves with a thick crescent rim, with a thinner rim along the top and bottom. The rim uses the
// card's border colors (--rim-1 to --rim-4, top to bottom); the inside is the same gradient, lighter.
export function Plate({
  bow,
  rim,
  rightEnd = "inward",
  label,
  inset = !!label,
  className = "",
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const id = useId();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize([el.offsetWidth, el.offsetHeight]);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const paths = size && size[0] > 0 ? platePaths(
          size[0],
          size[1],
          bow ?? Math.min(size[1] * BOW_RATIO, MAX_BOW),
          rim ?? Math.min(size[1] * RIM_RATIO, MAX_RIM),
          rightEnd,
          label,
        ) : null;

  return (
    <div ref={ref} className={`plate ${className}`}>
      {size && paths && (
        <svg
          className="plate-svg"
          width={size[0]}
          height={size[1]}
          viewBox={`0 0 ${size[0]} ${size[1]}`}
          aria-hidden
        >
          <defs>
            <RimGradient id={`${id}rim`} height={size[1]} />
            <RimGradient id={`${id}in`} height={size[1]} inside />
            {/* light from the top left: the rim and label cast a shadow down and right */}
            <filter
              id={`${id}shadow`}
              filterUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={size[0]}
              height={size[1]}
            >
              <feDropShadow dx="1.2" dy="1.6" stdDeviation="1.1" floodColor="black" floodOpacity="0.5" />
            </filter>
            {inset && (
              <>
                {/* the rim alone: the outer shape with the inside cut out */}
                <mask id={`${id}ring`} maskUnits="userSpaceOnUse" x="0" y="0" width={size[0]} height={size[1]}>
                  <Shape d={paths.outer} paint="white" round={ROUND_OUTER} />
                  <Shape d={paths.inner} paint="black" round={ROUND_INNER} />
                </mask>
                {/* the inside alone, so the shadow only lands there */}
                <mask id={`${id}inside`} maskUnits="userSpaceOnUse" x="0" y="0" width={size[0]} height={size[1]}>
                  <Shape d={paths.inner} paint="white" round={ROUND_INNER} />
                </mask>
              </>
            )}
          </defs>
          <Shape d={paths.outer} paint={`url(#${id}rim)`} round={ROUND_OUTER} />
          <Shape d={paths.inner} paint={`url(#${id}in)`} round={ROUND_INNER} />
          {/* the ex rule box: the rim and the label tab (in the rim's paint, so they read as one piece)
              cast one shadow, kept to the inside so it reads as recessed; then the tab on top */}
          {inset && (
            <g mask={`url(#${id}inside)`}>
              <g filter={`url(#${id}shadow)`}>
                <g mask={`url(#${id}ring)`}>
                  <Shape d={paths.outer} paint={`url(#${id}rim)`} round={ROUND_OUTER} />
                </g>
                {paths.tab && <Shape d={paths.tab} paint={`url(#${id}rim)`} round={ROUND_INNER} />}
              </g>
            </g>
          )}
          {paths.tab && <Shape d={paths.tab} paint={`url(#${id}rim)`} round={ROUND_INNER} />}
        </svg>
      )}
      {children}
    </div>
  );
}

function Shape({ d, paint, round }: { d: string; paint: string; round: number }) {
  return <path d={d} fill={paint} stroke={paint} strokeWidth={round * 2} strokeLinejoin="round" />;
}

// the border's metal, top to bottom; the inside mixes each stop into the lighter --plate color,
// unless a palette sets its own inside stops (--in-1 to --in-4)
function RimGradient({ id, height, inside = false }: { id: string; height: number; inside?: boolean }) {
  const stop = (n: number) =>
    inside
      ? `var(--in-${n}, color-mix(in oklab, var(--rim-${n}) 40%, var(--plate)))`
      : `var(--rim-${n})`;
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
      <stop offset="0" style={{ stopColor: stop(1) }} />
      <stop offset="0.38" style={{ stopColor: stop(2) }} />
      <stop offset="0.52" style={{ stopColor: stop(3) }} />
      <stop offset="1" style={{ stopColor: stop(4) }} />
    </linearGradient>
  );
}

function platePaths(
  w: number,
  h: number,
  bow: number,
  rim: number,
  rightEnd: "inward" | "mirror",
  label?: { w: number; h: number },
) {
  // lean every point right in proportion to its height above the bottom
  const P = (x: number, y: number) => `${(x + SLANT * (h - y)).toFixed(2)} ${y.toFixed(2)}`;
  // the shape's width before leaning, so the leaned top still ends at the right edge
  const W = w - SLANT * h;
  const b = bow;

  // a shape with "(" ends: each end runs from its tip (top and bottom) to its middle point;
  // a quadratic curve through the middle uses a control point at twice the bow
  const shape = (
    top: number,
    bottom: number,
    leftTip: number,
    leftMid: number,
    rightTip: number,
    rightMid: number,
  ) =>
    [
      `M ${P(leftTip, top)}`,
      `L ${P(rightTip, top)}`,
      `Q ${P(2 * rightMid - rightTip, h / 2)} ${P(rightTip, bottom)}`,
      `L ${P(leftTip, bottom)}`,
      `Q ${P(2 * leftMid - leftTip, h / 2)} ${P(leftTip, top)}`,
      "Z",
    ].join(" ");

  const o = ROUND_OUTER;
  const i = ROUND_INNER;
  const mirror = rightEnd === "mirror";
  // the inward right end bows less, with a thinner rim, than the left
  const rb = mirror ? b : b * 0.5;
  const rr = mirror ? rim : rim * 0.8;

  const outer = mirror
    ? shape(o, h - o, b + o, o, W - b - o, W - o)
    : shape(o, h - o, b + o, o, W - o, W - rb - o);

  // inside: in from the top and bottom by EDGE, and a crescent rim at each end
  const inner = mirror
    ? shape(EDGE + i, h - EDGE - i, b + EDGE + i, rim + i, W - b - EDGE - i, W - rim - i)
    : shape(EDGE + i, h - EDGE - i, b + EDGE + i, rim + i, W - EDGE - i, W - rb - rr - i);

  // the label tab: from the left rim along the top, ending in the type pill's swept S-curve,
  // from the top-right corner down to a bottom that stops `sw` short
  const sw = 14;
  const lh = label ? label.h - 2 * i : 0;
  const tab =
    label &&
    [
      `M ${P(b + i, i)}`,
      `L ${P(label.w - i, i)}`,
      `C ${P(label.w - i - 1, i + lh * 0.62)} ${P(label.w - i - sw + 1, i + lh * 0.38)} ${P(label.w - i - sw, label.h - i)}`,
      // the bottom edge runs on into the left rim, so its corner is buried in the matching paint
      `L ${P(i + 1, label.h - i)}`,
      "Z",
    ].join(" ");

  return { outer, inner, tab };
}
