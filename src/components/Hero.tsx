import type { Race } from '../types/training';
import { useCountdown } from '../lib/useCountdown';
import { formatClock, formatDate } from '../lib/format';

interface Props {
  races: Race[];
}

function CountdownClock({ targetIso }: { targetIso: string }) {
  const c = useCountdown(targetIso);
  if (!c) return null;
  return (
    <span className="mono" aria-hidden="true">
      {String(c.hours).padStart(2, '0')}:{String(c.minutes).padStart(2, '0')}:
      {String(c.seconds).padStart(2, '0')}
    </span>
  );
}

export function Hero({ races }: Props) {
  const goal = races.find((r) => r.is_goal_race) ?? races.find((r) => r.id === 'london-2027');
  const chicago = races.find((r) => r.id === 'chicago-2025');
  const next = races
    .filter((r) => r.status === 'upcoming' && r.date && r.id !== goal?.id)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))[0];

  const goalCountdown = useCountdown(goal?.date ?? null);
  const nextCountdown = useCountdown(next?.date ?? null);

  if (!goal || !goal.date) return null;

  const goalYear = goal.date.slice(0, 4);
  const chicagoLine =
    chicago?.result_time_s != null ? formatClock(chicago.result_time_s) : null;

  const days = goalCountdown?.days ?? null;
  const weeks = days != null ? Math.floor(days / 7) : null;
  const remDays = days != null ? days % 7 : null;

  return (
    <header className="hero" aria-labelledby="hero-title">
      <p className="hero__eyebrow mono">The road to</p>
      <h1 id="hero-title" className="hero__title">
        {goal.name}
      </h1>

      <div className="hero__count">
        <div
          className="hero__days mono"
          aria-label={
            goalCountdown
              ? `${goalCountdown.days} days until ${goal.name}`
              : goal.name
          }
        >
          <span className="hero__daysnum">{goalCountdown?.days ?? '—'}</span>
          <span className="hero__dayslabel">days</span>
        </div>
        <div className="hero__meta">
          {weeks != null && (
            <div
              className="hero__weeks mono"
              aria-label={`${weeks} weeks${remDays ? ` and ${remDays} days` : ''} until ${goal.name}`}
            >
              <span className="hero__weeksnum">{weeks}</span>
              <span className="hero__weekslabel"> weeks</span>
              {remDays ? <span className="hero__weeksrem"> · {remDays}d</span> : null}
            </div>
          )}
          <div className="hero__clockrow">
            <CountdownClock targetIso={goal.date} />
            <span className="hero__to">to the start line</span>
          </div>
          <div className="hero__facts">
            <span className="tag tag--goal">{goal.goal}</span>
            <span className="hero__date mono">{formatDate(goal.date)}</span>
          </div>
        </div>
      </div>

      {next && next.date && (
        <a className="hero__chip" href="#the-road" aria-label={`Next start line: ${next.name}`}>
          <span className="hero__chiplabel mono">Next start line</span>
          <span className="hero__chipbody">
            <strong>{next.name}</strong>
            <span className="hero__chipmeta mono">
              {nextCountdown ? `${nextCountdown.days}d` : ''} · {formatDate(next.date)}
              {next.goal ? ` · ${next.goal.split('(')[0]!.trim()}` : ''}
            </span>
          </span>
        </a>
      )}

      {chicagoLine && (
        <p className="hero__context">
          Chicago 2025: <span className="mono">{chicagoLine}</span>. London {goalYear}:{' '}
          <em>the answer.</em>
        </p>
      )}
    </header>
  );
}
