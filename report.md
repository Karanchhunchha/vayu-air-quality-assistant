# Vayu — Urban Air Quality Assistant

**PromptWars Challenge 6 · Hack2Skill**
**Team Vayu** — Solo participant: **Karan Chhunchha** (karamchhunchha@gmail.com)

---

## Abstract

Air pollution is one of India's most serious public-health challenges, yet the data that could help citizens avoid exposure is scattered across technical dashboards that most people never open. Vayu — Urban Air Quality Assistant is a real-time, citizen-friendly web application that converts live open air-quality data into clear, actionable guidance. It presents the current US AQI with standard colour-coded health categories for ten preset Indian cities and any searchable city worldwide, forecasts hourly AQI for the next 72 hours, personalises health advice by user profile, explains the likely sources behind today's pollution using transparent heuristics, links the current AQI category to a GRAP-style city action plan, and answers natural-language questions through a rule-based conversational assistant. A gamified eco-action system with points, badges and streaks encourages sustained behaviour change. The entire application is three static files — no backend, no API keys, no build step — hosted free on GitHub Pages and powered by the free Open-Meteo Air Quality (CAMS) and Geocoding APIs.

## 1. Problem Statement

- Urban residents are exposed to harmful air pollution daily, but raw AQI numbers alone do not tell a parent whether a child should play outside, an asthma patient whether to carry a mask, or a runner when to train.
- Official data sources (CPCB, state boards) are fragmented, technical and rarely personalised; forecasts, health guidance and source explanations live in different places.
- Policymakers and citizens lack a single, simple view connecting *current conditions → what happens next → what should be done* — by individuals and by the city.
- Any solution meant for mass use in India must be free to run, work on ordinary phones and browsers, and require no sign-ups or paid services.

## 2. Solution Overview

Vayu addresses the problem with a single-page, fully client-side web application:

1. **Live AQI dashboard** — current US AQI (plus European AQI for comparison), colour-coded category, dominant pollutant and a six-pollutant breakdown for preset Indian cities, any searched city, or the user's own location.
2. **Hyperlocal forecast** — hourly AQI for the next 72 hours on a hand-drawn canvas chart, with per-day peak/cleanest-hour summary cards for four days.
3. **Personalised health guidance** — mask, exercise and ventilation advice that adapts to five user profiles, plus the computed best hour to go outdoors in the next 24 hours.
4. **Pollution source insights** — heuristic interpretation of the live pollutant mix (dust/construction, traffic, combustion, industry, photochemical smog, dust transport) in plain language.
5. **Conversational assistant** — rule-based NLP (intent + city parsing) answering questions from the same live data, including two-city comparisons.
6. **City action plan** — GRAP-style staged interventions keyed to the live AQI category, plus citizen actions.
7. **Gamified awareness** — eco-action checklist with points, badges and a daily streak persisted on-device.

## 3. Architecture

```
┌──────────────────────── Browser (static site) ────────────────────────┐
│  index.html ── styles.css ── app.js                                   │
│                                                                       │
│  UI sections: Dashboard · Forecast · Health · Sources · Action Plan   │
│               Chat Assistant · Eco-Game                               │
│                                                                       │
│  app.js modules: data fetch → derived-data (sub-indices, dominant     │
│  pollutant, best hour, day summaries, source heuristics) → renderers  │
│  · rule-based chat engine · localStorage gamification                 │
└──────────────┬──────────────────────────────┬─────────────────────────┘
               │ fetch (HTTPS, no key)        │ fetch (HTTPS, no key)
               ▼                              ▼
   Open-Meteo Air Quality API      Open-Meteo Geocoding API
   (CAMS hourly PM2.5, PM10, CO,   (place name → coordinates,
    NO₂, SO₂, O₃, dust, US AQI,     used by search + chat)
    European AQI; 5-day forecast)
```

- **No backend.** All computation — EPA sub-index estimation, dominant-pollutant detection, best-hour search, source heuristics, chat parsing — happens in the browser.
- **Hosting:** GitHub Pages serves the three files from the repository root; all paths are relative.
- **Privacy:** no accounts, no analytics; user input never leaves the browser except the public Open-Meteo API calls; gamification state stays in `localStorage`.

## 4. Features in Detail

**Live dashboard.** Preset chips for Delhi, Mumbai, Ahmedabad, Bengaluru, Kolkata, Chennai, Hyderabad, Pune, Lucknow and Patna; free-text search via geocoding; browser geolocation. The hero card recolours itself to the live AQI category. Pollutant bars are scaled to each pollutant's estimated US EPA sub-index so the driver of the AQI is visually obvious.

**Forecast.** Hourly US AQI for 72 hours rendered on a resolution-aware canvas with category background bands, plus four day-cards (max AQI, category, cleanest hour).

**Personalised health guidance.** Profiles: General adult, Child, Elderly, Asthma/respiratory condition, Athlete/outdoor worker. Guidance thresholds tighten for sensitive profiles; the "best time outdoors" is computed by scanning the next 24 forecast hours with a preference for daytime.

**Source insights.** Rules include: PM10/PM2.5 ratio ≥ 1.8 → dust & construction; ratio ≤ 1.3 with high PM2.5 → combustion; modelled dust ≥ 80 µg/m³ → dust transport; NO₂ rush-hour average ≥ 1.4× late-night → traffic; SO₂ ≥ 40 µg/m³ → industry/coal; O₃ ≥ 120 µg/m³ → photochemical smog; CO ≥ 2000 µg/m³ → vehicle exhaust. Each insight is shown with its evidence values and labelled as a heuristic estimate.

**Conversational assistant.** Rule-based NLP: regex intent detection (current AQI, tomorrow, mask, exercise, best time, sources, health tips, compare) combined with city extraction (preset matching plus geocoded free text after "in/for/at"). All answers are computed from freshly fetched live data for the requested city.

**Action plan.** Six GRAP-style stages mapped to AQI categories, the active stage highlighted, and a category-specific citizen action list.

**Gamification.** Seven eco-actions worth 10–25 points; badges at 50/150/300 points and a 3-day streak badge; streak increments on the first eco-action of a new day and resets after a missed day; all state in `localStorage`.

## 5. Data Sources

| Source | Use | Cost / key |
|---|---|---|
| Open-Meteo Air Quality API (`air-quality-api.open-meteo.com`) | Hourly PM2.5, PM10, CO, NO₂, SO₂, O₃, dust, US AQI, European AQI (CAMS atmosphere data), 5-day hourly forecast, location timezone | Free, no key |
| Open-Meteo Geocoding API (`geocoding-api.open-meteo.com`) | City search and chat city resolution (name → lat/lon, admin region, country) | Free, no key |

AQI categories and colours follow the US EPA scale (0–50 Good … 301–500 Hazardous).

## 6. Screenshots

_[Screenshots to be inserted after deployment: (1) live dashboard for Delhi, (2) 72-hour forecast chart, (3) personalised health guidance with profile selection, (4) chat assistant answering a comparison question, (5) eco-actions and badges.]_

## 7. Limitations & Honesty Notes

- The chat assistant is **rule-based NLP, not a hosted LLM** — chosen deliberately so the app stays free, key-less and private.
- Source insights are **heuristics** over modelled data, not measured source apportionment.
- AQI values are CAMS model data via Open-Meteo; ground-station readings (e.g. CPCB) can differ locally.
- Health guidance is general information, not medical advice.
- Gas sub-indices (O₃, NO₂, SO₂, CO) use converted breakpoint approximations; PM2.5/PM10 use the official EPA tables.

## 8. Future Scope

- Optional LLM-powered assistant (bring-your-own-key) for free-form questions beyond the rule-based intents.
- CPCB/WAQI ground-station data blended with CAMS for station-level accuracy, and a map view of station hotspots.
- Push-style alerts (browser notifications) when AQI crosses a user's personal threshold.
- Ward/area-level ("hyperlocal") views for large metros and a planner dashboard with multi-city comparisons and exportable reports.
- Stubble-burning and fire-count overlays (e.g. NASA FIRMS) during the winter season, and Hindi/regional-language UI.

---

*Built for Hack2Skill PromptWars — Challenge 6: Urban Air Quality Assistant. Team Vayu (solo): Karan Chhunchha.*
