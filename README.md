# Road to London — Training Dashboard

A single-page, static, personal dashboard for Manuel's marathon training journey
from **Chicago 2025** to the **London Marathon (Apr 25, 2027)**. It renders the
full story — past trends, the current block, and the future plan — from one
committed JSON file. No backend, no API calls, no auth.

Built to the spec in [`training-dashboard-spec.md`](./training-dashboard-spec.md).

## Stack

- **Vite + React + TypeScript**, static build (`vite build` → `dist/`)
- **Recharts** for the five data visualizations
- Self-hosted variable fonts (Fraunces / Manrope / JetBrains Mono) bundled at
  build time — the deployed page makes **zero runtime network calls**
- Plain CSS with design tokens (light "dawn" + dark "pre-dawn" themes)

## Develop

```bash
npm install
npm run dev        # local dev server with HMR
npm run build      # type-check + static build → dist/
npm run preview    # serve the built dist/ locally
```

## The data workflow (how updates get in)

`data/training.json` is the **single source of truth**. To update the site after
a training analysis session:

1. Edit `data/training.json` — append new entries to `weeks`, `easy_runs`,
   `quality_sessions`, `long_run_progression`, `milestones`; flip a `phases`
   `status`; update `updated_at`.
2. Commit and push to `main`. CI (`.github/workflows/deploy.yml`) type-checks,
   builds, and deploys to GitHub Pages.

No code changes are needed to add a week or a run — the components read whatever
is in the JSON. The TypeScript contract in `src/types/training.ts` guards the
schema: a shape mismatch fails `npm run build` rather than shipping a broken page.

### Schema notes

- All dates are ISO `YYYY-MM-DD`. Paces are **seconds per km** (the render layer
  formats to `M:SS/km`). Distances in km, HR in bpm.
- Countdowns and the "you are here" marker are computed in `America/Mexico_City`
  and update live in the browser — no data edit needed as dates pass.
- Optional fields degrade gracefully when removed; required fields are enforced
  at build time.

## Deploy

The included GitHub Actions workflow deploys to **GitHub Pages** on every push to
`main`. For a project site served under `/<repo>/`, set a repository variable
`BASE_PATH` to `/<repo>/`; for a user/org site or Netlify/Vercel, leave it unset
(defaults to `/`).

## Layout

```
data/training.json        # single source of truth (spec §4)
src/
  types/training.ts       # TS interfaces mirroring the JSON schema
  trainingData.ts         # typed import of the JSON
  lib/                    # date math (CDMX tz), formatting, countdown hook
  components/             # one component per section (spec §5)
    charts/               # chart toolkit + EF / threshold charts
  styles/                 # tokens + base + component CSS
  App.tsx                 # section order = spec §5 order
```
