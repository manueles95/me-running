import type { Checkpoint, FuturePlan, Phase, QualitySession, Week } from '../types/training';
import { daysBetween, todayInMexicoCity } from '../lib/dates';
import { formatDate, formatKm, formatPace } from '../lib/format';

interface Props {
  phases: Phase[];
  weeks: Week[];
  qualitySessions: QualitySession[];
  checkpoints: Checkpoint[];
  futurePlan: FuturePlan;
}

function weekCount(startIso: string, endIso: string): number {
  return Math.max(1, Math.ceil((daysBetween(startIso, endIso) + 1) / 7));
}

export function CurrentBlock({ phases, weeks, qualitySessions, checkpoints, futurePlan }: Props) {
  const current = phases.find((p) => p.status === 'current');
  if (!current) return null;

  const today = todayInMexicoCity();

  // Next known session: the soonest upcoming planned week that has a quality.
  const nextSession = [...futurePlan.weeks]
    .filter((w) => w.quality && daysBetween(today, w.start) >= 0)
    .sort((a, b) => (a.start < b.start ? -1 : 1))[0];
  const totalWeeks = weekCount(current.start, current.end);
  const elapsed = Math.floor(daysBetween(current.start, today) / 7) + 1;
  const weekN = Math.min(Math.max(elapsed, 1), totalWeeks);

  const lastQuality = [...qualitySessions].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const lastWeek = [...weeks].sort((a, b) => (a.start < b.start ? 1 : -1))[0];

  // Open questions (pending) first, then settled ones (passed/adjusted) as receipts.
  const openCheckpoints = [...checkpoints]
    .filter((c) => c.status === 'pending')
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const settledCheckpoints = [...checkpoints]
    .filter((c) => c.status !== 'pending')
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <section className="section" id="current" aria-labelledby="current-title">
      <div className="section__head">
        <span className="section__kicker">§ current block</span>
        <h2 id="current-title" className="section__title">
          Where the work is now
        </h2>
      </div>

      <div className="block card">
        <div className="block__top">
          <div>
            <div className="block__name">{current.label}</div>
            <div className="block__dates mono">
              {formatDate(current.start)} – {formatDate(current.end)}
            </div>
          </div>
          <div className="block__weekpill mono" aria-label={`Week ${weekN} of ${totalWeeks}`}>
            <span className="block__weekn">
              {weekN}<span className="block__weekof">/{totalWeeks}</span>
            </span>
            <span className="block__weeklabel">week</span>
          </div>
        </div>

        <div className="block__grid">
          {lastWeek && (
            <div className="block__cell">
              <div className="block__celllabel mono">Last week's volume</div>
              <div className="block__cellvalue mono">
                {formatKm(lastWeek.km)} <span className="block__unit">km</span>
              </div>
              {lastWeek.highlight && <div className="block__cellnote">{lastWeek.highlight}</div>}
            </div>
          )}

          {lastQuality && (
            <div className="block__cell block__cell--wide">
              <div className="block__celllabel mono">Last quality session · {lastQuality.label}</div>
              <div className="block__cellvalue mono">
                {formatPace(lastQuality.avg_rep_pace_s_per_km)}
                <span className="block__unit"> @ {lastQuality.avg_rep_hr} bpm</span>
              </div>
              {lastQuality.note && <div className="block__cellnote">{lastQuality.note}</div>}
            </div>
          )}
        </div>

        {nextSession && (
          <div className="block__next">
            <span className="block__nextlabel mono">Next session</span>
            <span className="block__nexttext">
              {nextSession.quality}
              <span className="block__nextq"> · week of {formatDate(nextSession.start)}</span>
            </span>
          </div>
        )}

      </div>

      {(openCheckpoints.length > 0 || settledCheckpoints.length > 0) && (
        <ul className="checks" aria-label="Checkpoints">
          {openCheckpoints.map((c) => (
            <li className="check check--open card" key={`${c.date}-${c.label}`}>
              <div className="check__head">
                <span className="check__icon check__icon--open" aria-hidden="true">
                  ◦
                </span>
                <span className="check__label">{c.label}</span>
                <span className="check__date mono">{formatDate(c.date)}</span>
              </div>
              <p className="check__q">{c.question}</p>
            </li>
          ))}
          {settledCheckpoints.map((c) => (
            <li className="check check--passed card" key={`${c.date}-${c.label}`}>
              <div className="check__head">
                <span className="check__icon check__icon--passed" aria-hidden="true">
                  ✓
                </span>
                <span className="check__label">{c.label}</span>
                <span className="check__date mono">
                  {c.status === 'adjusted' ? 'adjusted' : 'passed'} · {formatDate(c.date)}
                </span>
              </div>
              <p className="check__q">{c.question}</p>
              {c.outcome && <p className="check__outcome">{c.outcome}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
