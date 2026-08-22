// Date math anchored to America/Mexico_City (spec §7).
// Mexico abolished DST in 2022, so the zone is a fixed UTC-6 year-round — a
// literal offset is correct and needs no tz database at runtime.

const MX_OFFSET = '-06:00';
const DAY_MS = 24 * 60 * 60 * 1000;

/** Epoch ms for local midnight (00:00) of an ISO date in America/Mexico_City. */
export function mexicoCityMidnight(iso: string): number {
  return new Date(`${iso}T00:00:00${MX_OFFSET}`).getTime();
}

/** "Now" as the number of ms since epoch (kept as a function for testability). */
export function nowMs(): number {
  return Date.now();
}

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

/** Time remaining from `now` until local midnight of `targetIso` in CDMX. */
export function countdownTo(targetIso: string, now: number = nowMs()): CountdownParts {
  const totalMs = mexicoCityMidnight(targetIso) - now;
  const clamped = Math.max(0, totalMs);
  return {
    totalMs,
    days: Math.floor(clamped / DAY_MS),
    hours: Math.floor((clamped % DAY_MS) / (60 * 60 * 1000)),
    minutes: Math.floor((clamped % (60 * 60 * 1000)) / (60 * 1000)),
    seconds: Math.floor((clamped % (60 * 1000)) / 1000),
    isPast: totalMs <= 0,
  };
}

/** Whole days between two ISO dates (CDMX calendar), b - a. */
export function daysBetween(aIso: string, bIso: string): number {
  return Math.round((mexicoCityMidnight(bIso) - mexicoCityMidnight(aIso)) / DAY_MS);
}

/** Shift an ISO date by ±days, returning an ISO YYYY-MM-DD (CDMX calendar). */
export function addDays(iso: string, days: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(mexicoCityMidnight(iso) + days * DAY_MS));
}

/** Today's date in CDMX as an ISO YYYY-MM-DD string. */
export function todayInMexicoCity(now: number = nowMs()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
}

/**
 * Fractional progress (0..1) of `now` through a [start, end] date span.
 * Used by the phase timeline's "you are here" marker.
 */
export function spanProgress(startIso: string, endIso: string, now: number = nowMs()): number {
  const start = mexicoCityMidnight(startIso);
  // End is inclusive of the whole end day.
  const end = mexicoCityMidnight(endIso) + DAY_MS;
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now - start) / (end - start);
}
