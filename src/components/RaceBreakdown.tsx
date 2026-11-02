import type { Race, RaceBreakdown as Breakdown } from '../types/training';
import { formatClock, formatPace, formatDate } from '../lib/format';
import { RacePaceChart, RaceHrChart } from './charts/RaceSplitChart';

interface Props {
  breakdown?: Breakdown;
  races: Race[];
}

export function RaceBreakdown({ breakdown, races }: Props) {
  if (!breakdown || breakdown.splits.length === 0) return null;
  const race = races.find((r) => r.id === breakdown.race_id);

  // Pace over the measured distance — the honest average for the effort run.
  const measured = breakdown.gps_distance_km ?? breakdown.splits.length;
  const avgPace = Math.round(breakdown.finish_time_s / measured);

  const half = breakdown.first_half_s && breakdown.second_half_s
    ? breakdown.first_half_s - breakdown.second_half_s
    : null;

  const stats: { k: string; v: string; sub?: string }[] = [
    {
      k: 'finish',
      v: formatClock(breakdown.finish_time_s),
      sub: breakdown.clean_10k_s ? `${formatClock(breakdown.clean_10k_s)} for a clean 10.00 km` : undefined,
    },
    { k: 'average pace', v: formatPace(avgPace), sub: `over ${measured} km measured` },
    { k: 'heart rate', v: `${breakdown.avg_hr}`, sub: `avg bpm · ${breakdown.max_hr} max` },
    ...(half != null
      ? [
          {
            k: half > 0 ? 'negative split' : 'split',
            v: `${half > 0 ? '−' : '+'}${formatClock(Math.abs(half))}`,
            sub: `${formatClock(breakdown.first_half_s!)} out · ${formatClock(
              breakdown.second_half_s!,
            )} back`,
          },
        ]
      : []),
  ];

  return (
    <section className="section" id="race" aria-labelledby="race-title">
      <div className="section__head">
        <span className="section__kicker">§ the race</span>
        <h2 id="race-title" className="section__title">
          {race ? race.name : 'Race'}, kilometre by kilometre
        </h2>
      </div>
      {(race?.date || breakdown.note) && (
        <p className="section__lede">
          {race?.date && <>{formatDate(race.date)}. </>}
          {breakdown.note}
        </p>
      )}

      <dl className="racestats">
        {stats.map((s) => (
          <div className="racestats__item" key={s.k}>
            <dt className="racestats__k mono">{s.k}</dt>
            <dd className="racestats__v">
              <span className="mono racestats__num">{s.v}</span>
              {s.sub && <span className="racestats__sub">{s.sub}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="charts-2">
        <RacePaceChart splits={breakdown.splits} avgPace={avgPace} avgHr={breakdown.avg_hr} />
        <RaceHrChart splits={breakdown.splits} avgPace={avgPace} avgHr={breakdown.avg_hr} />
      </div>
    </section>
  );
}
