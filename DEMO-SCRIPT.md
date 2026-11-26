# Loom Demo Script — Vayu, Urban Air Quality Assistant

**Length:** 2–3 minutes · **Before recording:** open the live GitHub Pages URL, set browser zoom to 100%, close other tabs, keep the mouse movements slow. The live AQI values on the day will differ from this script — narrate whatever the screen actually shows.

---

### Scene 1 — Opening (0:00–0:20)
**On screen:** The Vayu homepage, Delhi loaded.
**Say:** "Namaste, I am Karan Chhunchha from Team Vayu. This is Vayu, my Urban Air Quality Assistant for PromptWars Challenge 6. It is a fully client-side web app — no backend, no API keys — running on free Open-Meteo data, live on GitHub Pages. What you see is Delhi's air quality right now."

### Scene 2 — Live dashboard (0:20–0:45)
**On screen:** Point to the big AQI number, the category badge, the dominant pollutant, then the pollutant bars. Click the **Mumbai** chip, let it reload.
**Say:** "The dashboard shows the current US AQI with the standard colour categories, the dominant pollutant, and a breakdown of PM2.5, PM10, NO2, SO2, ozone and CO, scaled by their EPA sub-indices so you can see what is driving the AQI. There are ten preset Indian cities, a search for any city in the world, and a 'use my location' button."

### Scene 3 — Forecast (0:45–1:05)
**On screen:** Scroll to the forecast chart and the day cards.
**Say:** "Here is the hyperlocal forecast — hourly AQI for the next 72 hours, drawn on a hand-built canvas chart with the health-category bands, and day cards showing each day's expected peak and its cleanest hour."

### Scene 4 — Personalised health guidance (1:05–1:30)
**On screen:** Change the profile dropdown to **Asthma / respiratory condition**, show how the advice text changes; point to "Best time outdoors".
**Say:** "Health guidance is personalised. When I switch the profile to an asthma patient, the mask, exercise and ventilation advice becomes stricter — and Vayu computes the best hour to step outdoors in the next 24 hours from the forecast."

### Scene 5 — Source insights + action plan (1:30–1:55)
**On screen:** Scroll to Pollution Source Insights, then the City Action Plan with the highlighted active stage.
**Say:** "Vayu also explains the likely sources behind today's pollution — for example, the PM10-to-PM2.5 ratio points to dust and construction, and NO2 rush-hour peaks point to traffic. Next to it is a GRAP-style action plan: the stage matching today's AQI is highlighted, with interventions for the city and actions for citizens."

### Scene 6 — Chat assistant (1:55–2:30)
**On screen:** In the chat, click the chip **"Compare Delhi vs Bengaluru"**, wait for the answer; then type: `Should I wear a mask in Pune?` and send.
**Say:** "The conversational assistant is rule-based NLP over the same live data — I want to be transparent that it is not a hosted LLM, which keeps the app free and private. It understands cities and intents: current AQI, tomorrow's forecast, masks, exercise, best time to go out, pollution sources, and comparisons like this one."

### Scene 7 — Gamification + close (2:30–2:55)
**On screen:** Scroll to Eco-actions; tick **"Used public transport, cycled or walked"** and **"Planted or watered a tree / plant"**; show points and badges updating.
**Say:** "Finally, gamified awareness: eco-actions earn points, badges and a daily streak, saved on the device. Vayu turns air-quality data into decisions — for residents, and for the city. Thank you."

---

**Recording checklist**
- [ ] Use the live Hosted URL (not localhost) so the video proves deployment.
- [ ] Keep the whole video under 3 minutes; re-record any scene where live data fails to load.
- [ ] After uploading to Loom, set visibility to "Anyone with the link" and paste the link into the submission form (see SUBMISSION.md).
