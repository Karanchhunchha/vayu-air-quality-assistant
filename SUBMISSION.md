# PromptWars Challenge 6 — Submission Form Content

Event: Hack2Skill PromptWars (`pwvirtual1`) · Challenge 6: Urban Air Quality Assistant
Deadline: **Sunday 29 Nov 2026, 11:59 PM IST** · ⚠️ Only the FIRST submission is evaluated and it cannot be changed after submitting — verify every field before clicking Submit.

---

## (a) Project Description (for the "Project Description" field — 50–1000 words)

Vayu — Urban Air Quality Assistant is a real-time web application that helps city residents, planners and policymakers understand air pollution and act on it. Built with React, Vite, Tailwind CSS and Framer Motion, it runs entirely in the browser as a static site with no backend and no API keys, using only free, key-less open data from the Open-Meteo Air Quality API (CAMS) and Geocoding API.

The live dashboard covers ten preset Indian cities — Delhi, Mumbai, Ahmedabad, Bengaluru, Kolkata, Chennai, Hyderabad, Pune, Lucknow and Patna — with free-text search for any city in the world and a "use my location" option. Uniquely, Vayu shows three AQI scales side by side: the US AQI, the European AQI, and India's official CPCB AQI, computed locally in the browser from trailing 24-hour and 8-hour pollutant means using CPCB's breakpoint tables. The pollutant breakdown (PM2.5, PM10, NO2, SO2, O3, CO) is scaled to US EPA sub-indices with WHO guideline markers, a trend strip compares today's peak with yesterday's, and one-tap persona chips (parent, asthma patient, runner, traffic police) configure the guidance instantly.

Vayu makes the numbers personal. It translates the day's PM2.5 into a cigarette equivalent — about 5.5 cigarettes a day in Delhi in our live test — identifies the day's cleanest and worst two-hour windows, and offers an activity planner: choose an activity, start time and duration, and a transparent dose model returns a 0–100 risk score, a plain-language verdict, and a suggestion to shift to the cleanest window when that reduces exposure.

An animated hourly forecast covers the next 72 hours with per-day summary cards. Health guidance is personalised through five profiles — general adult, child, elderly, asthma or respiratory condition, and athlete or outdoor worker — changing mask, exercise and ventilation advice, computing the best hour to go outdoors, and offering read-aloud playback. A source-insights engine explains the likely pollution sources with transparent heuristics, and a GRAP-style staged action plan links the live category to city-level interventions and citizen actions.

The conversational assistant uses rule-based natural language processing — intent detection and city parsing over the same live data — to answer questions about current AQI, forecasts, mask and exercise safety, pollution sources, and comparisons between two cities. Users can share a daily air report in one tap (Web Share or WhatsApp) or print a one-page summary, and a gamified eco-action checklist with points, badges and a daily streak encourages sustained eco-friendly behaviour. In a live test on 26 November 2026, Vayu reported Delhi at US AQI 198 and CPCB AQI 302 (Very Poor) — a practical, citizen-friendly tool for public-health awareness and data-driven urban governance.

---

## (b) Suggested form values

| Form field | Value |
|---|---|
| **Team Name** | Team Vayu |
| **Team Lead Name** | Karan Chhunchha |
| **Team Lead Email** | karamchhunchha@gmail.com |
| **Select Challenge** | [Challenge 6] Urban Air Quality Assistant |
| **GitHub Link** | `https://github.com/Karanchhunchha/vayu-air-quality-assistant` |
| **Hosted URL** | `https://karanchhunchha.github.io/vayu-air-quality-assistant/` |
| **Loom Video Link** | _to be filled after recording the demo (see DEMO-SCRIPT.md)_ |
| **Project Description** | Paste section (a) above |
| **Upload File** | The project report PDF generated from `report.md` (PDF/DOC/DOCX, max 10 MB) |

### Pre-submit checklist
- [x] Repo `vayu-air-quality-assistant` is public and the Pages site loads (AQI number + chart visible) — verified 26 Nov 2026, Delhi AQI 198 with live forecast.
- [ ] GitHub Link and Hosted URL open correctly in a private/incognito window.
- [ ] Loom video is recorded, set to public/anyone-with-link, and the link plays.
- [ ] Report PDF is under 10 MB and opens correctly.
- [ ] Team Name / Lead Name / Lead Email exactly as in the table above.
- [ ] Description pasted from section (a) — do not edit it down on the form.
