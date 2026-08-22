import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { QualitySession } from '../../types/training';
import { formatDateShort, formatPace, formatClock, formatDate } from '../../lib/format';
import { ChartFrame, TooltipBox, timeDomain, monthTicks, toMs, axisTick, axisLine } from './kit';

interface Props {
  qualitySessions: QualitySession[];
  projection?: string;
}

interface Row {
  t: number;
  date: string;
  label: string;
  pace: number;
  hr: number;
  structure: string;
  note?: string;
}

const PACE_COLOR = 'var(--cat-build)';
const HR_COLOR = 'var(--cat-deload)';

export function ThresholdChart({ qualitySessions, projection }: Props) {
  const sorted = [...qualitySessions].sort((a, b) => (a.date < b.date ? -1 : 1));
  const data: Row[] = sorted.map((s) => ({
    t: toMs(s.date),
    date: s.date,
    label: s.label,
    pace: s.avg_rep_pace_s_per_km,
    hr: s.avg_rep_hr,
    structure: s.structure,
    note: s.note,
  }));

  if (data.length === 0) return null;

  const domain = timeDomain(sorted.map((s) => s.date));
  const paces = data.map((d) => d.pace);
  const hrs = data.map((d) => d.hr);
  const pPad = Math.max(6, (Math.max(...paces) - Math.min(...paces)) * 0.4);
  const hPad = Math.max(4, (Math.max(...hrs) - Math.min(...hrs)) * 0.4);

  // The "hot" session: flagged in its note, else the highest-HR rep set.
  const hot =
    data.find((d) => /\bhot\b/i.test(d.note ?? '')) ??
    data.reduce((a, b) => (b.hr > a.hr ? b : a), data[0]!);

  return (
    <ChartFrame
      title="Threshold progression"
      caption={
        <>
          Rep pace (<span style={{ color: PACE_COLOR }}>■</span> faster is higher) and rep heart
          rate (<span style={{ color: HR_COLOR }}>■</span>) per quality session — the goal is
          faster <em>and</em> cheaper.
          {projection ? <span className="chart__proj"> {projection}</span> : null}
        </>
      }
      height={280}
      table={
        <table className="dtable mono">
          <thead>
            <tr><th>Date</th><th>Session</th><th>Rep pace</th><th>Rep HR</th></tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.date}>
                <td>{formatDateShort(s.date)}</td>
                <td>{s.label}</td>
                <td>{formatPace(s.avg_rep_pace_s_per_km)}</td>
                <td>{s.avg_rep_hr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 26, right: 8, bottom: 6, left: -8 }}>
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
            yAxisId="pace"
            reversed
            domain={[Math.min(...paces) - pPad, Math.max(...paces) + pPad]}
            tick={{ ...axisTick, fill: PACE_COLOR }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v) => formatClock(v)}
          />
          <YAxis
            yAxisId="hr"
            orientation="right"
            domain={[Math.min(...hrs) - hPad, Math.max(...hrs) + hPad]}
            tick={{ ...axisTick, fill: HR_COLOR }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${Math.round(v)}`}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            allowEscapeViewBox={{ x: false, y: true }}
            offset={14}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]!.payload as Row;
              return (
                <TooltipBox
                  title={`${p.label} · ${formatDate(p.date)}`}
                  rows={[
                    { label: 'Rep pace', value: formatPace(p.pace), swatch: PACE_COLOR },
                    { label: 'Rep HR', value: `${p.hr} bpm`, swatch: HR_COLOR },
                  ]}
                />
              );
            }}
          />
          <Line
            yAxisId="pace"
            type="monotone"
            dataKey="pace"
            stroke={PACE_COLOR}
            strokeWidth={2}
            dot={{ r: 4, fill: PACE_COLOR, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
            isAnimationActive={false}
            name="Rep pace"
          />
          <Line
            yAxisId="hr"
            type="monotone"
            dataKey="hr"
            stroke={HR_COLOR}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 4, fill: HR_COLOR, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
            isAnimationActive={false}
            name="Rep HR"
          />
          <ReferenceDot
            yAxisId="pace"
            x={hot.t}
            y={hot.pace}
            r={7}
            fill="none"
            stroke={PACE_COLOR}
            strokeWidth={1.5}
            label={{
              value: 'hot start, wrong shoes',
              position: 'top',
              fill: 'var(--ink-2)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
