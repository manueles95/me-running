// Render-layer formatting. Data stores paces as seconds/km, times as seconds,
// distances as km; these turn them into the strings people read.

/** 277 → "4:37/km" (pace). */
export function formatPace(secondsPerKm: number): string {
  return `${formatClock(secondsPerKm)}/km`;
}

/** 277 → "4:37"; 13817 → "3:50:17". Hours shown only when present. */
export function formatClock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 42.195 → "42.2"; 50 → "50". Trims a trailing ".0". */
export function formatKm(km: number, digits = 1): string {
  const fixed = km.toFixed(digits);
  return fixed.replace(/\.0+$/, '');
}

/** "2026-08-18" → "Aug 18, 2026". Parsed as a plain calendar date (no TZ shift). */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
    ...opts,
  }).format(dt);
}

/** "2026-08-18" → "Aug 18". Short form for chart axes and dense cards. */
export function formatDateShort(iso: string): string {
  return formatDate(iso, { year: undefined });
}

/** "2026-08-18" → "Aug '26". Month + 2-digit year, for long timelines. */
export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, 1));
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(dt);
  return `${month} '${String(y).slice(2)}`;
}
