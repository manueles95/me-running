import {
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RaceSplit } from '../../types/training';
import { formatPace, formatClock } from '../../lib/format';
import { ChartFrame, TooltipBox, axisTick, axisLine } from './kit';

interface Props {
  splits: RaceSplit[];
  avgPace: number;
  avgHr: number;
}

const PACE_COLOR = 'var(--cat-race)';
const HR_COLOR = 'var(--cat-deload)';
// A split is "the climb" when it gains noticeably more than the flat kilometres.
const CLIMB_GAIN_M = 15;

/** Ticks at a round step inside a domain, so axes read 4:30 / 4:45 / 5:00
 *  rather than whatever the renderer picks. */
function stepTicks([lo, hi]: [number, number], step: number): number[] {
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
  return out;
}

interface Row extends RaceSplit {
  label: string;
  isPartial: boolean;
}

const toRows = (splits: RaceSplit[]): Row[] =>
  splits.map((s) => ({
    ...s,
    label: s.partial_km ? 'fin' : String(s.km),
    isPartial: s.partial_km != null,
  }));

function splitTooltip(p: Row) {
  return (
    <TooltipBox
      title={p.isPartial ? `Final ${p.partial_km} km` : `Kilometre ${p.km}`}
      rows={[
        { label: 'Pace', value: formatPace(p.pace_s_per_km) },
        { label: 'Heart rate', value: `${p.avg_hr} bpm` },
        { label: 'Climb', value: `${p.elev_gain_m} m` },
        { label: 'Elapsed', value: formatClock(p.cum_s) },
      ]}
    />
  );
}

/** Pace per kilometre. The y-axis is inverted so faster sits higher — pace has
 *  no meaningful zero, so this is a line rather than bars on a cut-off baseline. */
export function RacePaceChart({ splits, avgPace }: Props) {
  const rows = toRows(splits);
  const paces = rows.map((r) => r.pace_s_per_km);
  const lo = Math.min(...paces);
  const hi = Math.max(...paces);
  const pad = Math.max(8, (hi - lo) * 0.25);

  return (
    <ChartFrame
      title="Pace per kilometre"
      caption={
        <>
          Higher is faster. The dashed line is the race average of{' '}
          <span className="mono">{formatPace(avgPace)}</span>; the dip at 8 is the course's
          high point, and the hollow point is the closing {rows[rows.length - 1]!.partial_km} km.
        </>
      }
      height={280}
      table={
        <table className="dtable mono">
          <thead>
            <tr>
              <th>Km</th>
              <th>Pace</th>
              <th>HR</th>
              <th>Climb</th>
              <th>Elapsed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.km}>
                <td>{r.isPartial ? `${r.partial_km} (fin)` : r.km}</td>
                <td>{formatPace(r.pace_s_per_km)}</td>
                <td>{r.avg_hr}</td>
                <td>{r.elev_gain_m} m</td>
                <td>{formatClock(r.cum_s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 18, right: 16, bottom: 6, left: -4 }}>
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            label={{
              value: 'kilometre',
              position: 'insideBottomRight',
              offset: -2,
              fill: 'var(--chart-muted)',
              fontSize: 10,
            }}
          />
          <YAxis
            // Inverted: smaller seconds (faster) sits higher up.
            reversed
            domain={[lo - pad, hi + pad]}
            ticks={stepTicks([lo - pad, hi + pad], 15)}
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            width={52}
            tickFormatter={(v: number) => formatClock(v)}
          />
          <ReferenceLine
            y={avgPace}
            stroke="var(--chart-muted)"
            strokeDasharray="3 4"
            strokeWidth={1}
          />
          <Tooltip
            cursor={{ stroke: 'var(--chart-muted)', strokeWidth: 1 }}
            content={({ active, payload }) =>
              active && payload?.length ? splitTooltip(payload[0]!.payload as Row) : null
            }
          />
          <Line
            type="monotone"
            dataKey="pace_s_per_km"
            stroke={PACE_COLOR}
            strokeWidth={2}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
          {/* Dots carry identity: solid for a full kilometre, hollow for the
              closing partial, paler over the climb. */}
          <Scatter dataKey="pace_s_per_km" isAnimationActive={false}>
            {rows.map((r) => (
              <Cell
                key={r.km}
                fill={r.isPartial ? 'var(--chart-surface)' : PACE_COLOR}
                fillOpacity={r.elev_gain_m >= CLIMB_GAIN_M ? 0.55 : 1}
                stroke={PACE_COLOR}
                strokeWidth={2}
              />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Heart rate per kilometre — its own chart, on its own scale. */
export function RaceHrChart({ splits, avgHr }: Props) {
  const rows = toRows(splits);
  const hrs = rows.map((r) => r.avg_hr);
  const lo = Math.min(...hrs);
  const hi = Math.max(...hrs);
  const pad = Math.max(3, (hi - lo) * 0.25);

  return (
    <ChartFrame
      title="Heart rate per kilometre"
      caption={
        <>
          Climbing all the way: <span className="mono">{rows[0]!.avg_hr}</span> bpm in the
          first kilometre to <span className="mono">{rows[rows.length - 1]!.avg_hr}</span> at
          the line, averaging <span className="mono">{avgHr}</span>.
        </>
      }
      height={280}
      table={
        <table className="dtable mono">
          <thead>
            <tr>
              <th>Km</th>
              <th>HR</th>
              <th>Pace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.km}>
                <td>{r.isPartial ? `${r.partial_km} (fin)` : r.km}</td>
                <td>{r.avg_hr}</td>
                <td>{formatPace(r.pace_s_per_km)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 18, right: 16, bottom: 6, left: -4 }}>
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            label={{
              value: 'kilometre',
              position: 'insideBottomRight',
              offset: -2,
              fill: 'var(--chart-muted)',
              fontSize: 10,
            }}
          />
          <YAxis
            domain={[Math.floor(lo - pad), Math.ceil(hi + pad)]}
            ticks={stepTicks([Math.floor(lo - pad), Math.ceil(hi + pad)], 5)}
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            width={38}
            allowDecimals={false}
          />
          <ReferenceLine
            y={avgHr}
            stroke="var(--chart-muted)"
            strokeDasharray="3 4"
            strokeWidth={1}
          />
          <Tooltip
            cursor={{ stroke: 'var(--chart-muted)', strokeWidth: 1 }}
            content={({ active, payload }) =>
              active && payload?.length ? splitTooltip(payload[0]!.payload as Row) : null
            }
          />
          <Line
            type="monotone"
            dataKey="avg_hr"
            stroke={HR_COLOR}
            strokeWidth={2}
            dot={{ r: 4, fill: HR_COLOR, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: HR_COLOR, stroke: 'var(--chart-surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
