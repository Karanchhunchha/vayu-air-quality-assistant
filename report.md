# Vayu — Urban Air Quality Assistant

**PromptWars Challenge 6 · Hack2Skill**
**Team Vayu** — Solo participant: **Karan Chhunchha** (karamchhunchha@gmail.com)

---

## Abstract

Air pollution is one of India's most serious public-health challenges, yet the data that could help citizens avoid exposure is scattered across technical dashboards that most people never open. Vayu — Urban Air Quality Assistant is a real-time, citizen-friendly web application that converts live open air-quality data into clear, actionable guidance. Built with **React, Vite, Tailwind CSS and Framer Motion** — with **Aceternity UI** components (Aurora Background, Card Spotlight and Text Generate Effect) adapted for interface polish — it presents three AQI scales side by side — US, European, and India's CPCB AQI computed locally in the browser — for ten preset Indian cities and any searchable city worldwide; forecasts hourly AQI for the next 72 hours; personalises health advice by user profile; quantifies personal impact through a cigarette-equivalent figure, cleanest/worst two-hour windows and an activity risk-score planner; explains the likely sources behind today's pollution using transparent heuristics; links the current AQI category to a GRAP-style city action plan; and answers natural-language questions through a rule-based conversational assistant. A gamified eco-action system with points, badges and streaks encourages sustained behaviour change. The deployed application is a static site — **no backend, no API keys** — hosted free on GitHub Pages and powered by the free Open-Meteo Air Quality (CAMS) and Geocoding APIs. In a live test on 26 Nov 2026, Vayu reported Delhi at US AQI 198, EU AQI 63 and CPCB AQI 302 (Very Poor), a cigarette equivalent of ≈ 5.5/day.

## 1. Problem Statement

- Urban residents are exposed to harmful air pollution daily, but raw AQI numbers alone do not tell a parent whether a child should play outside, an asthma patient whether to carry a mask, or a runner when to train.
- Official data sources (CPCB, state boards) are fragmented, technical and rarely personalised; forecasts, health guidance and source explanations live in different places.
- Policymakers and citizens lack a single, simple view connecting *current conditions → what happens next → what should be done* — by individuals and by the city.
- Any solution meant for mass use in India must be free to run, work on ordinary phones and browsers, and require no sign-ups or paid services.

## 2. Solution Overview

Vayu addresses the problem with a single-page React application that runs entirely in the browser:

1. **Live AQI dashboard** — current US AQI, European AQI and locally computed **CPCB (India) AQI**, colour-coded categories, dominant pollutant and a six-pollutant breakdown with WHO guideline markers, for preset Indian cities, any searched city, or the user's own location. A trend strip compares today's peak AQI with yesterday's, and persona chips (Parent, Asthma patient, Runner, Traffic police) configure the app in one tap.
2. **Hyperlocal forecast** — hourly AQI for the next 72 hours on an animated chart, with per-day peak/cleanest-hour summary cards for four days, plus the day's cleanest and worst two-hour windows.
3. **Personalised health guidance** — mask, exercise and ventilation advice that adapts to five user profiles, the computed best hour to go outdoors in the next 24 hours, read-aloud playback, and a **cigarette-equivalent** translation of the day's PM2.5 exposure.
4. **Activity risk planner** — a transparent dose model that scores any planned activity (activity × start time × duration) from 0–100 with a plain-language verdict and a lower-exposure alternative window.
5. **Pollution source insights** — heuristic interpretation of the live pollutant mix (dust/construction, traffic, combustion, industry, photochemical smog, dust transport) in plain language.
6. **Conversational assistant** — rule-based NLP (intent + city parsing) answering questions from the same live data, including two-city comparisons.
7. **City action plan** — GRAP-style staged interventions keyed to the live AQI category, plus citizen actions.
8. **Sharing & gamified awareness** — a one-tap shareable daily air report (Web Share / WhatsApp), a printable one-page summary, and an eco-action checklist with points, badges and a daily streak persisted on-device.

## 3. Architecture

```
┌──────────────────── Browser (built React app) ────────────────────────┐
│  GitHub Pages serves the production bundle from the repo's docs/      │
│  folder: index.html + static JS/CSS assets (Vite build output)        │
│                                                                       │
│  React components: Hero · Pollutants · Forecast · Health · Planner    │
│                    Insights · Action Plan · Chat · Eco-Game           │
│                                                                       │
│  src/lib/core.js: Open-Meteo fetch → derived data (US/EU sub-indices, │
│  CPCB AQI from trailing means, dominant pollutant, best hour,         │
│  cleanest/worst windows, day summaries, source heuristics, dose       │
│  model) · rule-based chat engine · localStorage gamification          │
└──────────────┬──────────────────────────────┬─────────────────────────┘
               │ fetch (HTTPS, no key)        │ fetch (HTTPS, no key)
               ▼                              ▼
   Open-Meteo Air Quality API      Open-Meteo Geocoding API
   (CAMS hourly PM2.5, PM10, CO,   (place name → coordinates,
    NO₂, SO₂, O₃, dust, US AQI,     used by search + chat)
    European AQI; past days +
    5-day forecast)
```

- **Build:** Vite + React 18 (JavaScript), styled with Tailwind CSS 3 and animated with Framer Motion 12, with Aceternity UI components (Aurora Background, Card Spotlight, Text Generate Effect) adapted in `src/components/aceternity/`. All npm dependencies are build-time dev tooling; `npm run build` emits a fully static bundle (JS ≈ 382 kB, ≈ 125 kB gzipped; CSS ≈ 26 kB) into `dist/`, which is committed under `docs/` in the repository.
- **No backend.** All computation — US/EU sub-index estimation, CPCB AQI calculation, dominant-pollutant detection, best-hour and window search, source heuristics, dose modelling, chat parsing — happens in the browser.
- **Hosting:** GitHub Pages serves the built site from the repository's `docs/` folder (main branch).
- **Privacy:** no accounts, no analytics; user input never leaves the browser except the public Open-Meteo API calls; gamification state stays in `localStorage`.

## 4. Features in Detail

**Live dashboard.** Preset chips for Delhi, Mumbai, Ahmedabad, Bengaluru, Kolkata, Chennai, Hyderabad, Pune, Lucknow and Patna; free-text search via geocoding; browser geolocation. The hero shows an animated AQI gauge that recolours itself to the live category, and presents **three scales together**: US AQI, European AQI, and the **CPCB AQI computed locally** from trailing 24-hour means (PM2.5, PM10, NO₂, SO₂) and 8-hour means (CO, O₃) using CPCB's breakpoint tables and max-sub-index rule, with Indian categories (Good → Severe). Pollutant bars are scaled to each pollutant's estimated US EPA sub-index so the driver of the AQI is visually obvious, with markers at WHO guideline levels. A trend strip compares today's peak US AQI against yesterday's. **Persona chips** — Parent, Asthma patient, Runner, Traffic police — set the profile and relevant guidance in one tap.

**Forecast.** Hourly US AQI for 72 hours rendered as an animated SVG chart with category background bands, plus four day-cards (max AQI, category, cleanest hour). Sliding two-hour window means over the day identify the **cleanest and worst two-hour windows**, surfaced as planning guidance.

**Personalised health guidance.** Profiles: General adult, Child, Elderly, Asthma/respiratory condition, Athlete/outdoor worker. Guidance thresholds tighten for sensitive profiles; the "best time outdoors" is computed by scanning the next 24 forecast hours with a preference for daytime; the guidance can be **read aloud** using the browser's speech synthesis. A **cigarette-equivalent** figure (24-hour mean PM2.5 ÷ 22 µg/m³, the Berkeley Earth rule of thumb) translates exposure into widely understood terms — ≈ 5.5 cigarettes/day for Delhi in the 26 Nov 2026 live test.

**Activity risk planner.** The user picks an activity (each with a breathing-rate factor), a start time and a duration; a transparent dose model (forecast PM2.5 concentration × breathing rate × duration, adjusted by profile vulnerability) produces a **0–100 risk score** and a verdict (Go / Go with care / Avoid / Skip). When the chosen slot is poor, the planner suggests shifting to the day's cleanest window and states the approximate exposure reduction.

**Source insights.** Rules include: PM10/PM2.5 ratio ≥ 1.8 → dust & construction; ratio ≤ 1.3 with high PM2.5 → combustion; modelled dust ≥ 80 µg/m³ → dust transport; NO₂ rush-hour average ≥ 1.4× late-night → traffic; SO₂ ≥ 40 µg/m³ → industry/coal; O₃ ≥ 120 µg/m³ → photochemical smog; CO ≥ 2000 µg/m³ → vehicle exhaust. Each insight is shown with its evidence values and labelled as a heuristic estimate.

**Conversational assistant.** Rule-based NLP: regex intent detection (current AQI, tomorrow, mask, exercise, best time, sources, health tips, compare) combined with city extraction (preset matching plus geocoded free text after "in/for/at"). All answers are computed from freshly fetched live data for the requested city.

**Action plan.** Six GRAP-style stages mapped to AQI categories, the active stage highlighted, and a category-specific citizen action list.

**Sharing & print.** A "Share today's air report" button composes the city, all three AQI values, category, dominant pollutant, cigarette equivalent and cleanest window into a message sent via the Web Share API, with a WhatsApp fallback; a dedicated print layout renders the same summary as a clean one-page document.

**Gamification.** Seven eco-actions worth 10–25 points; badges at 50/150/300 points and a 3-day streak badge; streak increments on the first eco-action of a new day and resets after a missed day; all state in `localStorage`.

## 5. Data Sources

| Source | Use | Cost / key |
|---|---|---|
| Open-Meteo Air Quality API (`air-quality-api.open-meteo.com`) | Hourly PM2.5, PM10, CO, NO₂, SO₂, O₃, dust, US AQI, European AQI (CAMS atmosphere data), past 2 days (CPCB trailing means, yesterday trend) + 5-day hourly forecast, location timezone | Free, no key |
| Open-Meteo Geocoding API (`geocoding-api.open-meteo.com`) | City search and chat city resolution (name → lat/lon, admin region, country) | Free, no key |

US AQI categories and colours follow the US EPA scale (0–50 Good … 301–500 Hazardous); CPCB categories follow India's National AQI scale (0–50 Good … 401–500 Severe).

## 6. Screenshots

_[Screenshots to be captured from the live React UI at https://karanchhunchha.github.io/vayu-air-quality-assistant/ : (1) live dashboard for Delhi showing the three AQI scales and animated gauge, (2) 72-hour forecast chart with cleanest/worst windows, (3) personalised health guidance with profile selection and cigarette equivalent, (4) activity risk planner with a scored plan, (5) chat assistant answering a comparison question, (6) eco-actions and badges.]_

## 7. Limitations & Honesty Notes

- The chat assistant is **rule-based NLP, not a hosted LLM** — chosen deliberately so the app stays free, key-less and private.
- Source insights are **heuristics** over modelled data, not measured source apportionment.
- AQI values are CAMS model data via Open-Meteo; ground-station readings (e.g. CPCB) can differ locally. The CPCB AQI shown is computed locally from those modelled concentrations using CPCB's published breakpoint method — it is an estimate on the official scale, not a station reading.
- Health guidance is general information, not medical advice. The cigarette equivalent is a widely used rule of thumb (Berkeley Earth), not a medical equivalence.
- Gas sub-indices (O₃, NO₂, SO₂, CO) use converted breakpoint approximations; PM2.5/PM10 use the official EPA tables.

## 8. Future Scope

- Optional LLM-powered assistant (bring-your-own-key) for free-form questions beyond the rule-based intents.
- CPCB/WAQI ground-station data blended with CAMS for station-level accuracy, and a map view of station hotspots.
- Push-style alerts (browser notifications) when AQI crosses a user's personal threshold.
- Ward/area-level ("hyperlocal") views for large metros and a planner dashboard with multi-city comparisons and exportable reports.
- Stubble-burning and fire-count overlays (e.g. NASA FIRMS) during the winter season, and Hindi/regional-language UI.

---

*Built for Hack2Skill PromptWars — Challenge 6: Urban Air Quality Assistant. Team Vayu (solo): Karan Chhunchha.*
