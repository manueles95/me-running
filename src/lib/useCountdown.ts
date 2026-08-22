import { useEffect, useState } from 'react';
import { countdownTo, type CountdownParts } from './dates';

/**
 * Live countdown to local midnight of `targetIso` in CDMX, ticking every second.
 * Per spec §6, the countdown keeps updating even under prefers-reduced-motion —
 * it is information, not decoration.
 */
export function useCountdown(targetIso: string | null): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(() =>
    targetIso ? countdownTo(targetIso) : null,
  );

  useEffect(() => {
    if (!targetIso) {
      setParts(null);
      return;
    }
    setParts(countdownTo(targetIso));
    const id = window.setInterval(() => setParts(countdownTo(targetIso)), 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  return parts;
}
