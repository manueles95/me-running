import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from 'recharts';
import type { FuturePlan, Targets, Week, WeekType } from '../types/training';
import { formatDateShort, formatKm, formatDate } from '../lib/format';
import { ChartFrame, TooltipBox, axisTick, axisLine } from './charts/kit';

interface Props {
  weeks: Week[];
  futurePlan: FuturePlan;
  targets: Targets;
}

const TYPE_COLOR: Record<WeekType, string> = {
  build: 'var(--cat-build)',
  deload: 'var(--cat-deload)',
  race: 'var(--cat-race)',
  break: 'var(--cat-break)',
  ramp: 'var(--cat-ramp)',
};

const TYPE_LABEL: Record<WeekType, string> = {
  build: 'Build',
  deload: 'Deload',
  race: 'Race',
  break: 'Break',
  ramp: 'Ramp',
};

interface Row {
  start: string;
  km: number | null;
  planned: number | null;
  type: WeekType;
  highlight?: string;
  quality?: string | null;
  note?: string;
}

export function Volume({ weeks, futurePlan, targets }: Props) {
  const realStarts = new Set(weeks.map((w) => w.start));
  const rows: Row[] = [
    ...weeks.map((w) => ({
      start: w.start,
      km: w.km,
      planned: null,
      type: w.type,
      highlight: w.highlight,
    })),
    // Future weeks that haven't happened yet (skip any already logged as real).
    ...futurePlan.weeks
      .filter((p) => !realStarts.has(p.start))
      .map((p) => ({
        start: p.start,
        km: null,
        planned: p.km_target,
        type: p.type,
        quality: p.quality,
        note: p.note,
      })),
  ].sort((a, b) => (a.start < b.start ? -1 : 1));

  if (rows.length === 0) return null;

  const usedTypes = Array.from(new Set(rows.map((r) => r.type)));
  const cap = targets.weekly_km_cap;

  return (
    <section className="section" id="volume" aria-labelledby="volume-title">
      <div className="section__head">
        <span className="section__kicker">§ volume</span>
        <h2 id="volume-title" className="section__title">
          Weekly kilometers
        </h2>
      </div>
      <p className="section__lede">
        Colored by week type — deloads dip <em>on purpose</em>, breaks drop to the floor. Solid
        bars are run; faded bars ahead are the plan. {futurePlan.note}
      </p>

      <ChartFrame
        title="Weekly volume"
        caption={
          <span className="legend">
            {usedTypes.map((t) => (
              <span className="legend__item" key={t}>
                <span className="legend__swatch" style={{ background: TYPE_COLOR[t] }} />
                {TYPE_LABEL[t]}
              </span>
            ))}
            <span className="legend__item">
              <span className="legend__swatch legend__swatch--ghost" />
              Planned (faded)
            </span>
          </span>
        }
        height={320}
        table={
          <table className="dtable mono">
            <thead>
              <tr><th>Week of</th><th>km</th><th>Type</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.start}>
                  <td>{formatDateShort(r.start)}</td>
                  <td>{r.km != null ? formatKm(r.km) : r.planned != null ? formatKm(r.planned) : '—'}</td>
                  <td>{TYPE_LABEL[r.type]}</td>
                  <td>{r.km != null ? 'run' : 'planned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 24, right: 16, bottom: 6, left: -8 }} barCategoryGap="18%">
            <ReferenceLine
              y={cap}
              stroke="var(--line-strong)"
              strokeDasharray="3 4"
              label={{
                value: `cap ${cap}`,
                position: 'right',
                fill: 'var(--chart-muted)',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
              }}
            />
            <XAxis
              dataKey="start"
              tickFormatter={formatDateShort}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={34}
            />
            <YAxis
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={34}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              cursor={{ fill: 'var(--jacaranda-soft)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0]!.payload as Row;
                const isPlanned = r.km == null;
                return (
                  <TooltipBox
                    title={`Week of ${formatDate(r.start)}`}
                    rows={[
                      {
                        label: isPlanned ? 'Planned' : 'Volume',
                        value: `${formatKm((isPlanned ? r.planned : r.km) ?? 0)} km`,
                        swatch: TYPE_COLOR[r.type],
                      },
                      { label: 'Type', value: TYPE_LABEL[r.type] },
                      ...(isPlanned && r.quality ? [{ label: 'Session', value: r.quality }] : []),
                      ...(r.highlight ? [{ label: 'Note', value: r.highlight }] : []),
                      ...(!r.highlight && r.note ? [{ label: 'Note', value: r.note }] : []),
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="planned" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell
                  key={r.start}
                  fill={TYPE_COLOR[r.type]}
                  fillOpacity={0.22}
                  stroke={TYPE_COLOR[r.type]}
                  strokeOpacity={0.6}
                  strokeDasharray="3 3"
                />
              ))}
            </Bar>
            <Bar dataKey="km" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.start} fill={TYPE_COLOR[r.type]} />
              ))}
              <LabelList dataKey="km" content={(props) => <BarNote {...props} rows={rows} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </section>
  );
}

/** Direct labels on the bars: the highlight week, and a quiet "deload" tag on dips. */
function BarNote(props: {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  index?: number;
  rows: Row[];
}) {
  const { x, y, width, index, rows } = props;
  if (index == null || x == null || y == null || width == null) return null;
  const row = rows[index];
  if (!row || row.km == null) return null;
  const cx = Number(x) + Number(width) / 2;
  const cy = Number(y);
  if (row.highlight) {
    return (
      <text x={cx} y={cy - 8} textAnchor="middle" className="bar-note bar-note--star">
        ★ {row.highlight}
      </text>
    );
  }
  if (row.type === 'deload') {
    return (
      <text x={cx} y={cy - 8} textAnchor="middle" className="bar-note">
        deload
      </text>
    );
  }
  return null;
}
