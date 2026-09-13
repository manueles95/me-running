import type { Athlete, EasyRun, MonthlyEf, QualitySession, Targets } from '../types/training';
import { EfChart } from './charts/EfChart';
import { ThresholdChart } from './charts/ThresholdChart';
import { formatPace } from '../lib/format';

interface Props {
  easyRuns: EasyRun[];
  monthlyEf: MonthlyEf[];
  qualitySessions: QualitySession[];
  targets: Targets;
  athlete: Athlete;
}

const paceRange = (band?: number[]) =>
  band && band.length === 2 ? `${formatPace(band[0]!)}–${formatPace(band[1]!)}` : null;

export function EngineTrends({ easyRuns, monthlyEf, qualitySessions, targets, athlete }: Props) {
  // Where easy pace sits now vs where it's headed — the checkpoint's practical
  // output, read right next to the efficiency chart that produced it.
  const current = targets.easy_pace_current;
  const currentLabel = paceRange(current?.band_s_per_km);
  const bandLabel = paceRange(targets.easy_pace_dec_2026?.band_s_per_km);

  return (
    <section className="section" id="engine" aria-labelledby="engine-title">
      <div className="section__head">
        <span className="section__kicker">§ engine trends</span>
        <h2 id="engine-title" className="section__title">
          The engine, measured
        </h2>
      </div>
      <p className="section__lede">
        Two pictures of the same aerobic base. Z2 ceiling {athlete.zones.z2_ceiling_hr} bpm, LTHR{' '}
        {athlete.zones.lthr}.
      </p>

      {(currentLabel || bandLabel) && (
        <dl className="paces">
          {currentLabel && (
            <div className="paces__item">
              <dt className="paces__k mono">easy pace now</dt>
              <dd className="paces__v">
                <span className="mono paces__num">{currentLabel}</span>
                {current?.note && <span className="paces__note">{current.note}</span>}
              </dd>
            </div>
          )}
          {bandLabel && (
            <div className="paces__item">
              <dt className="paces__k mono">december target</dt>
              <dd className="paces__v">
                <span className="mono paces__num">{bandLabel}</span>
                {targets.easy_pace_dec_2026.note && (
                  <span className="paces__note">{targets.easy_pace_dec_2026.note}</span>
                )}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="charts-2">
        <EfChart easyRuns={easyRuns} monthlyEf={monthlyEf} targets={targets} />
        <ThresholdChart qualitySessions={qualitySessions} projection={targets.threshold_note} />
      </div>
    </section>
  );
}
