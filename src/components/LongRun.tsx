import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FuturePlan, LongRunPoint } from '../types/training';
import { formatDateShort, formatPace, formatKm, formatDate } from '../lib/format';
import { ChartFrame, TooltipBox, timeDomain, monthTicks, toMs, axisTick, axisLine } from './charts/kit';

interface Props {
  points: LongRunPoint[];
  futurePlan: FuturePlan;
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

export function LongRun({ points, futurePlan }: Props) {
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
  // Planned long runs from the forward plan (future weeks with a target).
  const planned = futurePlan.weeks
    .filter((w) => w.long_run_km != null && w.start > last.date)
    .map((w) => ({ date: w.start, km: w.long_run_km as number, note: w.note }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const hasProjection = planned.length > 0;
  if (hasProjection) {
    // Anchor the dashed line at the last real run, then follow the plan.
    rows[rows.length - 1]!.proj = last.km;
    planned.forEach((pl) =>
      rows.push({ t: toMs(pl.date), date: pl.date, km: null, proj: pl.km, note: pl.note }),
    );
    rows.sort((a, b) => a.t - b.t);
  }

  const peakPlanned = planned.length ? Math.max(...planned.map((p) => p.km)) : null;
  const isos = rows.map((r) => r.date);
  const domain = timeDomain(isos, 12);
  const kms = [...sorted.map((p) => p.km), ...planned.map((p) => p.km)];
  const yMax = Math.max(...kms) + 3;
  const yMin = Math.max(0, Math.min(...kms) - 3);

  return (
    <section className="section" id="long-run" aria-labelledby="long-title">
      <div className="section__head">
        <span className="section__kicker">§ long run</span>
        <h2 id="long-title" className="section__title">
          The long run, stepping up
        </h2>
      </div>
      <p className="section__lede">
        Each step is a new longest run. The dotted line is the plan
        {peakPlanned != null ? <> — building toward {formatKm(peakPlanned)} km in December</> : null}.
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
                      title={`Planned · ${formatDate(r.date)}`}
                      rows={[
                        { label: 'Long run', value: `${formatKm(r.proj)} km`, swatch: 'var(--dawn)' },
                        ...(r.note ? [{ label: 'Note', value: r.note }] : []),
                      ]}
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
