import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import type { EasyRun, MonthlyEf, Targets } from '../../types/training';
import { formatDateShort, formatPace, formatDate, formatMonthYear } from '../../lib/format';
import { ChartFrame, TooltipBox, timeDomain, monthTicks, toMs, axisTick, axisLine } from './kit';

interface Props {
  easyRuns: EasyRun[];
  monthlyEf: MonthlyEf[];
  targets: Targets;
}

interface Row {
  t: number;
  date: string;
  // Per-run series
  runEf?: number;
  roll?: number | null;
  pace?: number;
  hr?: number;
  kind?: string;
  note?: string;
  // Monthly series
  monthEf?: number;
  equivPace?: number;
  monthLabel?: string;
  monthNote?: string;
}

// The monthly equiv-pace reference (and the Z2 easy-run HR the Dec band assumes).
// The data expresses EF equivalence "at 145 bpm", so the pace target converts to
// an EF band at the same HR: EF = (60000 / pace_s_per_km) / hr.
const REF_HR = 145;
const efFromPace = (paceSPerKm: number) => 60000 / paceSPerKm / REF_HR;

function rollingMean(values: number[], i: number, window = 3): number {
  const from = Math.max(0, i - window + 1);
  const slice = values.slice(from, i + 1);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function EfChart({ easyRuns, monthlyEf, targets }: Props) {
  // Per-run EF: only runs with a real EF (skip null-HR runs — no zero-plotting).
  const validRuns = [...easyRuns]
    .filter((r): r is EasyRun & { ef: number; avg_hr: number } => r.ef != null && r.avg_hr != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const efs = validRuns.map((r) => r.ef);

  const runRows: Row[] = validRuns.map((r, i) => ({
    t: toMs(r.date),
    date: r.date,
    runEf: r.ef,
    roll: validRuns.length > 1 ? Number(rollingMean(efs, i).toFixed(3)) : null,
    pace: r.pace_s_per_km,
    hr: r.avg_hr,
    kind: r.kind,
    note: r.note,
  }));

  const monthRows: Row[] = [...monthlyEf]
    .sort((a, b) => (a.month < b.month ? -1 : 1))
    .map((m) => ({
      t: toMs(`${m.month}-15`),
      date: `${m.month}-15`,
      monthEf: m.ef_avg,
      equivPace: m.equiv_pace_at_145_s_per_km,
      monthLabel: m.month,
      monthNote: m.note,
    }));

  const data = [...monthRows, ...runRows].sort((a, b) => a.t - b.t);
  if (data.length === 0) return null;

  // December target as an EF band (pace band → EF at REF_HR).
  const band = targets.easy_pace_dec_2026?.band_s_per_km;
  const targetBand =
    band && band.length === 2
      ? { lo: efFromPace(Math.max(band[0]!, band[1]!)), hi: efFromPace(Math.min(band[0]!, band[1]!)) }
      : null;

  const allEf = [...efs, ...monthRows.map((m) => m.monthEf!)];
  const yLo = Math.min(...allEf) - 0.02;
  const yHi = Math.max(...allEf, targetBand?.hi ?? -Infinity) + 0.02;
  const domain = timeDomain(
    data.map((d) => d.date),
    14,
  );

  return (
    <ChartFrame
      title="Easy-run efficiency"
      caption={
        <span className="legend">
          <span className="legend__item">
            <span className="legend__swatch legend__swatch--month" />
            Monthly avg
          </span>
          <span className="legend__item">
            <span className="legend__swatch" style={{ background: 'var(--jacaranda)' }} />
            Per run
          </span>
          <span className="legend__item">
            <span className="legend__swatch legend__swatch--line" />
            3-run avg
          </span>
          {targetBand && (
            <span className="legend__item">
              <span className="legend__swatch legend__swatch--band" />
              Dec target
            </span>
          )}
        </span>
      }
      height={288}
      table={
        <table className="dtable mono">
          <thead>
            <tr><th>Date</th><th>Dist</th><th>Pace</th><th>HR</th><th>EF</th></tr>
          </thead>
          <tbody>
            {[...monthlyEf].map((m) => (
              <tr key={m.month}>
                <td>{formatMonthYear(`${m.month}-01`)} avg</td>
                <td>—</td>
                <td>{formatPace(m.equiv_pace_at_145_s_per_km)}*</td>
                <td>{REF_HR}*</td>
                <td>{m.ef_avg.toFixed(3)}</td>
              </tr>
            ))}
            {[...easyRuns]
              .sort((a, b) => (a.date < b.date ? -1 : 1))
              .map((r) => (
                <tr key={r.date}>
                  <td>{formatDateShort(r.date)}</td>
                  <td>{r.distance_km} km</td>
                  <td>{formatPace(r.pace_s_per_km)}</td>
                  <td>{r.avg_hr ?? '—'}</td>
                  <td>{r.ef != null ? r.ef.toFixed(3) : '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 18, right: 22, bottom: 6, left: -6 }}>
          {targetBand && (
            <ReferenceArea
              y1={targetBand.lo}
              y2={targetBand.hi}
              fill="var(--chart-band)"
              fillOpacity={1}
              ifOverflow="hidden"
              label={{
                value: 'Dec target',
                position: 'insideTopRight',
                fill: 'var(--chart-muted)',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
              }}
            />
          )}
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
            domain={[yLo, yHi]}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]!.payload as Row;
              if (p.monthEf != null) {
                return (
                  <TooltipBox
                    title={`${formatMonthYear(`${p.monthLabel}-01`)} · monthly avg`}
                    rows={[
                      { label: 'EF avg', value: p.monthEf.toFixed(3), swatch: 'var(--ink-3)' },
                      { label: `Equiv pace @${REF_HR}`, value: formatPace(p.equivPace!) },
                      ...(p.monthNote ? [{ label: 'Note', value: p.monthNote }] : []),
                    ]}
                  />
                );
              }
              return (
                <TooltipBox
                  title={formatDate(p.date)}
                  rows={[
                    { label: 'EF', value: p.runEf!.toFixed(3), swatch: 'var(--jacaranda)' },
                    { label: 'Pace', value: formatPace(p.pace!) },
                    { label: 'Avg HR', value: `${p.hr} bpm` },
                    { label: 'Kind', value: p.kind! },
                    ...(p.note ? [{ label: 'Note', value: p.note }] : []),
                  ]}
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="monthEf"
            stroke="var(--ink-3)"
            strokeWidth={2}
            strokeOpacity={0.55}
            dot={{ r: 3.5, fill: 'var(--ink-3)', fillOpacity: 0.7, stroke: 'var(--chart-surface)', strokeWidth: 1.5 }}
            isAnimationActive={false}
            connectNulls
            name="Monthly avg"
          />
          {validRuns.length > 1 && (
            <Line
              type="monotone"
              dataKey="roll"
              stroke="var(--dawn)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
              name="3-run average"
            />
          )}
          <Scatter
            dataKey="runEf"
            fill="var(--jacaranda)"
            stroke="var(--chart-surface)"
            strokeWidth={2}
            isAnimationActive={false}
            name="Easy runs"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
