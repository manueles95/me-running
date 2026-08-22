import type { Comparison } from '../types/training';
import { formatDate } from '../lib/format';

interface Props {
  comparisons: Comparison[];
}

export function ThenVsNow({ comparisons }: Props) {
  if (comparisons.length === 0) return null;

  return (
    <section className="section" id="then-vs-now" aria-labelledby="tvn-title">
      <div className="section__head">
        <span className="section__kicker">§ then vs now</span>
        <h2 id="tvn-title" className="section__title">
          Same streets, different engine
        </h2>
      </div>

      <div className="tvn">
        {comparisons.map((c) => (
          <article className="tvn__card card" key={c.title}>
            <h3 className="tvn__title">{c.title}</h3>
            <div className="tvn__pair">
              <div className="tvn__side">
                <div className="tvn__tag mono">then</div>
                <div className="tvn__date mono">{formatDate(c.before.date)}</div>
                <div className="tvn__detail mono">{c.before.detail}</div>
                {c.before.hr != null && (
                  <div className="tvn__hr mono">
                    <span className="tvn__hrnum">{c.before.hr}</span> bpm
                  </div>
                )}
              </div>
              <div className="tvn__arrow mono" aria-hidden="true">
                →
              </div>
              <div className="tvn__side tvn__side--after">
                <div className="tvn__tag mono">now</div>
                <div className="tvn__date mono">{formatDate(c.after.date)}</div>
                <div className="tvn__detail mono">{c.after.detail}</div>
                {c.after.hr != null && (
                  <div className="tvn__hr mono">
                    <span className="tvn__hrnum">{c.after.hr}</span> bpm
                  </div>
                )}
              </div>
            </div>
            <p className="tvn__punch">{c.punchline}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
