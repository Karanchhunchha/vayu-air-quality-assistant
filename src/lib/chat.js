/* =====================================================================
   Vayu — rule-based chat engine (pure logic, no DOM, no framework).
   Extracted from components/Chat.jsx so the intent detection, city
   parsing and reply building can be unit-tested in Node. The assistant
   is deliberately rule-based NLP over the live Open-Meteo data — not a
   hosted LLM (see README, "An honest note on the AI assistant").
   ===================================================================== */

import { PRESET_CITIES, categoryFor, categoryIndex, fmt, fmtTime, profileById } from "./core.js";

/** Quick-suggestion chips shown above the chat input. */
export const CHAT_CHIPS = [
  { label: "AQI in Mumbai", q: "What is the AQI in Mumbai?" },
  { label: "Should I wear a mask?", q: "Should I wear a mask today?" },
  { label: "Safe to exercise?", q: "Is it safe to exercise outdoors?" },
  { label: "Tomorrow's AQI", q: "What will the AQI be tomorrow?" },
  { label: "Best time to go out", q: "When is the best time to go out?" },
  { label: "When to open windows?", q: "When should I open windows?" },
  { label: "Compare Delhi vs Bengaluru", q: "Compare Delhi and Bengaluru" },
  { label: "Pollution sources", q: "What is causing the pollution?" },
];

/** The assistant's opening message. */
export const CHAT_GREETING =
  "Namaste! I'm Vayu, your air quality assistant. I answer from live Open-Meteo data — ask me about any city's AQI (US, EU or India's CPCB scale), tomorrow's forecast, masks, exercise, the best time to go out, or compare two cities.";

/**
 * Find every preset city mentioned in a piece of text (case-insensitive).
 * @param {string} text raw or lowercased user text
 * @returns {Array<object>} matching entries from PRESET_CITIES, in list order
 */
export function findPresetCitiesIn(text) {
  const lower = " " + text.toLowerCase() + " ";
  return PRESET_CITIES.filter((c) => lower.includes(c.name.toLowerCase()));
}

/**
 * Extract a free-text place name following "in / for / at" in a question,
 * e.g. "AQI in Surat tomorrow" → "Surat". Returns null when there is no
 * such phrase, or the capture is just an article ("the", "a", "an").
 * @param {string} text raw user text
 * @returns {string|null} the place query to geocode, or null
 */
export function extractCityQuery(text) {
  const m = text.match(
    /\b(?:in|for|at)\s+([a-zA-Z][a-zA-Z\s]{1,30}?)(?:\s+tomorrow|\s+today|\?|$)/i,
  );
  if (!m) return null;
  const q = m[1].trim();
  if (!q || /^(the|a|an)$/.test(q)) return null;
  return q;
}

/**
 * Classify a lowercased user message into a reply intent. The order of
 * the checks is significant and mirrors the assistant's behaviour:
 * comparisons first, then the specific advice topics, with "current"
 * (a plain AQI report) as the fallback.
 * @param {string} lower lowercased user text
 * @returns {"compare"|"mask"|"cigarette"|"ventilation"|"exercise"|"best-time"|"tomorrow"|"sources"|"tips"|"current"}
 */
export function intentFor(lower) {
  if (/compar|vs\.?|versus|better than|worse than/.test(lower)) return "compare";
  if (/mask/.test(lower)) return "mask";
  if (/cigarette|smok/.test(lower)) return "cigarette";
  if (/ventil|window|fresh air/.test(lower)) return "ventilation";
  if (/exercise|run|jog|gym|cycle|walk|play|outdoor|sport/.test(lower)) return "exercise";
  if (/best time|when.*(go out|outside|step out|safe)|safest/.test(lower)) return "best-time";
  if (/tomorrow/.test(lower)) return "tomorrow";
  if (/source|caus|why|reason|responsible/.test(lower)) return "sources";
  if (/tip|advice|protect|health|safe|precaution/.test(lower)) return "tips";
  return "current";
}

/**
 * Build the two-city comparison reply from two city summaries.
 * @param {object} a summary (from core.summarize) for the first city
 * @param {object} b summary for the second city
 * @returns {string} reply text
 */
export function compareReply(a, b) {
  const cleaner = a.aqi <= b.aqi ? a : b;
  return (
    `Live comparison:\n• ${a.city.name}: AQI ${fmt(a.aqi)} (${a.cat ? a.cat.name : "—"}), ` +
    `dominant pollutant ${a.dom ? a.dom.pollutant.plain : "—"}.\n` +
    `• ${b.city.name}: AQI ${fmt(b.aqi)} (${b.cat ? b.cat.name : "—"}), ` +
    `dominant pollutant ${b.dom ? b.dom.pollutant.plain : "—"}.\n` +
    `${cleaner.city.name} has cleaner air right now.`
  );
}

/**
 * Build the assistant's reply for a non-comparison intent from a city
 * summary. Pure: all data comes from the summary view-model produced by
 * core.summarize, plus the caller's profile and guidance panel state.
 * @param {string} intent intent from intentFor()
 * @param {object} s summary view-model (core.summarize)
 * @param {{profileId: string, guidance: object|null}} ctx profile + panel guidance
 * @returns {string} reply text
 */
export function replyFor(intent, s, { profileId, guidance }) {
  const where = s.city.name;
  const profLabel = profileById(profileId).label.toLowerCase();
  const cpcbBit =
    s.cpcb && s.cpcb.enough
      ? ` On India's CPCB scale it is ${s.cpcb.aqi} (${s.cpcb.cat.name}).`
      : "";
  const cigBit = s.cig
    ? ` Breathing today's air here is like smoking about ${s.cig.cigs.toFixed(1)} cigarettes a day (24-h PM2.5 ${fmt(s.cig.mean)} µg/m³, Berkeley Earth rule).`
    : "";

  switch (intent) {
    case "mask": {
      const ci = categoryIndex(s.aqi);
      const advice =
        ci <= 1
          ? "you generally don't need a mask"
          : ci === 2
            ? "sensitive people should wear an N95/KN95, and others should consider one for long outdoor exposure"
            : "wear a well-fitting N95/KN95 — cloth masks don't filter PM2.5 well";
      return `In ${where} the AQI is ${fmt(s.aqi)} (${s.cat ? s.cat.name : "—"}). For a ${profLabel}, ${advice}.`;
    }
    case "cigarette":
      return s.cig
        ? `In ${where}, the trailing 24-hour PM2.5 average is ${fmt(s.cig.mean)} µg/m³. By the Berkeley Earth rule (24 h at 22 µg/m³ ≈ 1 cigarette), breathing today's air is like smoking ≈ ${s.cig.cigs.toFixed(1)} cigarettes a day.`
        : `I don't have enough PM2.5 history for ${where} to estimate a cigarette equivalent right now.`;
    case "ventilation":
      return s.cleanWindow
        ? `For ${where}, open windows during today's cleanest window: ${fmtTime(s.cleanWindow.startTime, s.todayStr)} – ${fmtTime(s.cleanWindow.endTime, s.todayStr)}, when AQI averages about ${fmt(s.cleanWindow.avg)} (${categoryFor(s.cleanWindow.avg)?.name || "—"}). Avoid the worst window, ${fmtTime(s.worstWindow.startTime, s.todayStr)} – ${fmtTime(s.worstWindow.endTime, s.todayStr)} (avg ${fmt(s.worstWindow.avg)}).`
        : `Forecast data for ventilation windows is unavailable for ${where} right now.`;
    case "exercise": {
      const ci = categoryIndex(s.aqi);
      const advice =
        ci <= 1
          ? "Outdoor exercise is fine."
          : ci === 2
            ? "Light outdoor exercise is OK, but reduce prolonged or heavy exertion — or move it indoors if you are sensitive."
            : "It is better to exercise indoors today.";
      return `${where} AQI is ${fmt(s.aqi)} (${s.cat ? s.cat.name : "—"}). ${advice}${s.best ? ` The cleanest time to be outdoors in the next 24 hours is around ${fmtTime(s.best.time, s.todayStr)} (AQI about ${fmt(s.best.aqi)}).` : ""}`;
    }
    case "best-time":
      return s.best
        ? `For ${where}, the best time to go out in the next 24 hours is around ${fmtTime(s.best.time, s.todayStr)}, when AQI is expected to drop to about ${fmt(s.best.aqi)} (${categoryFor(s.best.aqi)?.name || "—"}). Right now it is ${fmt(s.aqi)}.`
        : `Forecast data is unavailable for ${where} right now.`;
    case "tomorrow":
      return s.tomorrowMax !== null && s.tomorrowMax !== undefined
        ? `Tomorrow in ${where}, the AQI is forecast to peak at about ${fmt(s.tomorrowMax)} (${categoryFor(s.tomorrowMax)?.name || "—"}). Right now it is ${fmt(s.aqi)}. Plan outdoor activities for the cleanest hours and check back in the morning.`
        : `I don't have tomorrow's forecast for ${where} right now.`;
    case "sources": {
      const lines = s.sources.map((x) => `• ${x.tag}: ${x.text}`).join("\n");
      return `Likely pollution sources in ${where} today (heuristic analysis of the live pollutant mix):\n${lines}`;
    }
    case "tips":
      return guidance
        ? `Health tips for ${where} (AQI ${fmt(s.aqi)}, ${s.cat ? s.cat.name : "—"}) for a ${profLabel}:\n• ${guidance.mask}\n• ${guidance.exercise}\n• ${guidance.vent}\nNote: the detailed tips use the guidance panel's current profile; the AQI figures are for ${where}.`
        : `Health tips for ${where}: ${s.cat ? s.cat.advice : "Live guidance is unavailable right now."}`;
    default:
      return `Right now in ${where}: US AQI ${fmt(s.aqi)} — ${s.cat ? s.cat.name : "—"}.${cpcbBit} Dominant pollutant: ${s.dom ? `${s.dom.pollutant.plain} (sub-index ${s.dom.si})` : "—"}. PM2.5 is ${fmt(s.values.pm2_5)} µg/m³ and PM10 is ${fmt(s.values.pm10)} µg/m³.${cigBit} ${s.cat ? s.cat.advice : ""}`;
  }
}
