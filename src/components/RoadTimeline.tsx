import { useMemo, useState } from 'react';
import type { Phase, Race } from '../types/training';
import { addDays, daysBetween, todayInMexicoCity } from '../lib/dates';
import { formatDate, formatMonthYear } from '../lib/format';

interface Props {
  phases: Phase[];
  races: Race[];
}

// viewBox geometry. The road's vertical position is the training-LOAD profile
// (not decoration): builds climb, deloads dip, breaks are the valleys, and the
// line trends up with progressive overload toward London.
const VB_W = 1180;
const VB_H = 372;
const RULER_Y = 356;
const MARGIN_X = 46;
const MID_Y = 170;
const AMP = 62;
const ROAD_W = VB_W - MARGIN_X * 2;

function xAt(t: number): number {
  return MARGIN_X + t * ROAD_W;
}
// Map a load level (0 = rest, 1 = peak) to a y coordinate (higher load = higher up).
function elevToY(e: number): number {
  return MID_Y + AMP * (1 - 2 * e);
}

// Relative load by block kind; a progressive-overload trend is added on top.
type Load = 'break' | 'deload' | 'ramp' | 'build';
const LOAD_BASE: Record<Load, number> = { break: 0.12, deload: 0.34, ramp: 0.56, build: 0.74 };
function classifyLoad(p: Phase): Load {
  if (p.kind === 'break') return 'break';
  if (/deload/i.test(p.label)) return 'deload';
  if (/ramp|return/i.test(p.label)) return 'ramp';
  return 'build';
}

interface ElevPoint {
  t: number;
  e: number;
}

/** Smoothstep interpolation of load over control points → the elevation curve. */
function makeYAt(points: ElevPoint[]): (t: number) => number {
  return (tt: number) => {
    if (tt <= points[0]!.t) return elevToY(points[0]!.e);
    const last = points[points.length - 1]!;
    if (tt >= last.t) return elevToY(last.e);
    let i = 0;
    while (i < points.length - 1 && points[i + 1]!.t < tt) i++;
    const a = points[i]!;
    const b = points[i + 1]!;
    const u = (tt - a.t) / (b.t - a.t);
    const s = u * u * (3 - 2 * u);
    return elevToY(a.e + (b.e - a.e) * s);
  };
}

const PHASE_COLOR: Record<string, string> = {
  done: 'var(--jacaranda)',
  current: 'var(--dawn)',
  planned: 'var(--ink-3)',
};

export function RoadTimeline({ phases, races }: Props) {
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const model = useMemo(() => {
    // Domain: crop to the training window — start ~2 weeks before the first
    // block so the empty pre-training months don't eat ~40% of the width.
    // Chicago (well before this) clamps to the left edge as the origin anchor.
    const datedRaces = races.filter((r) => r.date) as (Race & { date: string })[];
    const sortedRaces = [...datedRaces].sort((a, b) => (a.date < b.date ? -1 : 1));
    const sortedPhases = [...phases].sort((a, b) => (a.start < b.start ? -1 : 1));
    const firstPhaseStart = sortedPhases[0]?.start;
    const startIso = firstPhaseStart
      ? addDays(firstPhaseStart, -14)
      : (sortedRaces[0]?.date ?? todayInMexicoCity());
    const endIso =
      sortedRaces[sortedRaces.length - 1]?.date ?? phases[phases.length - 1]?.end ?? startIso;
    const total = Math.max(1, daysBetween(startIso, endIso));
    const t = (iso: string) => Math.min(1, Math.max(0, daysBetween(startIso, iso) / total));

    // Each phase is a colored segment plus a hover/tap dot at its midpoint;
    // the name is revealed on interaction (see the accessible list for the
    // always-available text version).
    const phaseSegs = phases.map((p) => {
      const tMid = t(p.start) + (t(p.end) - t(p.start)) / 2;
      return { phase: p, t0: t(p.start), t1: t(p.end), tMid };
    });

    // Elevation = training load. Control points: the Chicago origin (base
    // fitness), each block at its midpoint (load by kind + progressive-overload
    // trend), and London as the summit finish.
    const OVERLOAD_TREND = 0.16;
    const n = sortedPhases.length;
    const elevPoints: ElevPoint[] = [{ t: 0, e: 0.32 }];
    sortedPhases.forEach((p, i) => {
      const progress = n > 1 ? i / (n - 1) : 0;
      let e = LOAD_BASE[classifyLoad(p)] + OVERLOAD_TREND * progress;
      if (p.highlight) e = Math.max(e, 0.94); // London build = the big final climb
      e = Math.min(1, Math.max(0.08, e));
      const tMid = t(p.start) + (t(p.end) - t(p.start)) / 2;
      elevPoints.push({ t: tMid, e });
    });
    elevPoints.push({ t: 1, e: 0.98 }); // London race — the summit
    elevPoints.sort((a, b) => a.t - b.t);
    const yAt = makeYAt(elevPoints);

    const pathBetween = (t0: number, t1: number, steps = 60): string => {
      const span = t1 - t0;
      const count = Math.max(2, Math.round(steps * Math.max(span, 0.02)));
      let d = '';
      for (let i = 0; i <= count; i++) {
        const tt = t0 + (span * i) / count;
        d += `${i === 0 ? 'M' : 'L'}${xAt(tt).toFixed(2)} ${yAt(tt).toFixed(2)}`;
      }
      return d;
    };

    // Month ticks (~ every 2 months) as "distance markers".
    const ticks: { t: number; iso: string }[] = [];
    const [sy, sm] = startIso.split('-').map(Number);
    let y = sy!;
    let m = sm!;
    for (let i = 0; i < 40; i++) {
      const iso = `${y}-${String(m).padStart(2, '0')}-01`;
      if (daysBetween(startIso, iso) >= 0 && daysBetween(iso, endIso) >= 0) {
        ticks.push({ t: t(iso), iso });
      }
      m += 2;
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      if (daysBetween(iso, endIso) < 0) break;
    }

    const today = todayInMexicoCity();
    const tToday = t(today);
    const beforeStart = daysBetween(startIso, today) < 0;
    const afterEnd = daysBetween(today, endIso) < 0;

    return {
      startIso,
      endIso,
      t,
      yAt,
      pathBetween,
      phaseSegs,
      ticks,
      tToday,
      beforeStart,
      afterEnd,
      sortedRaces,
    };
  }, [phases, races]);

  const raceFlag = (r: Race & { date: string }) => {
    const t = model.t(r.date);
    const x = xAt(t);
    const yr = model.yAt(t);
    const isGoal = r.is_goal_race;
    const isDone = r.status === 'completed';
    // Races before the cropped domain (Chicago) sit at the left edge as the origin;
    // show their date, use a shorter label, and fly the flag higher so it clears
    // the phase labels crowding the left of the route.
    const isOrigin = r.date < model.startIso;
    const flagY = yr - (isOrigin ? 108 : 82);
    const name = isOrigin
      ? r.name.split(' ')[0]!
      : r.name.split('—')[0]!.split('(')[0]!.trim();
    return (
      <g key={r.id} className="road__race">
        <line x1={x} y1={yr} x2={x} y2={flagY} className="road__flagpole" />
        <circle cx={x} cy={yr} r={5.5} className="road__flagdot" />
        <text
          x={x}
          y={flagY - 8}
          className={`road__flaglabel${isGoal ? ' road__flaglabel--goal' : ''}`}
          textAnchor={t > 0.9 ? 'end' : t < 0.1 ? 'start' : 'middle'}
        >
          <tspan className="road__flagicon">{isGoal ? '🏁' : isDone ? '🏅' : '🚩'}</tspan>{' '}
          {name}
          {isOrigin && (
            <tspan className="road__flagdate"> · {formatMonthYear(r.date)}</tspan>
          )}
        </text>
      </g>
    );
  };

  return (
    <section className="section" id="the-road" aria-labelledby="road-title">
      <div className="section__head">
        <span className="section__kicker">§ the road</span>
        <h2 id="road-title" className="section__title">
          Grant Park → Greenwich Park
        </h2>
      </div>
      <p className="section__lede">
        One route from Chicago 2025 to London 2027. Height is training load — builds climb,
        deloads dip, breaks are the valleys — rising toward London. Builds in jacaranda, the
        current block lit amber, breaks dashed, what's planned held quiet.
      </p>

      <div className="road" role="group" aria-label="Training phase timeline as a route; elevation is training load">
        <div className="road__scroll">
          <svg
            className="road__svg"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="img"
            aria-label={`Training route from ${formatDate(model.startIso)} to ${formatDate(
              model.endIso,
            )}, where elevation shows relative training load`}
          >
            {/* Load-axis hint, pinned to the top-left corner */}
            <text x={MARGIN_X - 8} y={20} className="road__axishint" textAnchor="start">
              ↑ more load
            </text>

            {/* Roadbed */}
            <path d={model.pathBetween(0, 1, 160)} className="road__bed" />
            <path d={model.pathBetween(0, 1, 160)} className="road__center" />

            {/* Month markers on a fixed bottom ruler — the "distance scale" */}
            <line x1={MARGIN_X} y1={RULER_Y - 12} x2={VB_W - MARGIN_X} y2={RULER_Y - 12} className="road__ruler" />
            {model.ticks.map((tk) => {
              const x = xAt(tk.t);
              return (
                <g key={tk.iso} className="road__tick">
                  <line x1={x} y1={RULER_Y - 16} x2={x} y2={RULER_Y - 10} />
                  <text x={x} y={RULER_Y} textAnchor="middle" className="road__ticklabel">
                    {formatMonthYear(tk.iso)}
                  </text>
                </g>
              );
            })}

            {/* Phase segments + hover/tap dots (names revealed on interaction) */}
            {model.phaseSegs.map(({ phase, t0, t1, tMid }) => {
              const isBreak = phase.kind === 'break';
              const color = PHASE_COLOR[phase.status] ?? 'var(--ink-3)';
              const cx = xAt(tMid);
              const cy = model.yAt(tMid);
              const isActive = activePhase === phase.id;
              return (
                <g key={phase.id}>
                  <path
                    d={model.pathBetween(t0, t1)}
                    className={`road__phase${isBreak ? ' road__phase--break' : ''}${
                      phase.highlight ? ' road__phase--highlight' : ''
                    }`}
                    style={{ stroke: color }}
                  />
                  {isActive && (
                    <circle className="road__dot-ring" cx={cx} cy={cy} r={9} style={{ stroke: color }} />
                  )}
                  <circle className="road__dot" cx={cx} cy={cy} r={isActive ? 5.5 : 4} style={{ fill: color }} />
                  <circle
                    className="road__dot-hit"
                    cx={cx}
                    cy={cy}
                    r={16}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${phase.label}, ${formatDate(phase.start)} to ${formatDate(
                      phase.end,
                    )}, ${phase.status}`}
                    onMouseEnter={() => setActivePhase(phase.id)}
                    onMouseLeave={() => setActivePhase((cur) => (cur === phase.id ? null : cur))}
                    onFocus={() => setActivePhase(phase.id)}
                    onBlur={() => setActivePhase((cur) => (cur === phase.id ? null : cur))}
                    onClick={() => setActivePhase((cur) => (cur === phase.id ? null : phase.id))}
                  />
                </g>
              );
            })}

            {/* Race flags */}
            {model.sortedRaces.map(raceFlag)}

            {/* You are here */}
            {!model.beforeStart && !model.afterEnd && (
              <g className="road__here" transform={`translate(${xAt(model.tToday)} ${model.yAt(model.tToday)})`}>
                <line x1={0} y1={-8} x2={0} y2={-92} className="road__here-leader" />
                <circle r={7} className="road__here-dot" />
                <rect x={-49} y={-108} width={98} height={19} rx={9.5} className="road__here-pill" />
                <text y={-95} textAnchor="middle" className="road__here-label">
                  you are here
                </text>
                <text y={5} textAnchor="middle" className="road__here-run" aria-hidden="true">
                  🏃
                </text>
              </g>
            )}

            {/* Phase name tooltip (on hover/tap/focus of a dot) */}
            {(() => {
              const seg = model.phaseSegs.find((s) => s.phase.id === activePhase);
              if (!seg) return null;
              const p = seg.phase;
              const cx = xAt(seg.tMid);
              const cy = model.yAt(seg.tMid);
              const line1 = p.label;
              const line2 = `${formatDate(p.start)} – ${formatDate(p.end)} · ${p.status}`;
              const w = Math.max(line1.length, line2.length) * 6.7 + 26;
              const h = 44;
              const above = cy - h - 18 > 2;
              const boxY = above ? cy - h - 16 : cy + 16;
              const boxX = Math.min(Math.max(cx - w / 2, 6), VB_W - w - 6);
              return (
                <g className="road__tip" pointerEvents="none">
                  <rect x={boxX} y={boxY} width={w} height={h} rx={8} className="road__tipbox" />
                  <text x={boxX + 13} y={boxY + 19} className="road__tiptitle">
                    {line1}
                  </text>
                  <text x={boxX + 13} y={boxY + 35} className="road__tipmeta">
                    {line2}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Accessible / print fallback: the same journey as an ordered list. */}
      <ol className="road__legend visually-hidden">
        {model.phaseSegs.map(({ phase }) => (
          <li key={phase.id}>
            {phase.label}: {formatDate(phase.start)}–{formatDate(phase.end)} ({phase.status})
          </li>
        ))}
      </ol>
    </section>
  );
}
