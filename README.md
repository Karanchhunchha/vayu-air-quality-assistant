# Vayu — Urban Air Quality Assistant

**PromptWars Challenge 6 (Hack2Skill)** · Team Vayu · Solo participant: Karan Chhunchha

Vayu is a real-time, AI-powered Urban Air Quality Assistant for city residents, planners and policymakers. It turns live open air-quality data into things people can act on: a colour-coded AQI dashboard, hyperlocal hourly forecasts, personalised health guidance, pollution-source insights, GRAP-style city action plans and a conversational assistant — all in a dependency-free static web app.

**Live demo:** _to be filled after deployment_ (GitHub Pages: `https://karanchhunchha.github.io/vayu-air-quality-assistant/`)

---

## Features mapped to the challenge brief

| Challenge requirement | How Vayu implements it |
|---|---|
| **Live AQI Dashboard** — city-wise real-time AQI using open data (OpenAQ, WAQI, CPCB) with health-risk categories and colour-coded alerts | Live dashboard powered by the **Open-Meteo Air Quality API** (CAMS atmosphere model data — a free, key-less open data source). Ten preset Indian cities (Delhi, Mumbai, Ahmedabad, Bengaluru, Kolkata, Chennai, Hyderabad, Pune, Lucknow, Patna), free-text search for any city worldwide via the Open-Meteo Geocoding API, and a "Use my location" button (browser geolocation). Shows the current US AQI as a large number with the standard six colour-coded categories (Good → Hazardous), the European AQI for comparison, the dominant pollutant, and a full pollutant breakdown (PM2.5, PM10, NO₂, SO₂, O₃, CO) with bars scaled to US EPA sub-indices. |
| **Hyperlocal Forecasts** — 24–72 hour AQI predictions | Hand-rolled canvas chart (no chart library) of hourly US AQI for the **next 72 hours**, with category background bands, plus per-day summary cards (max AQI + category + cleanest hour) for the next 4 days. |
| **Personalized Health Guidance** — mask, exercise, travel and ventilation advice based on user profile and AQI | A profile selector (General adult, Child, Elderly, Asthma/respiratory condition, Athlete/outdoor worker) that changes mask advice, exercise advice and indoor-ventilation advice, and computes the **best hour to go outdoors** in the next 24 hours from the forecast. |
| **Pollution Source Insights** — traffic, construction, stubble burning, industrial hotspots | Heuristic analysis of the live pollutant mix: PM10/PM2.5 ratio → dust & construction vs combustion; modelled dust level → dust transport; NO₂ rush-hour vs late-night pattern → traffic; elevated SO₂ → industry/coal; high O₃ → photochemical smog; elevated CO → vehicle exhaust. Presented as "likely sources" with plain-language explanations, and clearly labelled as heuristics, not measured source apportionment. |
| **Conversational Assistant** — chat interface for AQI questions, alerts and planning outdoor activities | A chat panel with **rule-based NLP**: it parses city names (presets + geocoded free text) and intents — current AQI, tomorrow's forecast, "should I wear a mask", exercise safety, best time to go out, pollution sources, health tips, and **comparing two cities**. Every answer is computed from the same live fetched data. Quick-suggestion chips included. |
| **Action Plans** — city-level interventions (green zones, odd-even, pollution-control policies) | A GRAP-style staged action plan (Stage 0 → Stage IV+) keyed to the current AQI category, with the active stage highlighted, plus a "What you can do today" citizen action list that changes with the category. |
| **Gamified Awareness** — badges, streaks, challenges | An eco-action checklist (public transport, no burning, planting, energy saving, spreading awareness…) with points, four badges (Eco Starter, Green Guardian, Clean Air Champion, 3-Day Streak) and a day-streak counter, persisted in `localStorage`. |

## Tech stack

- **Plain HTML5, CSS3 and vanilla JavaScript** — no frameworks, no build step, no bundler, no external CSS/JS libraries. Three files: `app/index.html`, `app/styles.css`, `app/app.js`.
- **Data:** [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (hourly PM2.5, PM10, CO, NO₂, SO₂, O₃, dust, US AQI, European AQI; CAMS data) and [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api). Both are free and require **no API key**.
- **Charts:** hand-drawn on an HTML `<canvas>` element (devicePixelRatio-aware).
- **Persistence:** browser `localStorage` only (gamification state). No backend, no accounts, no tracking.
- **Hosting:** any static host — the deployment target is **GitHub Pages** (the contents of `app/` are published at the root of the repo `vayu-air-quality-assistant`); all asset paths are relative, so it also works from a sub-path or a local folder.

## How to run

```bash
# Option 1: just open it
open app/index.html        # or double-click the file

# Option 2: serve it locally (recommended)
cd app
python3 -m http.server 8000
# then visit http://localhost:8000
```

An internet connection is required for the live Open-Meteo data; the page shell itself has no external dependencies.

## How to deploy (GitHub Pages)

1. Create a GitHub repo named `vayu-air-quality-assistant`.
2. Copy the **contents of `app/`** (`index.html`, `styles.css`, `app.js`) into the repo root and push.
3. In the repo: **Settings → Pages → Deploy from a branch → `main` / root**.
4. The site goes live at `https://<username>.github.io/vayu-air-quality-assistant/`.

## An honest note on the "AI" assistant

The conversational assistant is **rule-based NLP** — intent detection and city-name parsing over the live Open-Meteo data — **not** a hosted large language model. This is deliberate: it keeps the app free, key-less, private (nothing you type leaves your browser except the public API calls) and fully functional on any static host. Likewise, the pollution "source insights" are transparent heuristics over the live pollutant mix, not an official source-apportionment study, and the health guidance is general information, not medical advice. AQI values are model-based CAMS data via Open-Meteo, shown on the US EPA scale.

## Project structure

```
promptwars-challenge6/
├── app/                # the deployable static site (publish these files at the host root)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── README.md           # this file
├── SUBMISSION.md       # hackathon submission form content
├── report.md           # project report (source for the submission PDF)
└── DEMO-SCRIPT.md      # 2–3 minute Loom walkthrough script
```
