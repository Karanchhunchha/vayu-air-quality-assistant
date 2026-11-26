# Vayu — Urban Air Quality Assistant

**PromptWars Challenge 6 (Hack2Skill)** · Team Vayu · Solo participant: Karan Chhunchha

Vayu is a real-time Urban Air Quality Assistant for city residents, planners and policymakers. It turns live open air-quality data into things people can act on: a colour-coded AQI dashboard showing **three AQI scales side by side (US, European and India's CPCB)**, hyperlocal hourly forecasts, personalised health guidance, a quantified activity-risk planner, pollution-source insights, GRAP-style city action plans and a conversational assistant. Vayu is a modern **React web app** that runs entirely in the browser — the deployed site is fully static, with **no backend and no API keys**.

**Live demo:** https://karanchhunchha.github.io/vayu-air-quality-assistant/

**Verified live, 26 Nov 2026 (Delhi):** US AQI **198** · EU AQI **63** · CPCB AQI **302 (Very Poor)** · cigarette equivalent **≈ 5.5/day** — all computed in the browser from live Open-Meteo data.

---

## Features mapped to the challenge brief

| Challenge requirement | How Vayu implements it |
|---|---|
| **Live AQI Dashboard** — city-wise real-time AQI using open data (OpenAQ, WAQI, CPCB) with health-risk categories and colour-coded alerts | Live dashboard powered by the **Open-Meteo Air Quality API** (CAMS atmosphere model data — a free, key-less open data source). Ten preset Indian cities (Delhi, Mumbai, Ahmedabad, Bengaluru, Kolkata, Chennai, Hyderabad, Pune, Lucknow, Patna), free-text search for any city worldwide via the Open-Meteo Geocoding API, and a "Use my location" button (browser geolocation). Shows **three AQI scales at once**: the US AQI (six colour-coded categories, Good → Hazardous), the European AQI, and **India's CPCB AQI computed locally** from trailing 24-hour/8-hour pollutant means using the official CPCB breakpoint tables. Also shows the dominant pollutant, a full pollutant breakdown (PM2.5, PM10, NO₂, SO₂, O₃, CO) with bars scaled to US EPA sub-indices and **WHO guideline markers**, a **yesterday-vs-today trend strip**, and one-tap **persona chips** (Parent, Asthma patient, Runner, Traffic police) that configure profile and guidance instantly. |
| **Hyperlocal Forecasts** — 24–72 hour AQI predictions | Animated SVG chart (Framer Motion, no chart library) of hourly US AQI for the **next 72 hours**, with category background bands, plus per-day summary cards (max AQI + category + cleanest hour) for the next 4 days, and the day's **cleanest and worst 2-hour windows** for planning time outdoors. |
| **Personalized Health Guidance** — mask, exercise, travel and ventilation advice based on user profile and AQI | A profile selector (General adult, Child, Elderly, Asthma/respiratory condition, Athlete/outdoor worker) that changes mask advice, exercise advice and indoor-ventilation advice, computes the **best hour to go outdoors** in the next 24 hours, and can **read the guidance aloud** (browser speech synthesis). A **cigarette-equivalent** line translates the day's PM2.5 into an intuitive impact figure (24-hour mean PM2.5 ÷ 22 µg/m³, after Berkeley Earth). |
| **Pollution Source Insights** — traffic, construction, stubble burning, industrial hotspots | Heuristic analysis of the live pollutant mix: PM10/PM2.5 ratio → dust & construction vs combustion; modelled dust level → dust transport; NO₂ rush-hour vs late-night pattern → traffic; elevated SO₂ → industry/coal; high O₃ → photochemical smog; elevated CO → vehicle exhaust. Presented as "likely sources" with plain-language explanations, and clearly labelled as heuristics, not measured source apportionment. |
| **Conversational Assistant** — chat interface for AQI questions, alerts and planning outdoor activities | A chat panel with **rule-based NLP**: it parses city names (presets + geocoded free text) and intents — current AQI, tomorrow's forecast, "should I wear a mask", exercise safety, best time to go out, pollution sources, health tips, and **comparing two cities**. Every answer is computed from the same live fetched data. Quick-suggestion chips included. |
| **Action Plans** — city-level interventions (green zones, odd-even, pollution-control policies) | A GRAP-style staged action plan (Stage 0 → Stage IV+) keyed to the current AQI category, with the active stage highlighted, plus a "What you can do today" citizen action list that changes with the category. An **activity planner** adds the personal side: pick an activity, start time and duration, and a transparent dose model (concentration × breathing rate × duration × profile vulnerability) returns a **0–100 risk score**, a plain-language verdict, and a suggestion to shift to the cleanest window when that lowers exposure. |
| **Gamified Awareness** — badges, streaks, challenges | An eco-action checklist (public transport, no burning, planting, energy saving, spreading awareness…) with points, four badges (Eco Starter, Green Guardian, Clean Air Champion, 3-Day Streak) and a day-streak counter, persisted in `localStorage`. A **"Share today's air report"** button (Web Share API with a WhatsApp fallback) and a **print view** that renders a clean one-page air report support awareness beyond the app. |

## Tech stack

- **Vite 6 + React 18 (JavaScript)** — source in `src/` (React components plus a framework-free data library, `src/lib/core.js`, that handles fetching and all derived-data computation).
- **Tailwind CSS 3** for styling and **Framer Motion 12** for animation (animated gauge, scroll reveals, chart draw-in), with **Aceternity UI** components — Aurora Background (animated hero backdrop tinted by the live AQI colour), Card Spotlight (cursor-tracking card highlight) and Text Generate Effect (word-by-word hero subline) — adapted into `src/components/aceternity/`. The design system (Lexend + Inter type, WCAG-AA colour tokens, tabular numerals) follows a toolkit-driven design pass — ui-ux-pro-max design data plus an impeccable-style audit — with component patterns adapted from shadcn/ui (stat strip, data rows) and Mantine (segmented profile control, ring risk score). All npm packages are **build-time dev tooling only** — the production output is a static bundle (JS ≈ 383 kB, ≈ 126 kB gzipped; CSS ≈ 27 kB) with no server component.
- **Data:** [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (hourly PM2.5, PM10, CO, NO₂, SO₂, O₃, dust, US AQI, European AQI; CAMS data; includes past days for CPCB trailing means and the yesterday trend) and [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api). Both are free and require **no API key**.
- **Persistence:** browser `localStorage` only (gamification state). No backend, no accounts, no tracking.
- **Hosting:** GitHub Pages — the production build is committed under `docs/` and served from the `main` branch's `/docs` folder.

## How to run

```bash
cd vayu-react          # the React source lives here during development
npm install
npm run dev            # local dev server with hot reload
npm test               # run the unit test suite (Vitest)
```

An internet connection is required for the live Open-Meteo data.

## How to build & deploy (GitHub Pages)

```bash
npm run build          # outputs the static site into dist/
# copy dist/ into the repo's docs/ folder and push —
# GitHub Pages (Settings → Pages → main branch, /docs folder) serves it live
```

## Testing

The data library (`src/lib/core.js`) is framework-free pure ESM, so the entire computation layer is unit-tested in Node with **Vitest** — no browser and no network needed (the API helpers are tested with a stubbed `fetch`).

```bash
npm test               # vitest run — 73 tests, all passing
```

What is covered:

- **`src/lib/core.test.js`** — the AQI mathematics and derived data: US EPA and CPCB breakpoint tables at every band boundary (values at and just over each edge), CPCB data-completeness rules (a 24-h mean needs ≥16 hourly values, an 8-h mean ≥6, and an overall AQI needs ≥3 pollutants including PM2.5 or PM10), the CO µg/m³ → mg/m³ conversion CPCB requires, the Berkeley Earth cigarette equivalence (24-h PM2.5 ÷ 22), trailing means, cleanest/worst 2-hour windows, best-hour selection, dominant pollutant, day summaries, pollution-source heuristics, health-guidance branching per profile, GRAP stage mapping, the activity risk planner (dose formula, 0–100 bounds, monotonicity in concentration and duration, profile-vulnerability sensitivity, verdict bands), and an end-to-end `summarize` snapshot over three synthetic days.
- **`src/lib/core.fetch.test.js`** — Open-Meteo URL construction, response and error handling for the air-quality, ticker and geocoding calls, and current-hour index resolution.

## An honest note on the "AI" assistant

The conversational assistant is **rule-based NLP** — intent detection and city-name parsing over the live Open-Meteo data — **not** a hosted large language model. This is deliberate: it keeps the app free, key-less, private (nothing you type leaves your browser except the public API calls) and fully functional on any static host. Likewise, the pollution "source insights" are transparent heuristics over the live pollutant mix, not an official source-apportionment study; the CPCB AQI is computed locally from modelled (CAMS) concentrations using CPCB's published breakpoint method, so it can differ from ground-station CPCB readings; and the health guidance is general information, not medical advice. AQI values are model-based CAMS data via Open-Meteo.

## Project structure

```
vayu-air-quality-assistant/ (GitHub repo)
├── src/                # React source
│   ├── components/     # Hero, Pollutants, Forecast, Health, Planner,
│   │                   # Insights, Chat, EcoGame, CityPicker, …
│   │                   # + aceternity/ (Aurora Background, Card Spotlight,
│   │                   #   Text Generate Effect — adapted Aceternity UI)
│   ├── lib/
│   │   ├── core.js            # data fetching + all derived-data computation
│   │   ├── core.test.js       # Vitest suite — AQI maths, CPCB, planner, windows
│   │   └── core.fetch.test.js # Vitest suite — API layer (stubbed fetch)
│   ├── App.jsx
│   └── main.jsx
├── docs/               # production build output, served by GitHub Pages
├── index.html
├── package.json        # Vite + React + Tailwind + Framer Motion (dev-only deps)
├── README.md           # this file
├── SUBMISSION.md       # hackathon submission form content
├── report.md           # project report (source for the submission PDF)
└── DEMO-SCRIPT.md      # 2–3 minute Loom walkthrough script
```
