import type { Gear as GearItem } from '../types/training';

interface Props {
  gear: GearItem[];
}

/** Low-prominence, footer-adjacent kit list. Roles shown verbatim (spec-additive). */
export function Gear({ gear }: Props) {
  if (gear.length === 0) return null;
  return (
    <section className="gear" aria-label="Gear">
      <span className="gear__kicker mono">the kit</span>
      <ul className="gear__list">
        {gear.map((g) => (
          <li className="gear__item" key={g.name}>
            <span className="gear__name">{g.name}</span>
            <span className="gear__role mono">{g.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
