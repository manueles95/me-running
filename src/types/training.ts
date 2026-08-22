// TS interfaces mirroring data/training.json (spec §4).
// Required fields are non-optional so a missing one fails the build (spec §3, §7).
// Optional fields use `?` so deleting one degrades gracefully at render time.
// Unknown extra fields are simply ignored by the render layer.

export type RaceStatus = 'completed' | 'upcoming' | 'planned';
export type PhaseStatus = 'done' | 'current' | 'planned';
export type PhaseKind = 'break';
export type WeekType = 'build' | 'deload' | 'race' | 'break' | 'ramp';
export type EasyRunKind = 'easy' | 'long' | 'recovery';
export type CheckpointStatus = 'pending' | 'passed' | 'adjusted';

export interface Athlete {
  name: string;
  location: string;
  zones: {
    z2_ceiling_hr: number;
    lthr: number;
  };
}

export interface Race {
  id: string;
  name: string;
  /** ISO YYYY-MM-DD, or null when only a window is known. */
  date: string | null;
  distance_km: number;
  status: RaceStatus;
  /** Finish time in seconds (completed races). */
  result_time_s?: number;
  /** e.g. "2027-02/2027-03" when date is null. */
  window?: string;
  goal?: string;
  note?: string;
  is_goal_race?: boolean;
}

export interface Phase {
  id: string;
  label: string;
  start: string;
  end: string;
  status: PhaseStatus;
  kind?: PhaseKind;
  highlight?: boolean;
}

export interface Week {
  /** ISO date of the Monday that starts the week. */
  start: string;
  km: number;
  phase_id: string;
  type: WeekType;
  highlight?: string;
}

/**
 * Forward plan (spec-additive). One entry per upcoming week — targets, not
 * commitments. `km_target`/`long_run_km` are null where undecided (e.g. the
 * London build, planned later); `type` mirrors the Week types.
 */
export interface FutureWeek {
  start: string;
  km_target: number | null;
  type: WeekType;
  phase_id: string;
  quality: string | null;
  long_run_km: number | null;
  note?: string;
}

export interface FuturePlan {
  note?: string;
  weeks: FutureWeek[];
}

export interface EasyRun {
  date: string;
  distance_km: number;
  pace_s_per_km: number;
  /** May be null (e.g. no HR strap) — such runs are skipped by EF visuals. */
  avg_hr: number | null;
  /** Efficiency factor: (m/min) / bpm, precomputed. Null when avg_hr is null. */
  ef: number | null;
  kind: EasyRunKind;
  note?: string;
}

/**
 * Monthly efficiency-factor averages (spec-additive). Historical context for the
 * EF chart, predating the per-run easy_runs series.
 */
export interface MonthlyEf {
  /** ISO year-month, e.g. "2026-03". */
  month: string;
  ef_avg: number;
  /** Pace (s/km) the monthly EF equates to at ~145 bpm. */
  equiv_pace_at_145_s_per_km: number;
  note?: string;
}

export interface QualitySession {
  date: string;
  label: string;
  structure: string;
  avg_rep_pace_s_per_km: number;
  avg_rep_hr: number;
  relative_effort?: number | null;
  note?: string;
}

export interface LongRunPoint {
  date: string;
  km: number;
  pace_s_per_km: number;
  avg_hr: number;
  note?: string;
}

export interface Milestone {
  date: string;
  title: string;
  detail: string;
}

export interface ComparisonSide {
  date: string;
  detail: string;
  hr: number | null;
}

export interface Comparison {
  title: string;
  before: ComparisonSide;
  after: ComparisonSide;
  punchline: string;
}

export interface Checkpoint {
  date: string;
  label: string;
  question: string;
  status: CheckpointStatus;
  outcome: string | null;
}

export interface Targets {
  easy_pace_dec_2026: {
    /** [min, max] pace band in seconds/km. */
    band_s_per_km: number[];
    note?: string;
  };
  weekly_km_cap: number;
  long_run_by_dec_km: number;
  threshold_projection?: string;
}

/** A shoe or device with its role (spec-additive). Notes rendered verbatim. */
export interface Gear {
  name: string;
  role: string;
}

export interface TrainingData {
  schema_version: number;
  updated_at: string;
  athlete: Athlete;
  races: Race[];
  phases: Phase[];
  weeks: Week[];
  future_plan: FuturePlan;
  monthly_ef: MonthlyEf[];
  easy_runs: EasyRun[];
  quality_sessions: QualitySession[];
  long_run_progression: LongRunPoint[];
  milestones: Milestone[];
  comparisons: Comparison[];
  checkpoints: Checkpoint[];
  targets: Targets;
  gear: Gear[];
}
