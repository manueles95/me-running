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

export function EngineTrends({ easyRuns, monthlyEf, qualitySessions, targets, athlete }: Props) {
  const band = targets.easy_pace_dec_2026?.band_s_per_km;
  const bandLabel =
    band && band.length === 2 ? `${formatPace(band[0]!)}–${formatPace(band[1]!)}` : null;

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
        {bandLabel && (
          <>
            {' '}
            December easy-pace target: <span className="mono">{bandLabel}</span>
            {targets.easy_pace_dec_2026.note ? ` (${targets.easy_pace_dec_2026.note})` : ''}.
          </>
        )}
      </p>

      <div className="charts-2">
        <EfChart easyRuns={easyRuns} monthlyEf={monthlyEf} targets={targets} />
        <ThresholdChart qualitySessions={qualitySessions} projection={targets.threshold_projection} />
      </div>
    </section>
  );
}
