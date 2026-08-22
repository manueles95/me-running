import type { ReactNode } from 'react';
import { mexicoCityMidnight } from '../../lib/dates';

/** Shared frame for a chart: heading, optional caption, fixed-height plot area,
 *  and a collapsible data-table fallback (dataviz accessibility check). */
export function ChartFrame({
  title,
  caption,
  height = 260,
  children,
  table,
}: {
  title: string;
  caption?: ReactNode;
  height?: number;
  children: ReactNode;
  table?: ReactNode;
}) {
  return (
    <figure className="chart card">
      <figcaption className="chart__cap">
        <h3 className="chart__title">{title}</h3>
        {caption && <p className="chart__sub">{caption}</p>}
      </figcaption>
      <div className="chart__plot" style={{ height }}>
        {children}
      </div>
      {table && (
        <details className="chart__data">
          <summary className="mono">data table</summary>
          <div className="chart__tablewrap">{table}</div>
        </details>
      )}
    </figure>
  );
}

/** A single tooltip surface with a title row and labeled value rows. */
export function TooltipBox({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; swatch?: string }[];
}) {
  return (
    <div className="tt">
      <div className="tt__title mono">{title}</div>
      {rows.map((r) => (
        <div className="tt__row" key={r.label}>
          {r.swatch && <span className="tt__swatch" style={{ background: r.swatch }} />}
          <span className="tt__label">{r.label}</span>
          <span className="tt__value mono">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export const toMs = (iso: string) => mexicoCityMidnight(iso);
const DAY = 86_400_000;

/** Numeric time-domain with padding so single points aren't glued to the edge. */
export function timeDomain(isos: string[], padDays = 10): [number, number] {
  const xs = isos.map(toMs);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const pad = padDays * DAY;
  if (min === max) return [min - 7 * DAY, max + 7 * DAY];
  return [min - pad, max + pad];
}

/** Even month ticks across a time domain for the x-axis. */
export function monthTicks([min, max]: [number, number]): number[] {
  const ticks: number[] = [];
  const start = new Date(min);
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  for (let i = 0; i < 60; i++) {
    const ts = Date.UTC(y, m, 1);
    if (ts >= min && ts <= max) ticks.push(ts);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    if (ts > max) break;
  }
  return ticks;
}

// Shared axis styling — recessive, no gridline noise (spec §6).
export const axisTick = { fill: 'var(--chart-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' };
export const axisLine = { stroke: 'var(--line)' };
