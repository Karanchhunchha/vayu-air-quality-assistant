"use strict";
/* =====================================================================
   Vayu — Urban Air Quality Assistant
   Pure client-side app. Data: Open-Meteo Air Quality + Geocoding APIs
   (free, no key). The chat assistant is rule-based NLP (intent + city
   parsing) over the live fetched data — not a hosted LLM.
   ===================================================================== */

/* ---------------- Constants ---------------- */
const PRESET_CITIES = [
  { name: "Delhi",     admin1: "Delhi",          country: "India", lat: 28.6139, lon: 77.2090 },
  { name: "Mumbai",    admin1: "Maharashtra",    country: "India", lat: 19.0760, lon: 72.8777 },
  { name: "Ahmedabad", admin1: "Gujarat",        country: "India", lat: 23.0225, lon: 72.5714 },
  { name: "Bengaluru", admin1: "Karnataka",      country: "India", lat: 12.9716, lon: 77.5946 },
  { name: "Kolkata",   admin1: "West Bengal",    country: "India", lat: 22.5726, lon: 88.3639 },
  { name: "Chennai",   admin1: "Tamil Nadu",     country: "India", lat: 13.0827, lon: 80.2707 },
  { name: "Hyderabad", admin1: "Telangana",      country: "India", lat: 17.3850, lon: 78.4867 },
  { name: "Pune",      admin1: "Maharashtra",    country: "India", lat: 18.5204, lon: 73.8567 },
  { name: "Lucknow",   admin1: "Uttar Pradesh",  country: "India", lat: 26.8467, lon: 80.9462 },
  { name: "Patna",     admin1: "Bihar",          country: "India", lat: 25.5941, lon: 85.1376 }
];

const CATEGORIES = [
  { max: 50,  name: "Good",                            color: "#00e400", ink: "#0b3d00", advice: "Air quality is satisfactory and poses little or no risk. Enjoy outdoor activities as usual." },
  { max: 100, name: "Moderate",                        color: "#ffde33", ink: "#4d3d00", advice: "Air quality is acceptable. Unusually sensitive people should watch for symptoms such as coughing or shortness of breath." },
  { max: 150, name: "Unhealthy for Sensitive Groups",  color: "#ff7e00", ink: "#4d2600", advice: "Sensitive groups may feel health effects. Reduce prolonged or heavy outdoor exertion; take more breaks." },
  { max: 200, name: "Unhealthy",                       color: "#ff0000", ink: "#ffffff", advice: "Everyone may begin to feel health effects. Limit time outdoors, keep windows closed and wear a well-fitting mask outside." },
  { max: 300, name: "Very Unhealthy",                  color: "#8f3f97", ink: "#ffffff", advice: "Health alert — the risk of serious health effects is increased for everyone. Stay indoors where possible and run an air purifier if you have one." },
  { max: 500, name: "Hazardous",                       color: "#7e0023", ink: "#ffffff", advice: "Health warning of emergency conditions. Avoid all outdoor exertion, keep doors and windows sealed, and follow local authority advisories." }
];

const POLLUTANTS = [
  { key: "pm2_5",            name: "PM2.5", plain: "PM2.5" },
  { key: "pm10",             name: "PM10",  plain: "PM10" },
  { key: "nitrogen_dioxide", name: "NO₂",   plain: "NO2" },
  { key: "sulphur_dioxide",  name: "SO₂",   plain: "SO2" },
  { key: "ozone",            name: "O₃",    plain: "Ozone" },
  { key: "carbon_monoxide",  name: "CO",    plain: "CO" }
];

/* US EPA breakpoint tables [concLo, concHi, indexLo, indexHi].
   PM2.5 / PM10 are the official tables. Gas tables are converted
   approximations (µg/m³) used only to estimate each sub-index. */
const BREAKPOINTS = {
  pm2_5:            [[0,12.0,0,50],[12.1,35.4,51,100],[35.5,55.4,101,150],[55.5,150.4,151,200],[150.5,250.4,201,300],[250.5,500.4,301,500]],
  pm10:             [[0,54,0,50],[55,154,51,100],[155,254,101,150],[255,354,151,200],[355,424,201,300],[425,604,301,500]],
  ozone:            [[0,108,0,50],[109,140,51,100],[141,170,101,150],[171,210,151,200],[211,400,201,300],[401,1000,301,500]],
  nitrogen_dioxide: [[0,100,0,50],[101,200,51,100],[201,700,101,150],[701,1200,151,200],[1201,2300,201,300],[2301,3800,301,500]],
  sulphur_dioxide:  [[0,90,0,50],[91,200,51,100],[201,470,101,150],[471,800,151,200],[801,1600,201,300],[1601,2600,301,500]],
  carbon_monoxide:  [[0,5000,0,50],[5001,10800,51,100],[10801,14200,101,150],[14201,17600,151,200],[17601,34800,201,300],[34801,57700,301,500]]
};

const GRAP_STAGES = [
  { title: "Stage 0 — Routine vigilance", text: "Normal activity. The city continues routine mechanised sweeping, dust control at construction sites and continuous monitoring." },
  { title: "Stage I — Preventive action", text: "Mechanised road sweeping and water sprinkling on dusty stretches, strict checks on open burning, and enforcement of construction dust norms." },
  { title: "Stage II — Restrictive action", text: "Diesel generator sets banned (except emergencies), public transport frequency increased, parking fees raised to discourage private vehicles, and intensified traffic management at hotspots." },
  { title: "Stage III — Severe controls", text: "Construction and demolition work paused, stone crushers and hot-mix plants shut, entry of non-essential trucks restricted, and schools advised to curtail outdoor activities." },
  { title: "Stage IV — Emergency response", text: "Work-from-home advisories, possible odd–even vehicle rationing, schools closed, industrial units curtailed and a public health emergency posture adopted." },
  { title: "Stage IV+ — Emergency response (maximum)", text: "All Stage IV measures plus blanket closure of non-essential industry and construction, full vehicle rationing and hospital readiness for respiratory cases." }
];

const CITIZEN_ACTIONS = [
  ["Walk or cycle for short trips — the air is fine today.", "Keep a reusable mask handy for sudden dust or smoke.", "Open windows and let fresh air in."],
  ["Prefer public transport or carpooling over a solo car trip.", "Sensitive family members should plan outdoor play for the cleanest hours.", "Ventilate your home during the cleanest part of the day."],
  ["Sensitive groups: shorten outdoor exercise and take breaks.", "Wear a mask if you must spend long periods near traffic.", "Keep windows closed during peak traffic hours."],
  ["Wear an N95/KN95 mask outdoors — cloth masks are not enough.", "Move exercise indoors today.", "Keep windows closed; run an air purifier if available."],
  ["Avoid going out unless essential; check on elderly neighbours.", "Seal gaps around doors and windows.", "Postpone outdoor events and sports."],
  ["Stay indoors and follow official advisories.", "Avoid all outdoor exertion, including morning walks.", "Use a purifier on high; seek medical help for breathing difficulty."]
];

const ECO_ACTIONS = [
  { id: "transport", icon: "🚌", label: "Used public transport, cycled or walked", pts: 20 },
  { id: "carpool",   icon: "🚗", label: "Carpooled or combined trips into one", pts: 15 },
  { id: "noburn",    icon: "🚫", label: "Did not burn waste, leaves or crackers", pts: 15 },
  { id: "plant",     icon: "🌳", label: "Planted or watered a tree / plant", pts: 25 },
  { id: "energy",    icon: "💡", label: "Saved electricity (AC at 24°C+, lights off)", pts: 10 },
  { id: "spread",    icon: "📣", label: "Shared an AQI update with family or friends", pts: 10 },
  { id: "mask",      icon: "😷", label: "Wore a proper mask instead of skipping it", pts: 10 }
];

const BADGES = [
  { icon: "🌱", name: "Eco Starter",        need: 50,  type: "points" },
  { icon: "🛡️", name: "Green Guardian",     need: 150, type: "points" },
  { icon: "🏆", name: "Clean Air Champion", need: 300, type: "points" },
  { icon: "🔥", name: "3-Day Streak",       need: 3,   type: "streak" }
];

/* ---------------- State & helpers ---------------- */
const state = { city: PRESET_CITIES[0], data: null, curIdx: 0, profile: "general" };
const $ = (id) => document.getElementById(id);
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function categoryFor(aqi) {
  if (aqi === null || aqi === undefined || isNaN(aqi)) return null;
  for (const c of CATEGORIES) if (aqi <= c.max) return c;
  return CATEGORIES[CATEGORIES.length - 1];
}
function categoryIndex(aqi) {
  const c = categoryFor(aqi);
  return c ? CATEGORIES.indexOf(c) : 0;
}
function subIndex(key, conc) {
  if (conc === null || conc === undefined || isNaN(conc)) return null;
  const table = BREAKPOINTS[key];
  if (!table) return null;
  for (const [clo, chi, ilo, ihi] of table) {
    if (conc <= chi) return Math.round(((ihi - ilo) / (chi - clo)) * (conc - clo) + ilo);
  }
  return 500;
}
function num(v) { return (v === null || v === undefined || isNaN(v)) ? null : v; }
function fmt(v, digits) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return Number(v).toFixed(digits === undefined ? 0 : digits);
}
function dayName(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}
function fmtTime(timeStr, refDateStr) {
  const [d, t] = timeStr.split("T");
  const hr = Number(t.slice(0, 2));
  const min = t.slice(3, 5);
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  let day = "Today";
  if (refDateStr) {
    if (d === addDays(refDateStr, 1)) day = "Tomorrow";
    else if (d !== refDateStr) day = dayName(d) + " " + Number(d.slice(8, 10)) + " " + MONTHS[Number(d.slice(5, 7)) - 1];
  }
  return day + ", " + h12 + ":" + min + " " + ampm;
}
function setStatus(msg, isError) {
  const s = $("statusLine");
  s.textContent = msg;
  s.classList.toggle("error", !!isError);
}

/* ---------------- Data fetching ---------------- */
async function fetchAQ(city) {
  const url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" + city.lat +
    "&longitude=" + city.lon +
    "&hourly=pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,us_aqi,european_aqi" +
    "&forecast_days=5&timezone=auto";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Air quality API returned " + res.status);
  return res.json();
}
async function geocode(query) {
  const res = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" +
    encodeURIComponent(query) + "&count=5&language=en&format=json");
  if (!res.ok) throw new Error("Geocoding API returned " + res.status);
  const j = await res.json();
  return j.results || [];
}
function currentIndex(data) {
  const local = new Date(Date.now() + (data.utc_offset_seconds || 0) * 1000);
  const key = local.toISOString().slice(0, 13); // "YYYY-MM-DDTHH" in the location's timezone
  const times = data.hourly.time;
  let idx = times.findIndex((t) => t.slice(0, 13) >= key);
  if (idx < 0) idx = times.length - 1;
  if (idx > 0 && times[idx].slice(0, 13) > key) idx -= 1;
  return idx;
}

/* ---------------- Derived data ---------------- */
function currentValues(data, idx) {
  const H = data.hourly;
  const o = {};
  for (const k of ["pm2_5","pm10","carbon_monoxide","nitrogen_dioxide","sulphur_dioxide","ozone","dust","us_aqi","european_aqi"]) {
    o[k] = num(H[k] ? H[k][idx] : null);
  }
  return o;
}
function dominantPollutant(data, idx) {
  const v = currentValues(data, idx);
  let best = null;
  for (const p of POLLUTANTS) {
    const si = subIndex(p.key, v[p.key]);
    if (si !== null && (best === null || si > best.si)) best = { pollutant: p, si };
  }
  return best;
}
function bestHourIn(data, idx, hoursAhead) {
  const H = data.hourly;
  let best = null;
  const end = Math.min(idx + (hoursAhead || 24), H.time.length);
  for (let i = idx; i < end; i++) {
    const v = num(H.us_aqi[i]);
    if (v === null) continue;
    const hr = Number(H.time[i].slice(11, 13));
    const score = v + (hr < 5 || hr > 21 ? 40 : 0); // prefer daytime hours
    if (!best || score < best.score) best = { time: H.time[i], aqi: v, score };
  }
  return best;
}
function daySummaries(data, idx) {
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
function sourceInsights(data, idx) {
  const H = data.hourly;
  const v = currentValues(data, idx);
  const out = [];
  const ratio = (v.pm10 !== null && v.pm2_5) ? v.pm10 / v.pm2_5 : null;
  if (ratio !== null && ratio >= 1.8) {
    out.push({ tag: "Dust & construction", text: "Coarse particles dominate — PM10 is " + ratio.toFixed(1) + "× PM2.5. That pattern usually points to road dust, construction activity and wind-blown soil rather than smoke." });
  } else if (ratio !== null && ratio <= 1.3 && v.pm2_5 !== null && v.pm2_5 >= 35) {
    out.push({ tag: "Combustion sources", text: "Fine particles (PM2.5) make up most of the particulate load. Fine particles typically come from burning — vehicle exhaust, diesel generators, biomass and waste burning." });
  }
  if (v.dust !== null && v.dust >= 80) {
    out.push({ tag: "Dust transport", text: "The modelled dust level is high (" + fmt(v.dust) + " µg/m³), suggesting dust is being carried in by winds from dry regions, on top of local sources." });
  }
  // Traffic signal: NO2 at rush hours vs late night, same day
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
      out.push({ tag: "Traffic", text: "NO₂ — a marker of vehicle exhaust — peaks at rush hours (about " + fmt(rAvg) + " µg/m³) versus late night (about " + fmt(nAvg) + " µg/m³). Traffic is a likely major contributor today." });
    }
  }
  if (v.sulphur_dioxide !== null && v.sulphur_dioxide >= 40) {
    out.push({ tag: "Industry & coal burning", text: "SO₂ is elevated (" + fmt(v.sulphur_dioxide) + " µg/m³). Sulphur dioxide typically comes from coal and heavy-oil burning in industry and power generation." });
  }
  if (v.ozone !== null && v.ozone >= 120) {
    out.push({ tag: "Photochemical smog (ozone)", text: "Ozone is high (" + fmt(v.ozone) + " µg/m³). Ground-level ozone is not emitted directly — it forms in sunlight from vehicle and industrial emissions, and usually peaks in the afternoon." });
  }
  if (v.carbon_monoxide !== null && v.carbon_monoxide >= 2000) {
    out.push({ tag: "Vehicle exhaust (CO)", text: "Carbon monoxide is elevated (" + fmt(v.carbon_monoxide) + " µg/m³), another signature of heavy traffic and incomplete fuel combustion." });
  }
  if (!out.length) {
    out.push({ tag: "Mixed urban sources", text: "No single source signal stands out in today's pollutant mix — levels look like a typical blend of traffic, household and urban background pollution." });
  }
  return out;
}
function summarize(data, idx, city) {
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
  return {
    city, aqi: v.us_aqi, values: v,
    cat: categoryFor(v.us_aqi),
    dom: dominantPollutant(data, idx),
    best: bestHourIn(data, idx, 24),
    tomorrowMax,
    sources: sourceInsights(data, idx),
    todayStr
  };
}

/* ---------------- Rendering ---------------- */
function renderHero() {
  const s = summarize(state.data, state.curIdx, state.city);
  const hero = $("aqiHero");
  hero.style.setProperty("--aqi-color", s.cat ? s.cat.color : "#999");
  hero.style.setProperty("--aqi-ink", s.cat ? s.cat.ink : "#17242e");
  $("cityName").textContent = state.city.name + (state.city.admin1 ? ", " + state.city.admin1 : "") + (state.city.country ? ", " + state.city.country : "");
  const t = state.data.hourly.time[state.curIdx];
  $("updatedAt").textContent = "Hour: " + fmtTime(t) + " · Timezone: " + (state.data.timezone || "local");
  $("aqiNumber").textContent = fmt(s.aqi);
  $("aqiCategory").textContent = s.cat ? s.cat.name : "No data";
  $("euAqi").textContent = "EU AQI " + fmt(s.values.european_aqi);
  $("dominantPollutant").textContent = s.dom ? s.dom.pollutant.name + " (sub-index " + s.dom.si + ")" : "—";
  $("heroAdvice").textContent = s.cat ? s.cat.advice : "Live data is unavailable for this location right now.";
}

function renderPollutants() {
  const v = currentValues(state.data, state.curIdx);
  const wrap = $("pollutantBars");
  wrap.innerHTML = "";
  for (const p of POLLUTANTS) {
    const si = subIndex(p.key, v[p.key]);
    const cat = categoryFor(si);
    const row = document.createElement("div");
    row.className = "pol-row";
    row.innerHTML = "<span class='pol-name'>" + p.name + "</span>" +
      "<span class='pol-track'><span class='pol-fill' style='width:" + (si === null ? 0 : Math.min(100, si / 5)) + "%;background:" + (cat ? cat.color : "#ccc") + "'></span></span>" +
      "<span class='pol-val'><strong>" + fmt(v[p.key]) + "</strong> µg/m³</span>";
    wrap.appendChild(row);
  }
}

function drawChart() {
  const canvas = $("forecastChart");
  if (!state.data || !canvas.clientWidth) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 220;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const H = state.data.hourly;
  const pts = [];
  for (let i = state.curIdx; i < Math.min(state.curIdx + 72, H.time.length); i++) {
    pts.push({ t: H.time[i], v: num(H.us_aqi[i]) });
  }
  const valid = pts.filter((p) => p.v !== null);
  if (!valid.length) return;
  const maxV = Math.max.apply(null, valid.map((p) => p.v).concat([120]));
  const yMax = Math.min(500, Math.ceil(maxV / 100) * 100);
  const padL = 34, padR = 10, padT = 10, padB = 24;
  const iw = w - padL - padR, ih = h - padT - padB;
  const X = (i) => padL + (i / (pts.length - 1)) * iw;
  const Y = (v) => padT + ih - (v / yMax) * ih;

  // category background bands
  const bands = [[0,50],[50,100],[100,150],[150,200],[200,300],[300,500]];
  for (const [lo, hi] of bands) {
    if (lo >= yMax) break;
    const cat = categoryFor(lo + 1);
    ctx.fillStyle = (cat ? cat.color : "#ccc") + "22";
    ctx.fillRect(padL, Y(Math.min(hi, yMax)), iw, Y(lo) - Y(Math.min(hi, yMax)));
  }
  // gridlines + y labels
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#5d7182";
  ctx.strokeStyle = "#dde6ec";
  for (let gv = 0; gv <= yMax; gv += 100) {
    ctx.beginPath(); ctx.moveTo(padL, Y(gv)); ctx.lineTo(padL + iw, Y(gv)); ctx.stroke();
    ctx.fillText(String(gv), 6, Y(gv) + 4);
  }
  // area + line
  ctx.beginPath();
  let started = false;
  pts.forEach((p, i) => {
    if (p.v === null) return;
    if (!started) { ctx.moveTo(X(i), Y(p.v)); started = true; } else ctx.lineTo(X(i), Y(p.v));
  });
  ctx.strokeStyle = "#0b7285"; ctx.lineWidth = 2; ctx.stroke();
  ctx.lineTo(X(pts.length - 1), Y(0)); ctx.lineTo(X(0), Y(0)); ctx.closePath();
  ctx.fillStyle = "rgba(11,114,133,0.10)"; ctx.fill();
  // dots every 3 hours, coloured by category
  pts.forEach((p, i) => {
    if (p.v === null || i % 3 !== 0) return;
    const cat = categoryFor(p.v);
    ctx.beginPath(); ctx.arc(X(i), Y(p.v), 3, 0, Math.PI * 2);
    ctx.fillStyle = cat ? cat.color : "#999"; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();
  });
  // x labels every 12 hours
  ctx.fillStyle = "#5d7182";
  pts.forEach((p, i) => {
    if (i % 12 !== 0) return;
    const d = p.t.slice(0, 10);
    const label = Number(d.slice(8, 10)) + " " + MONTHS[Number(d.slice(5, 7)) - 1] + " " + p.t.slice(11, 16);
    ctx.fillText(label, Math.min(X(i), w - 74), h - 6);
  });
}

function renderDayCards() {
  const wrap = $("dayCards");
  wrap.innerHTML = "";
  const todayStr = state.data.hourly.time[state.curIdx].slice(0, 10);
  daySummaries(state.data, state.curIdx).forEach((d, i) => {
    const cat = categoryFor(d.max);
    const card = document.createElement("div");
    card.className = "day-card";
    card.style.setProperty("--dc", cat ? cat.color : "#999");
    const label = d.date === todayStr ? "Today" : (d.date === addDays(todayStr, 1) ? "Tomorrow" : dayName(d.date));
    card.innerHTML = "<div class='d-name'>" + label + " · " + Number(d.date.slice(8, 10)) + " " + MONTHS[Number(d.date.slice(5, 7)) - 1] + "</div>" +
      "<div class='d-max'>Max " + fmt(d.max) + "</div>" +
      "<div class='d-cat' style='color:" + (cat ? cat.color : "#999") + "'>" + (cat ? cat.name : "—") + "</div>" +
      "<div class='muted small'>Cleanest hour AQI " + fmt(d.min) + "</div>";
    wrap.appendChild(card);
  });
}

function renderHealth() {
  const s = summarize(state.data, state.curIdx, state.city);
  const aqi = s.aqi === null ? 0 : s.aqi;
  const profile = state.profile;
  const sensitive = profile === "child" || profile === "elderly" || profile === "asthma";
  const strict = profile === "asthma";

  let mask;
  if (aqi <= 50) mask = "No mask needed. Air is clean — breathe easy.";
  else if (aqi <= 100) mask = sensitive ? "A mask is optional, but sensitive lungs may prefer an N95 near busy roads." : "No mask needed for most people. Consider one only if you are unusually sensitive to pollution.";
  else if (aqi <= 150) mask = sensitive ? "Wear a well-fitting N95/KN95 outdoors, especially near traffic." : "Consider an N95/KN95 if you will be outdoors for a long time or near traffic. Not mandatory for short trips.";
  else if (aqi <= 200) mask = "Wear a well-fitting N95/KN95 outdoors. Cloth and surgical masks give little protection against PM2.5.";
  else mask = "An N95/KN95 is essential if you must go out. Fit matters — no gaps around the nose. Better: stay indoors.";

  let exercise;
  if (aqi <= 50) exercise = "Perfect conditions — exercise outdoors freely, including long runs.";
  else if (aqi <= 100) exercise = profile === "athlete" ? "Fine for training. If you feel irritation, shift the hardest session to the cleanest hour below." : "Outdoor exercise is fine for most people. Sensitive individuals should watch for symptoms.";
  else if (aqi <= 150) exercise = strict ? "Move exercise indoors today — asthma symptoms can be triggered at this level." : "Reduce prolonged or heavy exertion outdoors. Short, light activity is OK; move intense workouts indoors.";
  else if (aqi <= 200) exercise = "Avoid outdoor exercise. Choose indoor workouts — gym, yoga or home routines.";
  else exercise = "No outdoor exercise. Stay active indoors instead.";

  let vent;
  if (aqi <= 100) vent = "Open windows freely — ventilate during the cleanest hour (see best time below) for the freshest air.";
  else if (aqi <= 150) vent = "Keep windows mostly closed during traffic peaks; open them briefly at the cleanest hour for fresh air.";
  else vent = "Keep windows and doors closed. Rely on an air purifier if you have one; avoid fresh-air intake modes on ACs.";

  $("maskAdvice").textContent = mask;
  $("exerciseAdvice").textContent = exercise;
  $("ventAdvice").textContent = vent;
  $("bestHourAdvice").textContent = s.best
    ? "The cleanest time to step out in the next 24 hours is around " + fmtTime(s.best.time, s.todayStr) + ", when AQI is expected to be about " + fmt(s.best.aqi) + " (" + (categoryFor(s.best.aqi) || {}).name + "). Plan walks and errands then."
    : "Forecast data is unavailable right now.";
}

function renderSources() {
  const list = $("sourceList");
  list.innerHTML = "";
  for (const s of sourceInsights(state.data, state.curIdx)) {
    const li = document.createElement("li");
    li.innerHTML = "<span class='source-tag'></span><br><span class='txt'></span>";
    li.querySelector(".source-tag").textContent = s.tag;
    li.querySelector(".txt").textContent = s.text;
    list.appendChild(li);
  }
}

function renderActionPlan() {
  const s = summarize(state.data, state.curIdx, state.city);
  const ci = categoryIndex(s.aqi);
  const wrap = $("actionPlan");
  wrap.innerHTML = "";
  GRAP_STAGES.forEach((stage, i) => {
    const div = document.createElement("div");
    div.className = "stage" + (i === stageIdxFor(ci) ? " current" : "");
    div.style.borderLeftColor = (CATEGORIES[Math.min(i + 1, 5)] || CATEGORIES[0]).color;
    div.innerHTML = (i === stageIdxFor(ci) ? "<span class='now-tag'>● Active now</span>" : "") +
      "<h4>" + stage.title + "</h4><p></p>";
    div.querySelector("p").textContent = stage.text;
    wrap.appendChild(div);
  });
  const ul = $("citizenActions");
  ul.innerHTML = "";
  for (const a of CITIZEN_ACTIONS[ci]) {
    const li = document.createElement("li");
    li.textContent = a;
    ul.appendChild(li);
  }
}
function stageIdxFor(catIdx) {
  // Map AQI category index (0..5) to GRAP stage index (0..5)
  return [0, 0, 1, 2, 3, 5][catIdx] !== undefined ? [0, 0, 1, 2, 3, 5][catIdx] : 0;
}

function renderAll() {
  renderHero();
  renderPollutants();
  drawChart();
  renderDayCards();
  renderHealth();
  renderSources();
  renderActionPlan();
}

/* ---------------- City loading ---------------- */
async function loadCity(city) {
  state.city = city;
  document.querySelectorAll("#presetChips button").forEach((b) => {
    b.classList.toggle("active", b.dataset.city === city.name);
  });
  setStatus("Loading live data for " + city.name + "…");
  try {
    state.data = await fetchAQ(city);
    state.curIdx = currentIndex(state.data);
    renderAll();
    const s = summarize(state.data, state.curIdx, state.city);
    setStatus("Live data loaded for " + city.name + " — current US AQI " + fmt(s.aqi) + " (" + (s.cat ? s.cat.name : "—") + "). Source: Open-Meteo (CAMS).");
  } catch (e) {
    setStatus("Could not load data for " + city.name + ". Check your internet connection and try again.", true);
  }
}

function buildChips() {
  const wrap = $("presetChips");
  for (const c of PRESET_CITIES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c.name;
    b.dataset.city = c.name;
    b.addEventListener("click", () => loadCity(c));
    wrap.appendChild(b);
  }
}

async function doSearch() {
  const q = $("citySearch").value.trim();
  const box = $("searchResults");
  box.innerHTML = "";
  box.hidden = true;
  if (!q) return;
  try {
    const results = await geocode(q);
    if (!results.length) { setStatus("No city found for \"" + q + "\". Try another spelling.", true); return; }
    box.hidden = false;
    for (const r of results) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = r.name + (r.admin1 ? ", " + r.admin1 : "") + (r.country ? ", " + r.country : "");
      b.addEventListener("click", () => {
        box.hidden = true;
        loadCity({ name: r.name, admin1: r.admin1 || "", country: r.country || "", lat: r.latitude, lon: r.longitude });
      });
      box.appendChild(b);
    }
  } catch (e) {
    setStatus("Search failed. Check your connection and try again.", true);
  }
}

/* ---------------- Chat assistant (rule-based) ---------------- */
function addMsg(text, who) {
  const log = $("chatLog");
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}
function findPresetCitiesIn(text) {
  const lower = " " + text.toLowerCase() + " ";
  return PRESET_CITIES.filter((c) => lower.includes(" " + c.name.toLowerCase()) || lower.includes(" " + c.name.toLowerCase() + " ") || lower.includes(c.name.toLowerCase()));
}
async function resolveChatCity(text) {
  const found = findPresetCitiesIn(text);
  if (found.length) return found[0];
  const m = text.match(/\b(?:in|for|at)\s+([a-zA-Z][a-zA-Z\s]{1,30}?)(?:\s+tomorrow|\s+today|\?|$)/i);
  if (m) {
    const q = m[1].trim();
    if (q && !/^(the|a|an)$/.test(q)) {
      try {
        const r = await geocode(q);
        if (r.length) return { name: r[0].name, admin1: r[0].admin1 || "", country: r[0].country || "", lat: r[0].latitude, lon: r[0].longitude };
      } catch (e) { /* fall through to current city */ }
    }
  }
  return state.city;
}
async function summaryFor(city) {
  if (state.data && city.name === state.city.name && city.lat === state.city.lat) {
    return summarize(state.data, state.curIdx, state.city);
  }
  const data = await fetchAQ(city);
  return summarize(data, currentIndex(data), city);
}
function profileName() {
  const sel = $("profileSelect");
  return sel.options[sel.selectedIndex].text;
}

async function answerChat(raw) {
  const text = raw.trim();
  const lower = text.toLowerCase();
  addMsg(text, "user");

  // Compare intent (needs two cities)
  if (/compar|vs\.?|versus|better than|worse than/.test(lower)) {
    const cities = findPresetCitiesIn(lower);
    if (cities.length >= 2) {
      try {
        const [a, b] = [await summaryFor(cities[0]), await summaryFor(cities[1])];
        const cleaner = a.aqi <= b.aqi ? a : b;
        addMsg("Live comparison:\n• " + a.city.name + ": AQI " + fmt(a.aqi) + " (" + (a.cat ? a.cat.name : "—") + "), dominant pollutant " + (a.dom ? a.dom.pollutant.plain : "—") + ".\n• " + b.city.name + ": AQI " + fmt(b.aqi) + " (" + (b.cat ? b.cat.name : "—") + "), dominant pollutant " + (b.dom ? b.dom.pollutant.plain : "—") + ".\n" + cleaner.city.name + " has cleaner air right now.", "bot");
      } catch (e) { addMsg("I couldn't fetch live data for that comparison. Please try again.", "bot"); }
      return;
    }
  }

  let city;
  try { city = await resolveChatCity(text); } catch (e) { city = state.city; }
  let s;
  try { s = await summaryFor(city); }
  catch (e) { addMsg("Sorry, I couldn't fetch live data for " + city.name + " right now. Check your connection and try again.", "bot"); return; }

  const where = s.city.name;
  if (/mask/.test(lower)) {
    const ci = categoryIndex(s.aqi);
    const advice = ci <= 1 ? "you generally don't need a mask" : ci === 2 ? "sensitive people should wear an N95/KN95, and others should consider one for long outdoor exposure" : "wear a well-fitting N95/KN95 — cloth masks don't filter PM2.5 well";
    addMsg("In " + where + " the AQI is " + fmt(s.aqi) + " (" + (s.cat ? s.cat.name : "—") + "). For a " + profileName().toLowerCase() + ", " + advice + ".", "bot");
  } else if (/exercise|run|jog|gym|cycle|walk|play|outdoor|sport/.test(lower)) {
    const ci = categoryIndex(s.aqi);
    const advice = ci <= 1 ? "Outdoor exercise is fine." : ci === 2 ? "Light outdoor exercise is OK, but reduce prolonged or heavy exertion — or move it indoors if you are sensitive." : "It is better to exercise indoors today.";
    addMsg(where + " AQI is " + fmt(s.aqi) + " (" + (s.cat ? s.cat.name : "—") + "). " + advice + (s.best ? " The cleanest time to be outdoors in the next 24 hours is around " + fmtTime(s.best.time, s.todayStr) + " (AQI about " + fmt(s.best.aqi) + ")." : ""), "bot");
  } else if (/best time|when.*(go out|outside|step out|safe)|safest/.test(lower)) {
    addMsg(s.best ? "For " + where + ", the best time to go out in the next 24 hours is around " + fmtTime(s.best.time, s.todayStr) + ", when AQI is expected to drop to about " + fmt(s.best.aqi) + " (" + (categoryFor(s.best.aqi) || {}).name + "). Right now it is " + fmt(s.aqi) + "." : "Forecast data is unavailable for " + where + " right now.", "bot");
  } else if (/tomorrow/.test(lower)) {
    addMsg(s.tomorrowMax !== null && s.tomorrowMax !== undefined
      ? "Tomorrow in " + where + ", the AQI is forecast to peak at about " + fmt(s.tomorrowMax) + " (" + (categoryFor(s.tomorrowMax) || {}).name + "). Right now it is " + fmt(s.aqi) + ". Plan outdoor activities for the cleanest hours and check back in the morning."
      : "I don't have tomorrow's forecast for " + where + " right now.", "bot");
  } else if (/source|caus|why|reason|responsible/.test(lower)) {
    const lines = s.sources.map((x) => "• " + x.tag + ": " + x.text).join("\n");
    addMsg("Likely pollution sources in " + where + " today (heuristic analysis of the live pollutant mix):\n" + lines, "bot");
  } else if (/tip|advice|protect|health|safe|precaution/.test(lower)) {
    addMsg("Health tips for " + where + " (AQI " + fmt(s.aqi) + ", " + (s.cat ? s.cat.name : "—") + ") for a " + profileName().toLowerCase() + ":\n• " + $("maskAdvice").textContent + "\n• " + $("exerciseAdvice").textContent + "\n• " + $("ventAdvice").textContent + "\nNote: these tips use the guidance panel's current profile and " + state.city.name + "'s data for the detailed panel; the AQI figures above are for " + where + ".", "bot");
  } else if (/aqi|air|pollution|quality|how is/.test(lower) || true) {
    addMsg("Right now in " + where + ": US AQI " + fmt(s.aqi) + " — " + (s.cat ? s.cat.name : "—") + ". Dominant pollutant: " + (s.dom ? s.dom.pollutant.plain + " (sub-index " + s.dom.si + ")" : "—") + ". PM2.5 is " + fmt(s.values.pm2_5) + " µg/m³ and PM10 is " + fmt(s.values.pm10) + " µg/m³. " + (s.cat ? s.cat.advice : ""), "bot");
  }
}

/* ---------------- Gamification ---------------- */
const LS = { points: "vayu_points", streak: "vayu_streak", lastDay: "vayu_last_day", done: "vayu_done" };
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ }
}
function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function gameState() {
  return {
    points: lsGet(LS.points, 0),
    streak: lsGet(LS.streak, 0),
    lastDay: lsGet(LS.lastDay, null),
    done: lsGet(LS.done, {}) // { "YYYY-MM-DD": [actionIds] }
  };
}
function renderGame() {
  const g = gameState();
  $("pointsNum").textContent = g.points;
  $("streakNum").textContent = g.streak;
  const badgeRow = $("badgeRow");
  badgeRow.innerHTML = "";
  for (const b of BADGES) {
    const earned = b.type === "points" ? g.points >= b.need : g.streak >= b.need;
    const span = document.createElement("span");
    span.className = "badge" + (earned ? " earned" : "");
    span.textContent = b.icon;
    span.title = b.name + (earned ? " — earned!" : " — " + (b.type === "points" ? b.need + " points" : b.need + "-day streak") + " needed");
    badgeRow.appendChild(span);
  }
  const today = todayKey();
  const doneToday = g.done[today] || [];
  const list = $("ecoList");
  list.innerHTML = "";
  for (const a of ECO_ACTIONS) {
    const label = document.createElement("label");
    label.className = "eco-item" + (doneToday.includes(a.id) ? " done" : "");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = doneToday.includes(a.id);
    cb.addEventListener("change", () => toggleEco(a, cb.checked));
    const txt = document.createElement("span");
    txt.textContent = a.icon + " " + a.label;
    const pts = document.createElement("span");
    pts.className = "pts";
    pts.textContent = "+" + a.pts;
    label.appendChild(cb); label.appendChild(txt); label.appendChild(pts);
    list.appendChild(label);
  }
}
function toggleEco(action, checked) {
  const g = gameState();
  const today = todayKey();
  const doneToday = g.done[today] || [];
  if (checked && !doneToday.includes(action.id)) {
    doneToday.push(action.id);
    g.points += action.pts;
    // streak handling on first action of the day
    if (g.lastDay !== today) {
      const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
      g.streak = g.lastDay === yesterday ? g.streak + 1 : 1;
      g.lastDay = today;
    }
  } else if (!checked && doneToday.includes(action.id)) {
    g.done[today] = doneToday.filter((id) => id !== action.id);
    g.points = Math.max(0, g.points - action.pts);
    lsSet(LS.points, g.points);
    lsSet(LS.done, g.done);
    renderGame();
    return;
  }
  g.done[today] = doneToday;
  lsSet(LS.points, g.points);
  lsSet(LS.streak, g.streak);
  lsSet(LS.lastDay, g.lastDay);
  lsSet(LS.done, g.done);
  renderGame();
}

/* ---------------- Init ---------------- */
function init() {
  buildChips();
  renderGame();
  $("searchBtn").addEventListener("click", doSearch);
  $("citySearch").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) $("searchResults").hidden = true;
  });
  $("locateBtn").addEventListener("click", () => {
    if (!navigator.geolocation) { setStatus("Geolocation is not supported by this browser.", true); return; }
    setStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => loadCity({ name: "Your location", admin1: pos.coords.latitude.toFixed(2) + ", " + pos.coords.longitude.toFixed(2), country: "", lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setStatus("Location access was denied. You can still search for your city above.", true),
      { timeout: 10000 }
    );
  });
  $("profileSelect").addEventListener("change", (e) => {
    state.profile = e.target.value;
    if (state.data) renderHealth();
  });
  $("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("chatInput").value.trim();
    if (!v) return;
    $("chatInput").value = "";
    answerChat(v);
  });
  document.querySelectorAll("#chatChips button").forEach((b) => {
    b.addEventListener("click", () => answerChat(b.dataset.q));
  });
  window.addEventListener("resize", () => { if (state.data) drawChart(); });
  addMsg("Namaste! I'm Vayu, your air quality assistant. I answer from live Open-Meteo data — ask me about any city's AQI, tomorrow's forecast, masks, exercise, the best time to go out, or compare two cities.", "bot");
  loadCity(PRESET_CITIES[0]);
}
document.addEventListener("DOMContentLoaded", init);
