import { useMemo } from 'react';
import type { Phase, Race } from '../types/training';
import { daysBetween, todayInMexicoCity } from '../lib/dates';
import { formatDate, formatMonthYear } from '../lib/format';

interface Props {
  phases: Phase[];
  races: Race[];
}

// viewBox geometry — a gently winding road that scrolls horizontally on phones.
const VB_W = 1180;
const VB_H = 316;
const RULER_Y = 300;
const MARGIN_X = 46;
const MID_Y = 158;
const AMP = 46;
const WAVES = 1.55;
const ROAD_W = VB_W - MARGIN_X * 2;

function xAt(t: number): number {
  return MARGIN_X + t * ROAD_W;
}
function yAt(t: number): number {
  return MID_Y + AMP * Math.sin(t * WAVES * Math.PI * 2 - Math.PI / 2);
}

/** Build an SVG path string by sampling the road curve over [t0, t1]. */
function pathBetween(t0: number, t1: number, steps = 60): string {
  const span = t1 - t0;
  const n = Math.max(2, Math.round(steps * Math.max(span, 0.02)));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = t0 + (span * i) / n;
    d += `${i === 0 ? 'M' : 'L'}${xAt(t).toFixed(2)} ${yAt(t).toFixed(2)}`;
  }
  return d;
}

const PHASE_COLOR: Record<string, string> = {
  done: 'var(--jacaranda)',
  current: 'var(--dawn)',
  planned: 'var(--ink-3)',
};

export function RoadTimeline({ phases, races }: Props) {
  const model = useMemo(() => {
    // Domain: from the first dated race (Chicago) to the goal race (London).
    const datedRaces = races.filter((r) => r.date) as (Race & { date: string })[];
    const sortedRaces = [...datedRaces].sort((a, b) => (a.date < b.date ? -1 : 1));
    const startIso = sortedRaces[0]?.date ?? phases[0]?.start ?? todayInMexicoCity();
    const endIso =
      sortedRaces[sortedRaces.length - 1]?.date ?? phases[phases.length - 1]?.end ?? startIso;
    const total = Math.max(1, daysBetween(startIso, endIso));
    const t = (iso: string) => Math.min(1, Math.max(0, daysBetween(startIso, iso) / total));

    // Stagger phase labels into vertical tiers so short adjacent blocks
    // (deloads, the trip) don't collide in the dense autumn stretch.
    const TIERS = [-24, 26, -40, 42, -56, 58];
    const GAP = 6;
    const tierRight: number[] = new Array(TIERS.length).fill(-Infinity);
    const phaseSegs = phases
      .map((p) => {
        const tMid = t(p.start) + (t(p.end) - t(p.start)) / 2;
        return { phase: p, t0: t(p.start), t1: t(p.end), tMid, lx: xAt(tMid) };
      })
      .sort((a, b) => a.lx - b.lx)
      .map((seg) => {
        const halfW = (shortLabel(seg.phase.label).length * 5.4) / 2;
        let tier = TIERS.findIndex((_, i) => tierRight[i]! + GAP <= seg.lx - halfW);
        if (tier === -1) {
          // No clear tier — pick the one whose last label ends soonest.
          tier = tierRight.indexOf(Math.min(...tierRight));
        }
        tierRight[tier] = seg.lx + halfW;
        return { ...seg, dy: TIERS[tier]! };
      });

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

    return { startIso, endIso, t, phaseSegs, ticks, tToday, beforeStart, afterEnd, sortedRaces };
  }, [phases, races]);

  const raceFlag = (r: Race & { date: string }) => {
    const t = model.t(r.date);
    const x = xAt(t);
    const yr = yAt(t);
    const flagY = yr - 58;
    const isGoal = r.is_goal_race;
    const isDone = r.status === 'completed';
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
          {r.name.split('—')[0]!.split('(')[0]!.trim()}
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
        One route from Chicago 2025 to London 2027. Builds in jacaranda, the current block lit
        amber, breaks dashed, what's planned held quiet.
      </p>

      <div className="road" role="group" aria-label="Training phase timeline as a route">
        <div className="road__scroll">
          <svg
            className="road__svg"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="img"
            aria-label={`Route from ${formatDate(model.startIso)} to ${formatDate(model.endIso)}`}
          >
            {/* Roadbed */}
            <path d={pathBetween(0, 1, 160)} className="road__bed" />
            <path d={pathBetween(0, 1, 160)} className="road__center" />

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

            {/* Phase segments */}
            {model.phaseSegs.map(({ phase, t0, t1, tMid, lx, dy }) => {
              const isBreak = phase.kind === 'break';
              const color = PHASE_COLOR[phase.status] ?? 'var(--ink-3)';
              const ly = yAt(tMid);
              const labelY = ly + dy;
              const tickEnd = dy < 0 ? ly - 7 : ly + 7;
              return (
                <g key={phase.id}>
                  <path
                    d={pathBetween(t0, t1)}
                    className={`road__phase${isBreak ? ' road__phase--break' : ''}${
                      phase.highlight ? ' road__phase--highlight' : ''
                    }`}
                    style={{ stroke: color }}
                  >
                    <title>
                      {phase.label} · {formatDate(phase.start)}–{formatDate(phase.end)}
                    </title>
                  </path>
                  <line
                    x1={lx}
                    y1={tickEnd}
                    x2={lx}
                    y2={labelY + (dy < 0 ? 4 : -8)}
                    className="road__leader"
                    style={{ stroke: color }}
                  />
                  <circle cx={lx} cy={ly} r={2.4} style={{ fill: color }} />
                  <text
                    x={lx}
                    y={labelY}
                    textAnchor="middle"
                    className={`road__phaselabel road__phaselabel--${phase.status}`}
                  >
                    {shortLabel(phase.label)}
                  </text>
                </g>
              );
            })}

            {/* Race flags */}
            {model.sortedRaces.map(raceFlag)}

            {/* You are here */}
            {!model.beforeStart && !model.afterEnd && (
              <g className="road__here" transform={`translate(${xAt(model.tToday)} ${yAt(model.tToday)})`}>
                <line x1={0} y1={-8} x2={0} y2={-64} className="road__here-leader" />
                <circle r={11} className="road__here-halo" />
                <circle r={6} className="road__here-dot" />
                <rect x={-38} y={-78} width={76} height={15} rx={7.5} className="road__here-pill" />
                <text y={-67} textAnchor="middle" className="road__here-label">
                  you are here
                </text>
                <text y={4} textAnchor="middle" className="road__here-run" aria-hidden="true">
                  🏃
                </text>
              </g>
            )}
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

/** Compress a phase label for the crowded route; full text stays in the <title>. */
function shortLabel(label: string): string {
  return label
    .replace(/Build: /, '')
    .replace(/ threshold/, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/ with mom.*/, '')
    .trim();
}
