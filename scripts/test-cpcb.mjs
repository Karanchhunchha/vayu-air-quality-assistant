/* Sanity test: CPCB (India) AQI vs US AQI for Delhi, live Open-Meteo data.
   Run: node scripts/test-cpcb.mjs */
import {
  fetchAQ,
  currentIndex,
  currentValues,
  computeCPCB,
  cigaretteEquivalent,
  PRESET_CITIES,
} from "../src/lib/core.js";

const delhi = PRESET_CITIES[0];
const data = await fetchAQ(delhi);
const idx = currentIndex(data);
const v = currentValues(data, idx);
const cpcb = computeCPCB(data, idx);
const cig = cigaretteEquivalent(data, idx);

console.log("Location hour (local):", data.hourly.time[idx], "· timezone:", data.timezone);
console.log("US AQI (Open-Meteo):  ", v.us_aqi);
console.log("EU AQI (Open-Meteo):  ", v.european_aqi);
console.log("Current PM2.5 / PM10: ", v.pm2_5, "/", v.pm10, "µg/m³");
console.log(
  "CPCB trailing means:  ",
  JSON.stringify(cpcb.means, (k, x) => (typeof x === "number" ? Math.round(x * 10) / 10 : x)),
);
console.log("CPCB sub-indices:     ", JSON.stringify(cpcb.subs));
console.log(
  "CPCB AQI (computed):  ",
  cpcb.aqi,
  cpcb.cat ? `(${cpcb.cat.name})` : "",
  "· enough data:",
  cpcb.enough,
);
console.log(
  "Cigarette equivalent: ",
  cig ? `${cig.cigs.toFixed(2)} /day (24-h PM2.5 mean ${cig.mean.toFixed(1)} µg/m³)` : "n/a",
);
if (cpcb.aqi === null) {
  console.error("FAIL: CPCB AQI is null");
  process.exit(1);
}
console.log("OK");
