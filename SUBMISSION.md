# PromptWars Challenge 6 — Submission Form Content

Event: Hack2Skill PromptWars (`pwvirtual1`) · Challenge 6: Urban Air Quality Assistant
Deadline: **Sunday 29 Nov 2026, 11:59 PM IST** · ⚠️ Only the FIRST submission is evaluated and it cannot be changed after submitting — verify every field before clicking Submit.

---

## (a) Project Description (for the "Project Description" field — 50–1000 words)

Vayu — Urban Air Quality Assistant is a real-time web application that helps city residents, planners and policymakers understand air pollution and act on it. Built as a dependency-free static web app, it runs entirely in the browser and uses only free, key-less open data from the Open-Meteo Air Quality API (CAMS) and Geocoding API.

The live dashboard shows the current US AQI for ten preset Indian cities — Delhi, Mumbai, Ahmedabad, Bengaluru, Kolkata, Chennai, Hyderabad, Pune, Lucknow and Patna — with free-text search for any city in the world and a "use my location" option. The AQI is presented with the standard colour-coded health categories, the dominant pollutant, the European AQI for comparison, and a pollutant breakdown (PM2.5, PM10, NO2, SO2, O3, CO) scaled to US EPA sub-indices.

For planning ahead, Vayu draws an hourly AQI forecast for the next 72 hours on a hand-built canvas chart, with per-day summary cards showing the expected peak and the cleanest hour. Health guidance is personalised through a profile selector — general adult, child, elderly, asthma or respiratory condition, and athlete or outdoor worker — which changes the mask, exercise and home-ventilation advice, and computes the best hour to step outdoors in the next 24 hours.

A source-insights engine analyses the live pollutant mix with transparent heuristics: the PM10-to-PM2.5 ratio distinguishes dust and construction from combustion, NO2 rush-hour patterns point to traffic, and elevated SO2, ozone, carbon monoxide and modelled dust flag industry, photochemical smog and dust transport. A GRAP-style staged action plan links the current AQI category to city-level interventions, from mechanised sweeping to odd-even vehicle rationing, alongside concrete actions citizens can take today.

The conversational assistant uses rule-based natural language processing — intent detection and city parsing over the same live data — to answer questions about current AQI, tomorrow's forecast, mask and exercise safety, the best time to go out, pollution sources, and comparisons between two cities. A gamified eco-action checklist with points, badges and a daily streak, saved on the device, encourages sustained eco-friendly behaviour.

Vayu needs no backend, no API keys and no build step: three static files hosted free on GitHub Pages — a practical, citizen-friendly tool for public-health awareness and data-driven urban governance.

---

## (b) Suggested form values

| Form field | Value |
|---|---|
| **Team Name** | Team Vayu |
| **Team Lead Name** | Karan Chhunchha |
| **Team Lead Email** | karamchhunchha@gmail.com |
| **Select Challenge** | [Challenge 6] Urban Air Quality Assistant |
| **GitHub Link** | _to be filled after the repo is created_ — expected: `https://github.com/Karanchhunchha/vayu-air-quality-assistant` |
| **Hosted URL** | _to be filled after GitHub Pages is enabled_ — expected: `https://karanchhunchha.github.io/vayu-air-quality-assistant/` |
| **Loom Video Link** | _to be filled after recording the demo (see DEMO-SCRIPT.md)_ |
| **Project Description** | Paste section (a) above |
| **Upload File** | The project report PDF generated from `report.md` (PDF/DOC/DOCX, max 10 MB) |

### Pre-submit checklist
- [ ] Repo `vayu-air-quality-assistant` is public and the Pages site loads (AQI number + chart visible).
- [ ] GitHub Link and Hosted URL open correctly in a private/incognito window.
- [ ] Loom video is recorded, set to public/anyone-with-link, and the link plays.
- [ ] Report PDF is under 10 MB and opens correctly.
- [ ] Team Name / Lead Name / Lead Email exactly as in the table above.
- [ ] Description pasted from section (a) — do not edit it down on the form.
