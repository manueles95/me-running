import type { Milestone } from '../types/training';
import { formatDate } from '../lib/format';

interface Props {
  milestones: Milestone[];
}

export function MilestoneWall({ milestones }: Props) {
  if (milestones.length === 0) return null;
  const sorted = [...milestones].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <section className="section" id="milestones" aria-labelledby="milestones-title">
      <div className="section__head">
        <span className="section__kicker">§ milestone wall</span>
        <h2 id="milestones-title" className="section__title">
          The PR wall
        </h2>
      </div>

      <ul className="wall">
        {sorted.map((m) => (
          <li className="wall__card card" key={`${m.date}-${m.title}`}>
            <div className="wall__date mono">{formatDate(m.date)}</div>
            <div className="wall__title">{m.title}</div>
            <div className="wall__detail mono">{m.detail}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
