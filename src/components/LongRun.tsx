import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { LongRunPoint, Targets } from '../types/training';
import { formatDateShort, formatPace, formatKm, formatDate } from '../lib/format';
import { ChartFrame, TooltipBox, timeDomain, monthTicks, toMs, axisTick, axisLine } from './charts/kit';

interface Props {
  points: LongRunPoint[];
  targets: Targets;
}

interface Row {
  t: number;
  date: string;
  km: number | null;
  proj: number | null;
  pace?: number;
  hr?: number;
  note?: string;
}

// Where the dotted projection lands: the "by December" long-run target.
const PROJECTION_DATE = '2026-12-20';

export function LongRun({ points, targets }: Props) {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (sorted.length === 0) return null;

  const rows: Row[] = sorted.map((p) => ({
    t: toMs(p.date),
    date: p.date,
    km: p.km,
    proj: null,
    pace: p.pace_s_per_km,
    hr: p.avg_hr,
    note: p.note,
  }));

  const last = sorted[sorted.length - 1]!;
  const target = targets.long_run_by_dec_km;
  const hasProjection = target != null && PROJECTION_DATE > last.date;
  if (hasProjection) {
    // Anchor the dashed line at the last real point, then extend to the target.
    rows[rows.length - 1]!.proj = last.km;
    rows.push({
      t: toMs(PROJECTION_DATE),
      date: PROJECTION_DATE,
      km: null,
      proj: target,
    });
  }

  const isos = rows.map((r) => r.date);
  const domain = timeDomain(isos, 12);
  const kms = [...sorted.map((p) => p.km), ...(hasProjection ? [target] : [])];
  const yMax = Math.max(...kms) + 3;
  const yMin = Math.max(0, Math.min(...sorted.map((p) => p.km)) - 3);

  return (
    <section className="section" id="long-run" aria-labelledby="long-title">
      <div className="section__head">
        <span className="section__kicker">§ long run</span>
        <h2 id="long-title" className="section__title">
          The long run, stepping up
        </h2>
      </div>
      <p className="section__lede">
        Each step is a new longest run. The dotted line is where it's headed — {formatKm(target)} km
        by December.
      </p>

      <ChartFrame
        title="Long-run distance"
        caption="Solid = run. Dotted = planned build."
        height={280}
        table={
          <table className="dtable mono">
            <thead>
              <tr><th>Date</th><th>km</th><th>Pace</th><th>HR</th></tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.date}>
                  <td>{formatDateShort(p.date)}</td>
                  <td>{formatKm(p.km)}</td>
                  <td>{formatPace(p.pace_s_per_km)}</td>
                  <td>{p.avg_hr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 24, right: 30, bottom: 6, left: -6 }}>
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={domain}
              ticks={monthTicks(domain)}
              tickFormatter={(v) => formatDateShort(new Date(v).toISOString().slice(0, 10))}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(v) => `${v}`}
              unit=""
            />
            <Tooltip
              cursor={{ stroke: 'var(--line-strong)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0]!.payload as Row;
                if (r.km == null && r.proj != null && r.pace == null) {
                  return (
                    <TooltipBox
                      title={`Target · ${formatDate(r.date)}`}
                      rows={[{ label: 'Planned long run', value: `${formatKm(r.proj)} km`, swatch: 'var(--dawn)' }]}
                    />
                  );
                }
                return (
                  <TooltipBox
                    title={formatDate(r.date)}
                    rows={[
                      { label: 'Distance', value: `${formatKm(r.km ?? 0)} km`, swatch: 'var(--jacaranda)' },
                      ...(r.pace ? [{ label: 'Pace', value: formatPace(r.pace) }] : []),
                      ...(r.hr ? [{ label: 'Avg HR', value: `${r.hr} bpm` }] : []),
                      ...(r.note ? [{ label: 'Note', value: r.note }] : []),
                    ]}
                  />
                );
              }}
            />
            {hasProjection && (
              <Line
                type="stepAfter"
                dataKey="proj"
                stroke="var(--dawn)"
                strokeWidth={2}
                strokeDasharray="2 5"
                dot={{ r: 4, fill: 'var(--dawn)', stroke: 'var(--chart-surface)', strokeWidth: 2 }}
                isAnimationActive={false}
                connectNulls
                name="Planned"
              />
            )}
            <Line
              type="stepAfter"
              dataKey="km"
              stroke="var(--jacaranda)"
              strokeWidth={2.5}
              dot={{ r: 4.5, fill: 'var(--jacaranda)', stroke: 'var(--chart-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls
              name="Long run"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>
    </section>
  );
}
