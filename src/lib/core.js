/* =====================================================================
   Vayu — Urban Air Quality Assistant · core data library
   Pure ESM (no DOM, no framework) so it can be unit-tested in Node.
   Data: Open-Meteo Air Quality + Geocoding APIs (free, no key).
   The chat assistant built on top of this is rule-based NLP over the
   live data — not a hosted LLM.
   ===================================================================== */

/* ---------------- Constants ---------------- */
export const PRESET_CITIES = [
  { name: "Delhi", admin1: "Delhi", country: "India", lat: 28.6139, lon: 77.209 },
  { name: "Mumbai", admin1: "Maharashtra", country: "India", lat: 19.076, lon: 72.8777 },
  { name: "Ahmedabad", admin1: "Gujarat", country: "India", lat: 23.0225, lon: 72.5714 },
  { name: "Bengaluru", admin1: "Karnataka", country: "India", lat: 12.9716, lon: 77.5946 },
  { name: "Kolkata", admin1: "West Bengal", country: "India", lat: 22.5726, lon: 88.3639 },
  { name: "Chennai", admin1: "Tamil Nadu", country: "India", lat: 13.0827, lon: 80.2707 },
  { name: "Hyderabad", admin1: "Telangana", country: "India", lat: 17.385, lon: 78.4867 },
  { name: "Pune", admin1: "Maharashtra", country: "India", lat: 18.5204, lon: 73.8567 },
  { name: "Lucknow", admin1: "Uttar Pradesh", country: "India", lat: 26.8467, lon: 80.9462 },
  { name: "Patna", admin1: "Bihar", country: "India", lat: 25.5941, lon: 85.1376 },
];

/* US EPA AQI categories */
export const CATEGORIES = [
  {
    max: 50,
    name: "Good",
    color: "#00c853",
    text: "#008135",
    ink: "#0b3d00",
    advice:
      "Air quality is satisfactory and poses little or no risk. Enjoy outdoor activities as usual.",
  },
  {
    max: 100,
    name: "Moderate",
    color: "#f5c518",
    text: "#886b06",
    ink: "#4d3d00",
    advice:
      "Air quality is acceptable. Unusually sensitive people should watch for symptoms such as coughing or shortness of breath.",
  },
  {
    max: 150,
    name: "Unhealthy for Sensitive Groups",
    color: "#ff7e00",
    text: "#ad5600",
    ink: "#4d2600",
    advice:
      "Sensitive groups may feel health effects. Reduce prolonged or heavy outdoor exertion; take more breaks.",
  },
  {
    max: 200,
    name: "Unhealthy",
    color: "#ef3f36",
    text: "#db1b11",
    ink: "#ffffff",
    advice:
      "Everyone may begin to feel health effects. Limit time outdoors, keep windows closed and wear a well-fitting mask outside.",
  },
  {
    max: 300,
    name: "Very Unhealthy",
    color: "#8f3f97",
    text: "#8f3f97",
    ink: "#ffffff",
    advice:
      "Health alert — the risk of serious health effects is increased for everyone. Stay indoors where possible and run an air purifier if you have one.",
  },
  {
    max: 500,
    name: "Hazardous",
    color: "#7e0023",
    text: "#7e0023",
    ink: "#ffffff",
    advice:
      "Health warning of emergency conditions. Avoid all outdoor exertion, keep doors and windows sealed, and follow local authority advisories.",
  },
];

/* India CPCB National AQI categories */
export const CPCB_CATEGORIES = [
  { max: 50, name: "Good", color: "#00b050", text: "#00823b" },
  { max: 100, name: "Satisfactory", color: "#92d050", text: "#4f7a21" },
  { max: 200, name: "Moderate", color: "#e8c832", text: "#826d0f" },
  { max: 300, name: "Poor", color: "#ff7e00", text: "#ad5600" },
  { max: 400, name: "Very Poor", color: "#ef3f36", text: "#db1b11" },
  { max: 500, name: "Severe", color: "#99004c", text: "#99004c" },
];

/* who24 = WHO 2021 24-hour guideline value (µg/m³; O₃ is the 8-hour value) */
export const POLLUTANTS = [
  { key: "pm2_5", name: "PM2.5", plain: "PM2.5", who24: 15 },
  { key: "pm10", name: "PM10", plain: "PM10", who24: 45 },
  { key: "nitrogen_dioxide", name: "NO₂", plain: "NO2", who24: 25 },
  { key: "sulphur_dioxide", name: "SO₂", plain: "SO2", who24: 40 },
  { key: "ozone", name: "O₃", plain: "Ozone", who24: 100 },
  { key: "carbon_monoxide", name: "CO", plain: "CO", who24: 4000 },
];

/* US EPA breakpoint tables [concLo, concHi, indexLo, indexHi].
   PM2.5 / PM10 are the official tables. Gas tables are converted
   approximations (µg/m³) used only to estimate each sub-index. */
export const BREAKPOINTS = {
  pm2_5: [
    [0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ],
  pm10: [
    [0, 54, 0, 50],
    [55, 154, 51, 100],
    [155, 254, 101, 150],
    [255, 354, 151, 200],
    [355, 424, 201, 300],
    [425, 604, 301, 500],
  ],
  ozone: [
    [0, 108, 0, 50],
    [109, 140, 51, 100],
    [141, 170, 101, 150],
    [171, 210, 151, 200],
    [211, 400, 201, 300],
    [401, 1000, 301, 500],
  ],
  nitrogen_dioxide: [
    [0, 100, 0, 50],
    [101, 200, 51, 100],
    [201, 700, 101, 150],
    [701, 1200, 151, 200],
    [1201, 2300, 201, 300],
    [2301, 3800, 301, 500],
  ],
  sulphur_dioxide: [
    [0, 90, 0, 50],
    [91, 200, 51, 100],
    [201, 470, 101, 150],
    [471, 800, 151, 200],
    [801, 1600, 201, 300],
    [1601, 2600, 301, 500],
  ],
  carbon_monoxide: [
    [0, 5000, 0, 50],
    [5001, 10800, 51, 100],
    [10801, 14200, 101, 150],
    [14201, 17600, 151, 200],
    [17601, 34800, 201, 300],
    [34801, 57700, 301, 500],
  ],
};

/* CPCB (India) breakpoint tables. PM2.5/PM10/NO₂/SO₂ use 24-h means,
   O₃ and CO use 8-h means; CO is expressed in mg/m³ (µg/m³ ÷ 1000). */
export const CPCB_BREAKPOINTS = {
  pm2_5: [
    [0, 30, 0, 50],
    [31, 60, 51, 100],
    [61, 90, 101, 200],
    [91, 120, 201, 300],
    [121, 250, 301, 400],
    [251, 500, 401, 500],
  ],
  pm10: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 200, 101, 200],
    [201, 300, 201, 300],
    [301, 400, 301, 400],
    [401, 500, 401, 500],
  ],
  nitrogen_dioxide: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 180, 101, 200],
    [181, 280, 201, 300],
    [281, 400, 301, 400],
    [401, 800, 401, 500],
  ],
  sulphur_dioxide: [
    [0, 40, 0, 50],
    [41, 80, 51, 100],
    [81, 380, 101, 200],
    [381, 800, 201, 300],
    [801, 1600, 301, 400],
    [1601, 2500, 401, 500],
  ],
  ozone: [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 168, 101, 200],
    [169, 208, 201, 300],
    [209, 748, 301, 400],
    [749, 1000, 401, 500],
  ],
  carbon_monoxide: [
    [0, 1.0, 0, 50],
    [1.1, 2.0, 51, 100],
    [2.1, 10, 101, 200],
    [10.1, 17, 201, 300],
    [17.1, 34, 301, 400],
    [34.1, 50, 401, 500],
  ],
};

export const PROFILES = [
  { id: "general", label: "General adult", vuln: 1.0 },
  { id: "child", label: "Child (under 12)", vuln: 1.3 },
  { id: "elderly", label: "Elderly (65+)", vuln: 1.3 },
  { id: "asthma", label: "Asthma / respiratory condition", vuln: 1.6 },
  { id: "athlete", label: "Athlete / outdoor worker", vuln: 1.1 },
];
/** Look up a health profile by id; unknown ids fall back to the general-adult profile.
 * @param {string} id profile id (see PROFILES)
 * @returns {{id: string, label: string, vuln: number}} the matching profile */
export function profileById(id) {
  return PROFILES.find((p) => p.id === id) || PROFILES[0];
}

/* One-click judge personas: set a city + profile together */
export const PERSONAS = [
  {
    id: "parent",
    icon: "👨‍👧",
    label: "Parent",
    detail: "Delhi · Child profile",
    cityName: "Delhi",
    profile: "child",
  },
  {
    id: "asthma",
    icon: "🫁",
    label: "Asthma patient",
    detail: "Kolkata · Asthma profile",
    cityName: "Kolkata",
    profile: "asthma",
  },
  {
    id: "runner",
    icon: "🏃",
    label: "Runner",
    detail: "Bengaluru · Athlete profile",
    cityName: "Bengaluru",
    profile: "athlete",
  },
  {
    id: "police",
    icon: "🚦",
    label: "Traffic police",
    detail: "Mumbai · Outdoor worker",
    cityName: "Mumbai",
    profile: "athlete",
  },
];

/* Activity planner: breathing rates in m³/hour (inhaled volume) */
export const ACTIVITIES = [
  { id: "walk", label: "Morning / evening walk", rate: 1.1 },
  { id: "run", label: "Run / jog", rate: 2.6 },
  { id: "cycling", label: "Cycling", rate: 1.9 },
  { id: "schoolrun", label: "School run / errands", rate: 1.0 },
  { id: "kidsplay", label: "Kids playing outside", rate: 1.3 },
  { id: "outdoorwork", label: "Outdoor work", rate: 1.7 },
];
/** Look up a planner activity by id; unknown ids fall back to the first activity.
 * @param {string} id activity id (see ACTIVITIES)
 * @returns {{id: string, label: string, rate: number}} the matching activity */
export function activityById(id) {
  return ACTIVITIES.find((a) => a.id === id) || ACTIVITIES[0];
}

export const GRAP_STAGES = [
  {
    title: "Stage 0 — Routine vigilance",
    text: "Normal activity. The city continues routine mechanised sweeping, dust control at construction sites and continuous monitoring.",
  },
  {
    title: "Stage I — Preventive action",
    text: "Mechanised road sweeping and water sprinkling on dusty stretches, strict checks on open burning, and enforcement of construction dust norms.",
  },
  {
    title: "Stage II — Restrictive action",
    text: "Diesel generator sets banned (except emergencies), public transport frequency increased, parking fees raised to discourage private vehicles, and intensified traffic management at hotspots.",
  },
  {
    title: "Stage III — Severe controls",
    text: "Construction and demolition work paused, stone crushers and hot-mix plants shut, entry of non-essential trucks restricted, and schools advised to curtail outdoor activities.",
  },
  {
    title: "Stage IV — Emergency response",
    text: "Work-from-home advisories, possible odd–even vehicle rationing, schools closed, industrial units curtailed and a public health emergency posture adopted.",
  },
  {
    title: "Stage IV+ — Emergency response (maximum)",
    text: "All Stage IV measures plus blanket closure of non-essential industry and construction, full vehicle rationing and hospital readiness for respiratory cases.",
  },
];

export const CITIZEN_ACTIONS = [
  [
    "Walk or cycle for short trips — the air is fine today.",
    "Keep a reusable mask handy for sudden dust or smoke.",
    "Open windows and let fresh air in.",
  ],
  [
    "Prefer public transport or carpooling over a solo car trip.",
    "Sensitive family members should plan outdoor play for the cleanest hours.",
    "Ventilate your home during the cleanest part of the day.",
  ],
  [
    "Sensitive groups: shorten outdoor exercise and take breaks.",
    "Wear a mask if you must spend long periods near traffic.",
    "Keep windows closed during peak traffic hours.",
  ],
  [
    "Wear an N95/KN95 mask outdoors — cloth masks are not enough.",
    "Move exercise indoors today.",
    "Keep windows closed; run an air purifier if available.",
  ],
  [
    "Avoid going out unless essential; check on elderly neighbours.",
    "Seal gaps around doors and windows.",
    "Postpone outdoor events and sports.",
  ],
  [
    "Stay indoors and follow official advisories.",
    "Avoid all outdoor exertion, including morning walks.",
    "Use a purifier on high; seek medical help for breathing difficulty.",
  ],
];

export const ECO_ACTIONS = [
  { id: "transport", icon: "🚌", label: "Used public transport, cycled or walked", pts: 20 },
  { id: "carpool", icon: "🚗", label: "Carpooled or combined trips into one", pts: 15 },
  { id: "noburn", icon: "🚫", label: "Did not burn waste, leaves or crackers", pts: 15 },
  { id: "plant", icon: "🌳", label: "Planted or watered a tree / plant", pts: 25 },
  { id: "energy", icon: "💡", label: "Saved electricity (AC at 24°C+, lights off)", pts: 10 },
  { id: "spread", icon: "📣", label: "Shared an AQI update with family or friends", pts: 10 },
  { id: "mask", icon: "😷", label: "Wore a proper mask instead of skipping it", pts: 10 },
];

export const BADGES = [
  { icon: "🌱", name: "Eco Starter", need: 50, type: "points" },
  { icon: "🛡️", name: "Green Guardian", need: 150, type: "points" },
  { icon: "🏆", name: "Clean Air Champion", need: 300, type: "points" },
  { icon: "🔥", name: "3-Day Streak", need: 3, type: "streak" },
];

/* ---------------- Small helpers ---------------- */
export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Coerce a raw API value to a number, or null when missing / not numeric.
 * @param {*} v raw value
 * @returns {number|null} */
export function num(v) {
  return v === null || v === undefined || isNaN(v) ? null : v;
}
/** Format a number for display; missing values render as an em dash.
 * @param {number|null|undefined} v value to format
 * @param {number} [digits] decimal places (default 0)
 * @returns {string} */
export function fmt(v, digits) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return Number(v).toFixed(digits === undefined ? 0 : digits);
}
/** Full weekday name for an ISO date string ("YYYY-MM-DD"), computed in UTC.
 * @param {string} dateStr ISO date
 * @returns {string} e.g. "Wednesday" */
export function dayName(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
/** Add n days to an ISO date string ("YYYY-MM-DD"), in UTC.
 * @param {string} dateStr ISO date
 * @param {number} n days to add (may be negative)
 * @returns {string} ISO date */
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}
/** Human label for an hourly timestamp ("YYYY-MM-DDTHH:MM"): a relative day
 * ("Today" / "Tomorrow" / "Yesterday" / weekday + date) plus a 12-hour clock time.
 * @param {string} timeStr hourly timestamp from the API
 * @param {string} [refDateStr] reference ISO date the day label is relative to
 * @returns {string} e.g. "Tomorrow, 4:00 PM" */
export function fmtTime(timeStr, refDateStr) {
  const [d, t] = timeStr.split("T");
  const hr = Number(t.slice(0, 2));
  const min = t.slice(3, 5);
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  let day = "Today";
  if (refDateStr) {
    if (d === addDays(refDateStr, 1)) day = "Tomorrow";
    else if (d === addDays(refDateStr, -1)) day = "Yesterday";
    else if (d !== refDateStr)
      day = dayName(d) + " " + Number(d.slice(8, 10)) + " " + MONTHS[Number(d.slice(5, 7)) - 1];
  }
  return day + ", " + h12 + ":" + min + " " + ampm;
}
/** Compact hour label ("4 PM", "Tmrw 4 PM") for planner dropdowns.
 * @param {string} timeStr hourly timestamp from the API
 * @param {string} [refDateStr] reference ISO date
 * @returns {string} */
export function hourLabel(timeStr, refDateStr) {
  const [d, t] = timeStr.split("T");
  const hr = Number(t.slice(0, 2));
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  let day = "";
  if (refDateStr) {
    if (d === addDays(refDateStr, 1)) day = "Tmrw ";
    else if (d !== refDateStr) day = dayName(d).slice(0, 3) + " ";
  }
  return day + h12 + " " + ampm;
}

/* ---------------- AQI maths ---------------- */
/** US EPA category object for an AQI value, or null for missing input.
 * @param {number|null} aqi US AQI value
 * @returns {object|null} entry from CATEGORIES */
export function categoryFor(aqi) {
  if (aqi === null || aqi === undefined || isNaN(aqi)) return null;
  for (const c of CATEGORIES) if (aqi <= c.max) return c;
  return CATEGORIES[CATEGORIES.length - 1];
}
/** Index (0–5) of the US EPA category for an AQI value; 0 when unknown.
 * @param {number|null} aqi US AQI value
 * @returns {number} */
export function categoryIndex(aqi) {
  const c = categoryFor(aqi);
  return c ? CATEGORIES.indexOf(c) : 0;
}
/** India CPCB category object for an AQI value, or null for missing input.
 * @param {number|null} aqi CPCB AQI value
 * @returns {object|null} entry from CPCB_CATEGORIES */
export function cpcbCategoryFor(aqi) {
  if (aqi === null || aqi === undefined || isNaN(aqi)) return null;
  for (const c of CPCB_CATEGORIES) if (aqi <= c.max) return c;
  return CPCB_CATEGORIES[CPCB_CATEGORIES.length - 1];
}
/** Piecewise-linear AQI sub-index for a concentration against a breakpoint
 * table of [concLo, concHi, indexLo, indexHi] rows. Concentrations above the
 * last row cap at 500; missing input returns null.
 * @param {Array<Array<number>>} table breakpoint table
 * @param {number|null} conc concentration (units must match the table)
 * @returns {number|null} sub-index 0–500 */
export function subIndexWith(table, conc) {
  if (conc === null || conc === undefined || isNaN(conc) || !table) return null;
  for (const [clo, chi, ilo, ihi] of table) {
    if (conc <= chi) return Math.round(((ihi - ilo) / (chi - clo)) * (conc - clo) + ilo);
  }
  return 500;
}
/** US EPA sub-index for one pollutant (see BREAKPOINTS).
 * @param {string} key pollutant key, e.g. "pm2_5"
 * @param {number|null} conc concentration in µg/m³
 * @returns {number|null} sub-index 0–500 */
export function subIndex(key, conc) {
  return subIndexWith(BREAKPOINTS[key], conc);
}

/* ---------------- Data fetching ---------------- */
/** Fetch 7 days (2 past + 5 forecast) of hourly air-quality data for a city
 * from the Open-Meteo Air Quality API. Throws on a non-OK response.
 * @param {{lat: number, lon: number}} city city with coordinates
 * @returns {Promise<object>} parsed API payload (hourly series + utc_offset_seconds) */
export async function fetchAQ(city) {
  const url =
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" +
    city.lat +
    "&longitude=" +
    city.lon +
    "&hourly=pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,us_aqi,european_aqi" +
    "&forecast_days=5&past_days=2&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Air quality API returned " + res.status);
  return res.json();
}
/** Fetch just the current US AQI for a city (used by the header ticker).
 * @param {object} city city object (echoed back in the result)
 * @returns {Promise<{city: object, aqi: number|null, time: string}>} */
export async function fetchTickerAQI(city) {
  const url =
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" +
    city.lat +
    "&longitude=" +
    city.lon +
    "&hourly=us_aqi&forecast_days=1&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Air quality API returned " + res.status);
  const data = await res.json();
  const idx = currentIndex(data);
  return { city, aqi: num(data.hourly.us_aqi[idx]), time: data.hourly.time[idx] };
}
/** Search the Open-Meteo Geocoding API for places matching a query.
 * @param {string} query free-text place name
 * @returns {Promise<Array<object>>} up to 5 results (empty array when none) */
export async function geocode(query) {
  const res = await fetch(
    "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(query) +
      "&count=5&language=en&format=json",
  );
  if (!res.ok) throw new Error("Geocoding API returned " + res.status);
  const j = await res.json();
  return j.results || [];
}
/** Index of the hourly entry matching the location's current local hour.
 * The API timestamps are location-local; the location's UTC offset is applied
 * to Date.now() to find the matching "YYYY-MM-DDTHH" key.
 * @param {object} data air-quality API payload
 * @returns {number} index into data.hourly.time */
export function currentIndex(data) {
  const local = new Date(Date.now() + (data.utc_offset_seconds || 0) * 1000);
  const key = local.toISOString().slice(0, 13); // "YYYY-MM-DDTHH" in the location's timezone
  const times = data.hourly.time;
  let idx = times.findIndex((t) => t.slice(0, 13) >= key);
  if (idx < 0) idx = times.length - 1;
  if (idx > 0 && times[idx].slice(0, 13) > key) idx -= 1;
  return idx;
}

/* ---------------- Derived data ---------------- */
const VALUE_KEYS = [
  "pm2_5",
  "pm10",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone",
  "dust",
  "us_aqi",
  "european_aqi",
];
/** Snapshot of every pollutant / AQI value at one hourly index (null-safe).
 * @param {object} data air-quality API payload
 * @param {number} idx hourly index
 * @returns {Object<string, number|null>} values keyed by pollutant / AQI key */
export function currentValues(data, idx) {
  const H = data.hourly;
  const o = {};
  for (const k of VALUE_KEYS) o[k] = num(H[k] ? H[k][idx] : null);
  return o;
}
/** The pollutant with the highest US EPA sub-index at an hourly index —
 * i.e. the pollutant driving the AQI — or null when no data is available.
 * @param {object} data air-quality API payload
 * @param {number} idx hourly index
 * @returns {{pollutant: object, si: number}|null} */
export function dominantPollutant(data, idx) {
  const v = currentValues(data, idx);
  let best = null;
  for (const p of POLLUTANTS) {
    const si = subIndex(p.key, v[p.key]);
    if (si !== null && (best === null || si > best.si)) best = { pollutant: p, si };
  }
  return best;
}
/** Mean of the last `hours` hourly values ending at idx (inclusive).
 * Returns null unless at least `minCount` valid values exist.
 * @param {object} data air-quality API payload
 * @param {string} key hourly series key, e.g. "pm2_5"
 * @param {number} idx end (current) hourly index
 * @param {number} hours window length in hours
 * @param {number} [minCount] minimum valid values required (default 1)
 * @returns {number|null} */
export function trailingMean(data, key, idx, hours, minCount) {
  const arr = data.hourly[key];
  if (!arr) return null;
  let sum = 0,
    n = 0;
  for (let i = Math.max(0, idx - hours + 1); i <= idx; i++) {
    const v = num(arr[i]);
    if (v !== null) {
      sum += v;
      n++;
    }
  }
  if (n < (minCount || 1)) return null;
  return sum / n;
}
/** India CPCB NAQI, computed exactly as CPCB prescribes: 24-h means for
 * PM2.5/PM10/NO₂/SO₂, 8-h means for O₃/CO, overall = max sub-index.
 * Data-completeness rule: a 24-h mean needs ≥16 hourly values, an 8-h
 * mean ≥6; overall AQI needs ≥3 pollutants including PM2.5 or PM10.
 * @param {object} data air-quality API payload
 * @param {number} idx current hourly index
 * @returns {{aqi: number|null, cat: object|null, subs: Object<string, number|null>,
 *   means: Object<string, number|null>, enough: boolean}} `enough` is false
 *   (and aqi null) when the completeness rule is not met */
export function computeCPCB(data, idx) {
  const subs = {};
  const m24 = (key) => trailingMean(data, key, idx, 24, 16);
  const m8 = (key) => trailingMean(data, key, idx, 8, 6);
  const means = {
    pm2_5: m24("pm2_5"),
    pm10: m24("pm10"),
    nitrogen_dioxide: m24("nitrogen_dioxide"),
    sulphur_dioxide: m24("sulphur_dioxide"),
    ozone: m8("ozone"),
    carbon_monoxide: (() => {
      const v = m8("carbon_monoxide");
      return v === null ? null : v / 1000;
    })(),
  };
  let best = null,
    count = 0;
  for (const key of Object.keys(CPCB_BREAKPOINTS)) {
    const si = subIndexWith(CPCB_BREAKPOINTS[key], means[key]);
    subs[key] = si;
    if (si !== null) {
      count++;
      if (best === null || si > best) best = si;
    }
  }
  const hasPM = subs.pm2_5 !== null || subs.pm10 !== null;
  if (best === null || count < 3 || !hasPM) {
    return { aqi: null, cat: null, subs, means, enough: false };
  }
  return { aqi: best, cat: cpcbCategoryFor(best), subs, means, enough: true };
}
/** Berkeley Earth rule: breathing 24 h at 22 µg/m³ PM2.5 ≈ 1 cigarette.
 * Uses the trailing-24 h mean PM2.5 (the same window as the CPCB mean);
 * needs at least 12 valid hourly values, else null.
 * @param {object} data air-quality API payload
 * @param {number} idx current hourly index
 * @returns {{mean: number, cigs: number}|null} */
export function cigaretteEquivalent(data, idx) {
  const mean = trailingMean(data, "pm2_5", idx, 24, 12);
  if (mean === null) return null;
  return { mean, cigs: mean / 22 };
}
/** The lowest-AQI hour within the next `hoursAhead` hours. Night hours
 * (before 05:00 / after 21:00) carry a +40 penalty so the pick is a practical
 * time to be outdoors, not 3 a.m.
 * @param {object} data air-quality API payload
 * @param {number} idx start (current) hourly index
 * @param {number} [hoursAhead] lookahead window (default 24)
 * @returns {{time: string, aqi: number, score: number, idx: number}|null} */
export function bestHourIn(data, idx, hoursAhead) {
  const H = data.hourly;
  let best = null;
  const end = Math.min(idx + (hoursAhead || 24), H.time.length);
  for (let i = idx; i < end; i++) {
    const v = num(H.us_aqi[i]);
    if (v === null) continue;
    const hr = Number(H.time[i].slice(11, 13));
    const score = v + (hr < 5 || hr > 21 ? 40 : 0); // prefer daytime hours
    if (!best || score < best.score) best = { time: H.time[i], aqi: v, score, idx: i };
  }
  return best;
}
/** Sliding contiguous window of `winH` hours with the lowest / highest
 * mean US AQI across the next `hoursAhead` hours. A window only qualifies
 * when every hour in it has a valid AQI value.
 * @param {object} data air-quality API payload
 * @param {number} idx start (current) hourly index
 * @param {number} winH window length in hours
 * @param {number} [hoursAhead] lookahead window (default 24)
 * @param {string} [mode] "worst" for the highest-mean window; anything else = cleanest
 * @returns {{startIdx: number, endIdx: number, startTime: string, endTime: string, avg: number}|null} */
export function aqWindow(data, idx, winH, hoursAhead, mode) {
  const H = data.hourly;
  const end = Math.min(idx + (hoursAhead || 24), H.time.length);
  let best = null;
  for (let s = idx; s + winH <= end; s++) {
    let sum = 0,
      n = 0;
    for (let i = s; i < s + winH; i++) {
      const v = num(H.us_aqi[i]);
      if (v !== null) {
        sum += v;
        n++;
      }
    }
    if (n < winH) continue; // require a full window of data
    const avg = sum / n;
    if (!best || (mode === "worst" ? avg > best.avg : avg < best.avg)) {
      best = {
        startIdx: s,
        endIdx: s + winH - 1,
        startTime: H.time[s],
        endTime: H.time[s + winH - 1],
        avg,
      };
    }
  }
  return best;
}
/** Per-day { date, max, min } US AQI summaries from the current hour onward
 * (up to 4 days — today plus the forecast days).
 * @param {object} data air-quality API payload
 * @param {number} idx start (current) hourly index
 * @returns {Array<{date: string, max: number, min: number}>} */
export function daySummaries(data, idx) {
  const H = data.hourly;
  const map = new Map();
  for (let i = idx; i < H.time.length; i++) {
    const d = H.time[i].slice(0, 10);
    const v = num(H.us_aqi[i]);
    if (v === null) continue;
    if (!map.has(d)) map.set(d, { date: d, max: v, min: v });
    const e = map.get(d);
    e.max = Math.max(e.max, v);
    e.min = Math.min(e.min, v);
  }
  return Array.from(map.values()).slice(0, 4);
}
/** { date, max, min } US AQI summary for one calendar day, or null when the
 * day has no valid AQI values in the payload.
 * @param {object} data air-quality API payload
 * @param {string} dateStr ISO date ("YYYY-MM-DD")
 * @returns {{date: string, max: number, min: number}|null} */
export function daySummaryFor(data, dateStr) {
  const H = data.hourly;
  let out = null;
  for (let i = 0; i < H.time.length; i++) {
    if (H.time[i].slice(0, 10) !== dateStr) continue;
    const v = num(H.us_aqi[i]);
    if (v === null) continue;
    if (!out) out = { date: dateStr, max: v, min: v };
    out.max = Math.max(out.max, v);
    out.min = Math.min(out.min, v);
  }
  return out;
}
/** Heuristic pollution-source insights from the live pollutant mix
 * (PM10/PM2.5 ratio, modelled dust, NO₂ rush-hour pattern, SO₂, O₃, CO).
 * Always returns at least one entry (a "mixed sources" fallback).
 * These are informed estimates, NOT measured source apportionment.
 * @param {object} data air-quality API payload
 * @param {number} idx hourly index
 * @returns {Array<{tag: string, text: string}>} */
export function sourceInsights(data, idx) {
  const H = data.hourly;
  const v = currentValues(data, idx);
  const out = [];
  const ratio = v.pm10 !== null && v.pm2_5 ? v.pm10 / v.pm2_5 : null;
  if (ratio !== null && ratio >= 1.8) {
    out.push({
      tag: "Dust & construction",
      text:
        "Coarse particles dominate — PM10 is " +
        ratio.toFixed(1) +
        "× PM2.5. That pattern usually points to road dust, construction activity and wind-blown soil rather than smoke.",
    });
  } else if (ratio !== null && ratio <= 1.3 && v.pm2_5 !== null && v.pm2_5 >= 35) {
    out.push({
      tag: "Combustion sources",
      text: "Fine particles (PM2.5) make up most of the particulate load. Fine particles typically come from burning — vehicle exhaust, diesel generators, biomass and waste burning.",
    });
  }
  if (v.dust !== null && v.dust >= 80) {
    out.push({
      tag: "Dust transport",
      text:
        "The modelled dust level is high (" +
        fmt(v.dust) +
        " µg/m³), suggesting dust is being carried in by winds from dry regions, on top of local sources.",
    });
  }
  const dateStr = H.time[idx].slice(0, 10);
  const atHour = (h) => {
    const i = H.time.findIndex((t) => t.slice(0, 10) === dateStr && Number(t.slice(11, 13)) === h);
    return i >= 0 ? num(H.nitrogen_dioxide[i]) : null;
  };
  const rush = [8, 9, 18, 19].map(atHour).filter((x) => x !== null);
  const night = [2, 3, 4].map(atHour).filter((x) => x !== null);
  if (rush.length && night.length) {
    const rAvg = rush.reduce((a, b) => a + b, 0) / rush.length;
    const nAvg = night.reduce((a, b) => a + b, 0) / night.length;
    if (nAvg > 0 && rAvg >= 1.4 * nAvg) {
      out.push({
        tag: "Traffic",
        text:
          "NO₂ — a marker of vehicle exhaust — peaks at rush hours (about " +
          fmt(rAvg) +
          " µg/m³) versus late night (about " +
          fmt(nAvg) +
          " µg/m³). Traffic is a likely major contributor today.",
      });
    }
  }
  if (v.sulphur_dioxide !== null && v.sulphur_dioxide >= 40) {
    out.push({
      tag: "Industry & coal burning",
      text:
        "SO₂ is elevated (" +
        fmt(v.sulphur_dioxide) +
        " µg/m³). Sulphur dioxide typically comes from coal and heavy-oil burning in industry and power generation.",
    });
  }
  if (v.ozone !== null && v.ozone >= 120) {
    out.push({
      tag: "Photochemical smog (ozone)",
      text:
        "Ozone is high (" +
        fmt(v.ozone) +
        " µg/m³). Ground-level ozone is not emitted directly — it forms in sunlight from vehicle and industrial emissions, and usually peaks in the afternoon.",
    });
  }
  if (v.carbon_monoxide !== null && v.carbon_monoxide >= 2000) {
    out.push({
      tag: "Vehicle exhaust (CO)",
      text:
        "Carbon monoxide is elevated (" +
        fmt(v.carbon_monoxide) +
        " µg/m³), another signature of heavy traffic and incomplete fuel combustion.",
    });
  }
  if (!out.length) {
    out.push({
      tag: "Mixed urban sources",
      text: "No single source signal stands out in today's pollutant mix — levels look like a typical blend of traffic, household and urban background pollution.",
    });
  }
  return out;
}
/** Build the full view-model for one city at the current hour: current
 * values, US + CPCB categories, cigarette equivalent, dominant pollutant,
 * best hour, cleanest / worst 2-hour windows, tomorrow's peak, yesterday-vs-
 * today peaks and source insights. Everything the UI renders comes from here.
 * @param {object} data air-quality API payload
 * @param {number} idx current hourly index
 * @param {object} city city object
 * @returns {object} summary view-model */
export function summarize(data, idx, city) {
  const v = currentValues(data, idx);
  const todayStr = data.hourly.time[idx].slice(0, 10);
  const tomorrowStr = addDays(todayStr, 1);
  let tomorrowMax = null;
  data.hourly.time.forEach((t, i) => {
    if (t.slice(0, 10) === tomorrowStr) {
      const a = num(data.hourly.us_aqi[i]);
      if (a !== null && (tomorrowMax === null || a > tomorrowMax)) tomorrowMax = a;
    }
  });
  const yest = daySummaryFor(data, addDays(todayStr, -1));
  const today = daySummaryFor(data, todayStr);
  return {
    city,
    aqi: v.us_aqi,
    values: v,
    cat: categoryFor(v.us_aqi),
    cpcb: computeCPCB(data, idx),
    cig: cigaretteEquivalent(data, idx),
    dom: dominantPollutant(data, idx),
    best: bestHourIn(data, idx, 24),
    cleanWindow: aqWindow(data, idx, 2, 24, "clean"),
    worstWindow: aqWindow(data, idx, 2, 24, "worst"),
    tomorrowMax,
    yesterdayMax: yest ? yest.max : null,
    todayMax: today ? today.max : null,
    sources: sourceInsights(data, idx),
    todayStr,
    timeStr: data.hourly.time[idx],
    timezone: data.timezone || "local",
  };
}

/* ---------------- Health guidance (ported logic) ---------------- */
/** Mask / exercise / ventilation guidance for an AQI value and profile.
 * Sensitive profiles (child, elderly, asthma) get stricter mask advice;
 * asthma also gets stricter exercise advice.
 * @param {number|null} aqi US AQI value (null is treated as 0)
 * @param {string} profileId profile id (see PROFILES)
 * @returns {{mask: string, exercise: string, vent: string}} */
export function healthAdvice(aqi, profileId) {
  const a = aqi === null || aqi === undefined ? 0 : aqi;
  const sensitive = profileId === "child" || profileId === "elderly" || profileId === "asthma";
  const strict = profileId === "asthma";
  let mask;
  if (a <= 50) mask = "No mask needed. Air is clean — breathe easy.";
  else if (a <= 100)
    mask = sensitive
      ? "A mask is optional, but sensitive lungs may prefer an N95 near busy roads."
      : "No mask needed for most people. Consider one only if you are unusually sensitive to pollution.";
  else if (a <= 150)
    mask = sensitive
      ? "Wear a well-fitting N95/KN95 outdoors, especially near traffic."
      : "Consider an N95/KN95 if you will be outdoors for a long time or near traffic. Not mandatory for short trips.";
  else if (a <= 200)
    mask =
      "Wear a well-fitting N95/KN95 outdoors. Cloth and surgical masks give little protection against PM2.5.";
  else
    mask =
      "An N95/KN95 is essential if you must go out. Fit matters — no gaps around the nose. Better: stay indoors.";
  let exercise;
  if (a <= 50) exercise = "Perfect conditions — exercise outdoors freely, including long runs.";
  else if (a <= 100)
    exercise =
      profileId === "athlete"
        ? "Fine for training. If you feel irritation, shift the hardest session to the cleanest hour below."
        : "Outdoor exercise is fine for most people. Sensitive individuals should watch for symptoms.";
  else if (a <= 150)
    exercise = strict
      ? "Move exercise indoors today — asthma symptoms can be triggered at this level."
      : "Reduce prolonged or heavy exertion outdoors. Short, light activity is OK; move intense workouts indoors.";
  else if (a <= 200)
    exercise = "Avoid outdoor exercise. Choose indoor workouts — gym, yoga or home routines.";
  else exercise = "No outdoor exercise. Stay active indoors instead.";
  let vent;
  if (a <= 100)
    vent = "Open windows freely — ventilate during today's cleanest window for the freshest air.";
  else if (a <= 150)
    vent =
      "Keep windows mostly closed during traffic peaks; open them during today's cleanest window (below) for fresh air.";
  else
    vent =
      "Keep windows and doors closed. Rely on an air purifier if you have one; avoid fresh-air intake modes on ACs.";
  return { mask, exercise, vent };
}
/** Map a US category index (0–5) to a GRAP-style action-plan stage index.
 * @param {number} catIdx category index from categoryIndex()
 * @returns {number} stage index into GRAP_STAGES */
export function stageIdxFor(catIdx) {
  const map = [0, 0, 1, 2, 3, 5];
  return map[catIdx] !== undefined ? map[catIdx] : 0;
}

/** Activity risk planner — transparent dose model (formula shown in the UI):
 *   dose (µg inhaled PM2.5) = mean PM2.5 over the activity window
 *                             × breathing rate (m³/h) × duration (h)
 *   score = dose × profile vulnerability ÷ 3, capped at 0–100.
 * Also computes a cleaner alternative in the day's cleanest 2-hour window
 * when one exists.
 * @param {object} data air-quality API payload
 * @param {number} idx current hourly index
 * @param {{activityId: string, startIdx: number, durationH: number, profileId: string}} opts
 * @returns {{activity: object, profile: object, avgPM: number|null, dose: number|null,
 *   score: number|null, verdict: {label: string, color: string}, startTime: string,
 *   alt: object|null}} */
export function planActivity(data, idx, { activityId, startIdx, durationH, profileId }) {
  const act = activityById(activityId);
  const prof = profileById(profileId);
  const H = data.hourly;
  const hoursNeeded = Math.max(1, Math.round(durationH));
  const meanPM = (from) => {
    let sum = 0,
      n = 0;
    for (let i = from; i < Math.min(from + hoursNeeded, H.time.length); i++) {
      const v = num(H.pm2_5[i]);
      if (v !== null) {
        sum += v;
        n++;
      }
    }
    return n ? sum / n : null;
  };
  const scoreFor = (avgPM) => {
    if (avgPM === null) return null;
    const dose = avgPM * act.rate * durationH;
    return { dose, score: Math.max(0, Math.min(100, Math.round((dose * prof.vuln) / 3))) };
  };
  const verdictFor = (score) => {
    if (score === null) return { label: "No data", color: "#5e728d" };
    if (score <= 25) return { label: "Go", color: "#008135" };
    if (score <= 50) return { label: "Go with care", color: "#916500" };
    if (score <= 75) return { label: "Avoid", color: "#ad5600" };
    return { label: "Skip", color: "#d92323" };
  };
  const avgPM = meanPM(startIdx);
  const main = scoreFor(avgPM);
  let alt = null;
  const win = aqWindow(data, idx, 2, 24, "clean");
  if (win && avgPM) {
    const altPM = meanPM(win.startIdx);
    const altScore = scoreFor(altPM);
    if (altPM !== null && altScore) {
      alt = {
        startTime: win.startTime,
        endTime: win.endTime,
        avgPM: altPM,
        score: altScore.score,
        dose: altScore.dose,
        pctLess: Math.max(0, Math.round((1 - altPM / avgPM) * 100)),
      };
    }
  }
  return {
    activity: act,
    profile: prof,
    avgPM,
    dose: main ? main.dose : null,
    score: main ? main.score : null,
    verdict: verdictFor(main ? main.score : null),
    startTime: H.time[startIdx],
    alt,
  };
}
