# Road to London — Training Dashboard Spec

**Status:** Spec only. No implementation yet. A future session implements this.
**Owner:** Manuel
**Purpose:** A personal, static, motivational dashboard showing the full training journey — where it started (Chicago 2025), where it is now (base phase), and where it's going (10K Nov 2026 → London Marathon, April 25, 2027). Optimized for one viewer: Manuel, on his phone or desktop, before or after a run.

---

## 1. Goals & non-goals

**Goals**
- Single-page static site that renders the entire training story: past trends, current block status, and future plan.
- All data comes from one JSON file committed to the repo. No backend, no API calls, no auth.
- Updated via workflow: analysis session (Claude + Strava MCP) extracts analytics → writes/updates the JSON → commit → site re-renders on next deploy.
- Motivating by design: progress made visible, milestones celebrated, countdowns ticking.

**Non-goals**
- No live Strava integration from the browser. The site never calls Strava; it renders the committed JSON only.
- No editing UI. The JSON is the source of truth, edited by analysis sessions or by hand.
- No user accounts, comments, or multi-athlete support.
- Not a training log replacement (Strava remains that); this is the *narrative and trends* layer.

---

## 2. Tech stack

**Recommended:** Vite + React + TypeScript, static build (`vite build` → `dist/`), deployed to GitHub Pages (or Netlify/Vercel static). Rationale: matches Manuel's daily stack (React/TS), typed data model guards the JSON contract, zero server cost.

- Charts: **Recharts** (declarative, small API surface, good enough for line/bar/scatter needs here). Alternative if bundle size matters: uPlot.
- Styling: plain CSS or CSS modules. No Tailwind requirement; see §6 for design direction.
- Data loading: `import trainingData from './data/training.json'` at build time (typed via a `TrainingData` interface generated from §4). No runtime fetch needed; a rebuild accompanies every data commit anyway.
- Countdown logic: computed client-side from race dates in the JSON.

Repo layout:

```
/
├── data/
│   └── training.json        # single source of truth (§4)
├── src/
│   ├── types/training.ts    # TS interfaces mirroring the JSON schema
│   ├── components/          # one component per section (§5)
│   └── App.tsx              # section order = §5 order
├── index.html
└── vite.config.ts
```

---

## 3. Update workflow (how data gets in)

1. Manuel runs an analysis session (like the ongoing Strava deep-dives).
2. At the end of a session, Claude emits an updated `training.json` (full file, not a patch) reflecting new weeks, sessions, trend points, milestones.
3. Manuel commits it to the repo; CI (GitHub Action) rebuilds and deploys.
4. `schema_version` in the JSON lets a future session evolve the schema safely; the site should render unknown extra fields as ignored, and fail loudly (build-time type error) on missing required ones.

Cadence expectation: weekly-ish (after long runs or quality sessions). The schema is therefore optimized for **append-mostly** updates: new array entries, occasional status flips.

---

## 4. Data model — `data/training.json`

Single JSON object. All dates ISO `YYYY-MM-DD`. All paces stored as **seconds per km** (render layer formats to `M:SS/km`). Distances in km, HR in bpm.

```jsonc
{
  "schema_version": 1,
  "updated_at": "2026-08-20",

  "athlete": {
    "name": "Manuel",
    "location": "Mexico City (2,240 m altitude)",
    "zones": { "z2_ceiling_hr": 147, "lthr": 177 }
  },

  "races": [
    {
      "id": "chicago-2025",
      "name": "Chicago Marathon",
      "date": "2025-10-12",
      "distance_km": 42.195,
      "status": "completed",
      "result_time_s": 13817,           // 3:50:17
      "note": "First marathon."
    },
    {
      "id": "cdmx-10k-2026",
      "name": "10K — Día de Muertos weekend",
      "date": "2026-11-01",
      "distance_km": 10,
      "status": "upcoming",
      "goal": "Sub-50 (public), faster (quiet)"
    },
    {
      "id": "half-2027",
      "name": "Half marathon (TBD)",
      "date": null,                      // Feb–Mar 2027, race TBD
      "window": "2027-02/2027-03",
      "distance_km": 21.097,
      "status": "planned",
      "goal": "London dress rehearsal"
    },
    {
      "id": "london-2027",
      "name": "London Marathon",
      "date": "2027-04-25",
      "distance_km": 42.195,
      "status": "upcoming",
      "goal": "Sub-3:30 (fallback 3:40)",
      "is_goal_race": true
    }
  ],

  "phases": [
    // The macro plan. Past, current, and future blocks all live here.
    // status: "done" | "current" | "planned"
    { "id": "base-5x4",   "label": "Build: 5×4 threshold", "start": "2026-07-20", "end": "2026-08-09", "status": "done" },
    { "id": "deload-aug", "label": "Deload",               "start": "2026-08-10", "end": "2026-08-16", "status": "done" },
    { "id": "base-4x6",   "label": "Build: 4×6 threshold", "start": "2026-08-17", "end": "2026-09-06", "status": "current" },
    { "id": "deload-sep", "label": "Deload + checkpoint",  "start": "2026-09-07", "end": "2026-09-13", "status": "planned" },
    { "id": "base-4x8",   "label": "Build: 4×8 (short — trip)", "start": "2026-09-14", "end": "2026-09-25", "status": "planned" },
    { "id": "turkey",     "label": "Turkey with mom 🇹🇷",   "start": "2026-09-26", "end": "2026-10-08", "status": "planned", "kind": "break" },
    { "id": "return-ramp","label": "Return ramp → 10K race","start": "2026-10-09", "end": "2026-11-01", "status": "planned" },
    { "id": "tempo-1",    "label": "Tempo block 1 (2×12 → 25 min)", "start": "2026-11-02", "end": "2026-11-29", "status": "planned" },
    { "id": "tempo-2",    "label": "Tempo block 2 (→ 30–35 min)",   "start": "2026-11-30", "end": "2026-12-20", "status": "planned" },
    { "id": "holiday",    "label": "Holiday deload",       "start": "2026-12-21", "end": "2027-01-03", "status": "planned", "kind": "break" },
    { "id": "london-build","label": "London build (16 weeks)", "start": "2027-01-04", "end": "2027-04-25", "status": "planned", "highlight": true }
  ],

  "weeks": [
    // One entry per completed week. Append-only.
    {
      "start": "2026-07-27",
      "km": 50.2,
      "phase_id": "base-5x4",
      "type": "build",                  // "build" | "deload" | "race" | "break" | "ramp"
      "highlight": "First 50 km week"   // optional
    }
  ],

  "planned_volume": [
    // Future intent, coarse. Rendered as ghost bars after the last real week.
    { "start": "2026-08-24", "km_target": 49 },
    { "start": "2026-08-31", "km_target": 50 }
  ],

  "easy_runs": [
    // Trend series for EF chart. One entry per easy/long run worth plotting.
    {
      "date": "2026-08-03",
      "distance_km": 8.33,
      "pace_s_per_km": 409,
      "avg_hr": 138.3,
      "ef": 1.060,                      // (m/min) / bpm, precomputed
      "kind": "easy"                    // "easy" | "long" | "recovery"
    }
  ],

  "quality_sessions": [
    // One entry per threshold/quality session. Powers the progression chart.
    {
      "date": "2026-08-18",
      "label": "4×6 #1",
      "structure": "4 × 6:00 @ 4:35–4:45, 1:30 rec",
      "avg_rep_pace_s_per_km": 277,     // 4:37
      "avg_rep_hr": 186,
      "relative_effort": 129,
      "note": "Hot 9:45 start, wrong shoes — ran VO2, not threshold. Fixes: early start, Megablasts, 2:00 rec."
    }
  ],

  "long_run_progression": [
    // Subset view also derivable from easy_runs kind=long; kept separate for the simple stepped chart.
    { "date": "2026-08-01", "km": 18.0, "pace_s_per_km": 421, "avg_hr": 143.5 }
  ],

  "milestones": [
    // The PR wall / motivation feed. Append-only, newest first in render.
    { "date": "2026-08-09", "title": "First sub-7:00 long run", "detail": "16.6 km @ 6:56/km, 142 bpm" },
    { "date": "2026-08-01", "title": "First 50 km week", "detail": "45 → 50 in one block, absorbed clean" }
  ],

  "comparisons": [
    // "Same run, different runner" cards. The motivational core.
    {
      "title": "Same 6 km, 20 months apart",
      "before": { "date": "2024-12-03", "detail": "6.0 km @ 6:54/km", "hr": 167 },
      "after":  { "date": "2026-07-29", "detail": "5.2 km @ 7:15/km", "hr": 138 },
      "punchline": "≈30 bpm cheaper. Same streets. Different engine."
    }
  ],

  "checkpoints": [
    {
      "date": "2026-09-10",
      "label": "September checkpoint",
      "question": "Has threshold moved? (HR at 4:40 in a clean 4×6 + monthly EF trend)",
      "status": "pending",              // "pending" | "passed" | "adjusted"
      "outcome": null
    }
  ],

  "targets": {
    "easy_pace_dec_2026": { "band_s_per_km": [380, 395], "note": "6:20–6:35 central expectation; 6:20 = good scenario" },
    "weekly_km_cap": 55,
    "long_run_by_dec": 24
  }
}
```

**Seed data note for the implementing session:** the values shown above are real and current as of 2026-08-20. Seed the initial JSON from this spec plus the analysis-session history (easy-run EF series from late March 2026 onward exists in past analyses; start the series at the March/April entries if available, otherwise begin mid-July 2026 where the density is best).

---

## 5. Page structure (single page, scroll narrative, section order fixed)

1. **Hero — the countdown.** London Marathon, live countdown (days), goal `sub-3:30`. Secondary chip: next start line (10K · Nov 1 · sub-50) with its own smaller countdown. One line of context: *"Chicago 2025: 3:50:17. London 2027: the answer."*
2. **The road (phase timeline).** Horizontal timeline from Chicago (Oct 2025) to London (Apr 2027). Each phase from `phases[]` is a segment; breaks (Turkey, holidays) render distinctly; "you are here" marker on the current date. Race flags at their dates. This is the site's signature element — see §6.
3. **Current block card.** From the `phases` entry with `status: "current"` + latest `quality_sessions` and `weeks`: block name, week N of M, last quality session (label + one-line note), next known session. Small, glanceable, phone-first.
4. **Engine trends (2 charts).**
   a. *Easy-run efficiency:* EF over time (scatter + rolling average) from `easy_runs`. Reference band for the December target. This is the chart that proves the boring weeks work.
   b. *Threshold progression:* per `quality_sessions`, rep pace (y1) and rep HR (y2) over time — the "faster AND cheaper" story in one picture.
5. **Volume.** Weekly km bars from `weeks`, colored by `type` (build/deload/race/break), with `planned_volume` as ghost bars ahead. Deloads visibly smaller **on purpose** — label them so the dips read as design, not failure.
6. **Long run progression.** Stepped line of long-run distance, with the future intent (19–20 → 22–24 → build targets) as a dotted continuation.
7. **Milestone wall.** Reverse-chronological cards from `milestones`. Compact, dense, celebratory.
8. **Then vs now.** The `comparisons` cards: before/after stat pairs with the punchline. Emotional anchor of the page.
9. **Footer.** `updated_at`, link to the Strava profile, and the standing philosophy line: *"Boring, disciplined, repeated weeks."*

Mobile: single column, sections stack in the same order; timeline (§2) becomes vertically scrollable or horizontally swipeable.

---

## 6. Design direction

Grounded in the actual subject: a Mexico City runner's 21-month road from Grant Park to Greenwich Park, built on Z2 patience.

- **Mood:** early-morning CDMX — pre-dawn asphalt, jacaranda, the palette of a city at 6:30 AM. Not a generic fitness-app dark theme, and explicitly **not** neon-on-black dashboard chic.
- **Signature element (spend the boldness here):** the phase timeline (§5.2) rendered as a *route* — a road/course line winding from Chicago to London with distance markers, aid-station-style phase labels, and the runner's current position. Everything else on the page stays quiet and disciplined around it.
- **Typography:** one characterful display face for the hero countdown and section heads (something with athletic/editorial character — implementing session picks deliberately, not Inter-for-everything), a clean body face, and a tabular-numerals mono for all stats, paces, and countdowns (numbers are the content here; they deserve a dedicated voice).
- **Copy register:** plain, specific, second person kept to a minimum — the site speaks in Manuel's own vocabulary ("deload," "EF," "the boring weeks"). No hype-speak, no "crush your goals."
- **Charts:** consistent minimal styling; no chart borders/gridline noise; annotate the two or three points that matter (first 50 km week, the hot 4×6) directly on the chart rather than in legends.
- **Quality floor:** responsive to 375 px, keyboard focus visible, `prefers-reduced-motion` respected (countdown still updates; decorative motion stops).
- The implementing session should follow the frontend-design skill's two-pass process (plan tokens → self-critique against "would any fitness dashboard look like this?" → build).

---

## 7. Acceptance criteria

- [ ] `npm run build` produces a fully static `dist/` with no runtime network calls.
- [ ] Site renders correctly from `training.json` alone; deleting any optional field degrades gracefully, missing required fields fail the TS build.
- [ ] Countdown(s) correct across timezones (compute in `America/Mexico_City`).
- [ ] All five data visualizations render from the seed data: timeline, EF trend, threshold progression, volume bars, long-run steps.
- [ ] A new week appended to `weeks` + one `easy_runs` entry appears correctly with **no code changes**.
- [ ] Phase timeline shows "you are here" accurately and updates as dates pass without a data edit.
- [ ] Lighthouse: 95+ performance on mobile (it's a static page; there is no excuse).
- [ ] Looks intentional at 375 px and 1440 px.

---

## 8. Later ideas (out of scope for v1 — park here)

- Race-result mode: after Nov 1, the hero flips to celebrate the result before re-anchoring on London.
- London build view: once Jan 4 arrives, a week-by-week 16-week grid becomes the primary navigation.
- A tiny script (`npm run validate-data`) that schema-checks `training.json` in CI so a bad commit fails before deploy.
- Auto-generated OG image with the current countdown for sharing.
- Post-London: the whole site becomes the permanent archive of the journey.
