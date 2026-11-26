/* =====================================================================
   Unit tests for Vayu's core data library (src/lib/core.js).
   Every expected value below is derived from the published standards
   the code implements — US EPA breakpoint tables, CPCB (India)
   breakpoint tables and completeness rules, and the Berkeley Earth
   cigarette equivalence (22 µg/m³ PM2.5 for 24 h ≈ 1 cigarette) —
   and cross-checked against the functions' documented formulas.
   ===================================================================== */
import { describe, it, expect } from "vitest";
import {
  BREAKPOINTS, CPCB_BREAKPOINTS,
  num, fmt, dayName, addDays, fmtTime, hourLabel,
  categoryFor, categoryIndex, cpcbCategoryFor,
  subIndex, subIndexWith,
  trailingMean, computeCPCB, cigaretteEquivalent,
  bestHourIn, aqWindow, dominantPollutant,
  daySummaries, daySummaryFor, sourceInsights, summarize,
  healthAdvice, stageIdxFor, planActivity,
  profileById, activityById
} from "./core.js";

/* ---------- Synthetic Open-Meteo-shaped data ---------- */
const KEYS = ["pm2_5", "pm10", "carbon_monoxide", "nitrogen_dioxide",
  "sulphur_dioxide", "ozone", "dust", "us_aqi", "european_aqi"];

/* Builds `hours` of hourly data starting 2026-11-24T00:00 UTC.
   gen(i, timeStr) returns the pollutant values for that hour;
   any key it omits becomes null (a sensor gap). */
function makeData(hours, gen) {
  const hourly = { time: [] };
  for (const k of KEYS) hourly[k] = [];
  const start = Date.UTC(2026, 10, 24, 0);
  for (let i = 0; i < hours; i++) {
    const t = new Date(start + i * 3600e3).toISOString().slice(0, 16);
    hourly.time.push(t);
    const v = gen(i, t) || {};
    for (const k of KEYS) hourly[k].push(v[k] !== undefined ? v[k] : null);
  }
  return { hourly, utc_offset_seconds: 0, timezone: "UTC" };
}
const constant = (obj) => () => obj;

/* ---------- Small helpers ---------- */
describe("num / fmt", () => {
  it("num passes numbers through and nulls out missing values", () => {
    expect(num(5)).toBe(5);
    expect(num(0)).toBe(0);
    expect(num(null)).toBeNull();
    expect(num(undefined)).toBeNull();
    expect(num(NaN)).toBeNull();
  });
  it("fmt renders an em dash for missing values and honours digits", () => {
    expect(fmt(null)).toBe("—");
    expect(fmt(NaN)).toBe("—");
    expect(fmt(7)).toBe("7");
    expect(fmt(3.14159, 2)).toBe("3.14");
    expect(fmt(2.5, 0)).toBe("3"); // standard toFixed rounding
  });
});

describe("date / time helpers", () => {
  it("dayName resolves real weekdays", () => {
    expect(dayName("2026-11-26")).toBe("Thursday");
    expect(dayName("2026-11-29")).toBe("Sunday");
  });
  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-26", 0)).toBe("2026-11-26");
  });
  it("fmtTime labels Today / Tomorrow / Yesterday and formats 12-hour time", () => {
    expect(fmtTime("2026-11-26T14:05", "2026-11-26")).toBe("Today, 2:05 PM");
    expect(fmtTime("2026-11-27T05:00", "2026-11-26")).toBe("Tomorrow, 5:00 AM");
    expect(fmtTime("2026-11-25T23:00", "2026-11-26")).toBe("Yesterday, 11:00 PM");
    expect(fmtTime("2026-11-26T00:05", "2026-11-26")).toBe("Today, 12:05 AM");
    expect(fmtTime("2026-11-26T12:00", "2026-11-26")).toBe("Today, 12:00 PM");
    expect(fmtTime("2026-11-28T09:00", "2026-11-26")).toBe("Saturday 28 Nov, 9:00 AM");
  });
  it("hourLabel abbreviates other days", () => {
    expect(hourLabel("2026-11-26T14:00", "2026-11-26")).toBe("2 PM");
    expect(hourLabel("2026-11-27T05:00", "2026-11-26")).toBe("Tmrw 5 AM");
    expect(hourLabel("2026-11-28T17:00", "2026-11-26")).toBe("Sat 5 PM");
  });
});

/* ---------- US EPA sub-index maths ---------- */
describe("US EPA subIndex (piecewise-linear breakpoint interpolation)", () => {
  it("hits the exact band endpoints for PM2.5", () => {
    // EPA PM2.5 bands: 0–12.0→0–50, 12.1–35.4→51–100, 35.5–55.4→101–150,
    // 55.5–150.4→151–200, 150.5–250.4→201–300, 250.5–500.4→301–500
    const cases = [
      [0, 0], [12.0, 50], [12.1, 51], [35.4, 100], [35.5, 101],
      [55.4, 150], [55.5, 151], [150.4, 200], [150.5, 201],
      [250.4, 300], [250.5, 301], [500.4, 500]
    ];
    for (const [conc, expected] of cases) {
      expect(subIndex("pm2_5", conc), `PM2.5 ${conc}`).toBe(expected);
    }
  });
  it("interpolates linearly inside a band", () => {
    expect(subIndex("pm2_5", 6)).toBe(25);      // halfway through band 1
    expect(subIndex("pm2_5", 23.7)).toBe(75);   // inside band 2
    expect(subIndex("pm10", 200)).toBe(123);    // inside PM10 band 3 (155–254 → 101–150)
    expect(subIndex("ozone", 140)).toBe(100);   // top of ozone band 2
  });
  it("hits PM10 band boundaries", () => {
    expect(subIndex("pm10", 54)).toBe(50);
    expect(subIndex("pm10", 55)).toBe(51);
    expect(subIndex("pm10", 154)).toBe(100);
  });
  it("caps at 500 above the highest breakpoint", () => {
    expect(subIndex("pm2_5", 600)).toBe(500);
    expect(subIndex("pm2_5", 5000)).toBe(500);
  });
  it("returns null for missing concentrations or unknown pollutants", () => {
    expect(subIndex("pm2_5", null)).toBeNull();
    expect(subIndex("pm2_5", NaN)).toBeNull();
    expect(subIndex("not_a_pollutant", 10)).toBeNull();
    expect(subIndexWith(null, 10)).toBeNull();
  });
  it("uses the table it is given (CPCB table through the same engine)", () => {
    expect(subIndexWith(BREAKPOINTS.pm2_5, 12)).toBe(50);
    expect(subIndexWith(CPCB_BREAKPOINTS.pm2_5, 12)).toBe(20); // CPCB band 1 is 0–30 → 0–50
  });
});

/* ---------- CPCB sub-index maths ---------- */
describe("CPCB subIndexWith (India breakpoint tables)", () => {
  it("hits the exact PM2.5 band endpoints, including the 101–200 jump band", () => {
    // CPCB PM2.5: 0–30→0–50, 31–60→51–100, 61–90→101–200,
    // 91–120→201–300, 121–250→301–400, 251–500→401–500
    const cases = [
      [0, 0], [30, 50], [31, 51], [60, 100], [61, 101], [90, 200],
      [91, 201], [120, 300], [121, 301], [250, 400], [251, 401], [500, 500]
    ];
    for (const [conc, expected] of cases) {
      expect(subIndexWith(CPCB_BREAKPOINTS.pm2_5, conc), `CPCB PM2.5 ${conc}`).toBe(expected);
    }
  });
  it("interpolates inside CPCB bands", () => {
    expect(subIndexWith(CPCB_BREAKPOINTS.pm2_5, 15)).toBe(25);
    expect(subIndexWith(CPCB_BREAKPOINTS.pm2_5, 45)).toBe(75);
    expect(subIndexWith(CPCB_BREAKPOINTS.pm2_5, 75)).toBe(149);
  });
  it("hits PM10, NO2 and CO (mg/m³) band endpoints", () => {
    expect(subIndexWith(CPCB_BREAKPOINTS.pm10, 50)).toBe(50);
    expect(subIndexWith(CPCB_BREAKPOINTS.pm10, 51)).toBe(51);
    expect(subIndexWith(CPCB_BREAKPOINTS.pm10, 200)).toBe(200);
    expect(subIndexWith(CPCB_BREAKPOINTS.nitrogen_dioxide, 40)).toBe(50);
    expect(subIndexWith(CPCB_BREAKPOINTS.nitrogen_dioxide, 80)).toBe(100);
    expect(subIndexWith(CPCB_BREAKPOINTS.nitrogen_dioxide, 180)).toBe(200);
    // CPCB expresses CO in mg/m³: 1.0 is the top of band 1, 10 the top of band 3
    expect(subIndexWith(CPCB_BREAKPOINTS.carbon_monoxide, 1.0)).toBe(50);
    expect(subIndexWith(CPCB_BREAKPOINTS.carbon_monoxide, 1.1)).toBe(51);
    expect(subIndexWith(CPCB_BREAKPOINTS.carbon_monoxide, 2.0)).toBe(100);
    expect(subIndexWith(CPCB_BREAKPOINTS.carbon_monoxide, 10)).toBe(200);
  });
  it("caps at 500 beyond the table", () => {
    expect(subIndexWith(CPCB_BREAKPOINTS.pm2_5, 700)).toBe(500);
  });
});

/* ---------- Category mapping ---------- */
describe("categoryFor (US EPA categories)", () => {
  it("maps every band boundary to the right category", () => {
    const cases = [
      [0, "Good"], [50, "Good"], [51, "Moderate"], [100, "Moderate"],
      [101, "Unhealthy for Sensitive Groups"], [150, "Unhealthy for Sensitive Groups"],
      [151, "Unhealthy"], [200, "Unhealthy"], [201, "Very Unhealthy"],
      [300, "Very Unhealthy"], [301, "Hazardous"], [500, "Hazardous"]
    ];
    for (const [aqi, name] of cases) expect(categoryFor(aqi)?.name, `AQI ${aqi}`).toBe(name);
  });
  it("clamps values above 500 to Hazardous and rejects missing values", () => {
    expect(categoryFor(750)?.name).toBe("Hazardous");
    expect(categoryFor(null)).toBeNull();
    expect(categoryFor(NaN)).toBeNull();
  });
  it("categoryIndex tracks the band position", () => {
    expect(categoryIndex(50)).toBe(0);
    expect(categoryIndex(51)).toBe(1);
    expect(categoryIndex(301)).toBe(5);
  });
});

describe("cpcbCategoryFor (India categories)", () => {
  it("maps every band boundary to the right category", () => {
    const cases = [
      [50, "Good"], [51, "Satisfactory"], [100, "Satisfactory"],
      [101, "Moderate"], [200, "Moderate"], [201, "Poor"], [300, "Poor"],
      [301, "Very Poor"], [400, "Very Poor"], [401, "Severe"], [500, "Severe"]
    ];
    for (const [aqi, name] of cases) expect(cpcbCategoryFor(aqi)?.name, `CPCB AQI ${aqi}`).toBe(name);
    expect(cpcbCategoryFor(null)).toBeNull();
  });
});

/* ---------- Trailing means ---------- */
describe("trailingMean", () => {
  const ramp = { hourly: { pm2_5: Array.from({ length: 24 }, (_, i) => i + 1) } };
  it("averages the full window ending at idx", () => {
    expect(trailingMean(ramp, "pm2_5", 23, 24, 16)).toBe(12.5); // mean of 1..24
  });
  it("clamps the window at the start of the series", () => {
    expect(trailingMean(ramp, "pm2_5", 5, 24, 1)).toBe(3.5); // mean of 1..6
  });
  it("skips null readings but enforces the minimum count", () => {
    const gappy = { hourly: { pm2_5: [10, null, 20, null, 30] } };
    expect(trailingMean(gappy, "pm2_5", 4, 5, 3)).toBe(20);
    expect(trailingMean(gappy, "pm2_5", 4, 5, 4)).toBeNull();
  });
  it("returns null for a missing series", () => {
    expect(trailingMean({ hourly: {} }, "pm2_5", 0, 24, 1)).toBeNull();
  });
});

/* ---------- CPCB AQI end-to-end ---------- */
describe("computeCPCB", () => {
  it("takes the maximum sub-index across pollutants", () => {
    const data = makeData(24, constant({
      pm2_5: 60, pm10: 100, nitrogen_dioxide: 40,
      sulphur_dioxide: 40, ozone: 50, carbon_monoxide: 1000
    }));
    const r = computeCPCB(data, 23);
    expect(r.enough).toBe(true);
    expect(r.subs).toEqual({
      pm2_5: 100, pm10: 100, nitrogen_dioxide: 50,
      sulphur_dioxide: 50, ozone: 50, carbon_monoxide: 50
    });
    expect(r.aqi).toBe(100);
    expect(r.cat?.name).toBe("Satisfactory");
  });
  it("lets a single dominant pollutant drive the result", () => {
    const data = makeData(24, constant({
      pm2_5: 90, pm10: 40, nitrogen_dioxide: 32,
      sulphur_dioxide: 20, ozone: 40, carbon_monoxide: 500
    }));
    const r = computeCPCB(data, 23);
    expect(r.subs.pm2_5).toBe(200); // 90 µg/m³ is the top of CPCB band 3
    expect(r.aqi).toBe(200);
    expect(r.cat?.name).toBe("Moderate");
  });
  it("flips category exactly at a breakpoint boundary (30 vs 31 µg/m³ PM2.5)", () => {
    const base = { pm10: 50, nitrogen_dioxide: 40, sulphur_dioxide: 40, ozone: 50, carbon_monoxide: 1000 };
    const at = computeCPCB(makeData(24, constant({ ...base, pm2_5: 30 })), 23);
    const over = computeCPCB(makeData(24, constant({ ...base, pm2_5: 31 })), 23);
    expect(at.aqi).toBe(50);
    expect(at.cat?.name).toBe("Good");
    expect(over.aqi).toBe(51);
    expect(over.cat?.name).toBe("Satisfactory");
  });
  it("converts CO from µg/m³ to mg/m³ before applying the CPCB table", () => {
    const data = makeData(24, constant({
      pm2_5: 30, pm10: 50, nitrogen_dioxide: 40,
      sulphur_dioxide: 40, ozone: 50, carbon_monoxide: 34000 // = 34 mg/m³
    }));
    const r = computeCPCB(data, 23);
    expect(r.means.carbon_monoxide).toBe(34);
    expect(r.subs.carbon_monoxide).toBe(400); // top of CPCB CO band 5
    expect(r.aqi).toBe(400);
    expect(r.cat?.name).toBe("Very Poor");
  });
  it("refuses an AQI when the 24-h completeness rule is not met (only 10 h of data)", () => {
    const data = makeData(10, constant({
      pm2_5: 60, pm10: 100, nitrogen_dioxide: 40,
      sulphur_dioxide: 40, ozone: 50, carbon_monoxide: 1000
    }));
    const r = computeCPCB(data, 9);
    expect(r.enough).toBe(false);
    expect(r.aqi).toBeNull();
    // 8-h means (ozone, CO) are still computable from 10 hours…
    expect(r.subs.ozone).toBe(50);
    // …but the 24-h pollutants are not (need ≥16 hourly values)
    expect(r.subs.pm2_5).toBeNull();
  });
  it("refuses an AQI without PM2.5 or PM10, even with 3+ other pollutants (CPCB rule)", () => {
    const data = makeData(24, constant({
      nitrogen_dioxide: 40, sulphur_dioxide: 40, ozone: 50, carbon_monoxide: 1000
    }));
    const r = computeCPCB(data, 23);
    expect(r.enough).toBe(false);
    expect(r.aqi).toBeNull();
  });
});

/* ---------- Cigarette equivalent ---------- */
describe("cigaretteEquivalent (Berkeley Earth: 22 µg/m³ ≙ 1 cigarette/day)", () => {
  it("divides the trailing 24-h PM2.5 mean by 22", () => {
    expect(cigaretteEquivalent(makeData(24, constant({ pm2_5: 22 })), 23)?.cigs).toBe(1);
    expect(cigaretteEquivalent(makeData(24, constant({ pm2_5: 44 })), 23)?.cigs).toBe(2);
    expect(cigaretteEquivalent(makeData(24, constant({ pm2_5: 110 })), 23)?.cigs).toBe(5);
    expect(cigaretteEquivalent(makeData(24, constant({ pm2_5: 44 })), 23)?.mean).toBe(44);
  });
  it("needs at least 12 valid hours in the window", () => {
    const eleven = makeData(24, (i) => ({ pm2_5: i < 13 ? null : 44 }));
    expect(cigaretteEquivalent(eleven, 23)).toBeNull();
    const twelve = makeData(24, (i) => ({ pm2_5: i < 12 ? null : 22 }));
    expect(cigaretteEquivalent(twelve, 23)?.cigs).toBe(1);
  });
});

/* ---------- Windows & best hour ---------- */
describe("aqWindow (cleanest / worst sliding windows)", () => {
  // Baseline 100; a clean dip (40, 30) at hours 20–21; a dirty peak
  // (180, 190) at hours 5–6; a null at hour 30 next to a 10 at hour 31.
  const data = makeData(48, (i) => {
    let a = 100;
    if (i === 20) a = 40; else if (i === 21) a = 30;
    else if (i === 5) a = 180; else if (i === 6) a = 190;
    else if (i === 30) a = null; else if (i === 31) a = 10;
    return { us_aqi: a };
  });
  it("finds the cleanest full 2-hour window", () => {
    const w = aqWindow(data, 0, 2, 48, "clean");
    expect(w?.startIdx).toBe(20);
    expect(w?.avg).toBe(35);
    expect(w?.startTime).toBe("2026-11-24T20:00");
    expect(w?.endTime).toBe("2026-11-24T21:00");
  });
  it("finds the worst 2-hour window", () => {
    const w = aqWindow(data, 0, 2, 48, "worst");
    expect(w?.startIdx).toBe(5);
    expect(w?.avg).toBe(185);
  });
  it("never returns a window containing a null reading", () => {
    // Hour 31 has AQI 10, but its only possible partners are the null at
    // hour 30 and 100 at hour 32 — so no window containing hour 31 may win.
    const w = aqWindow(data, 0, 2, 48, "clean");
    expect(w?.startIdx).not.toBe(30);
    expect(w?.startIdx).not.toBe(31);
  });
  it("respects the hours-ahead horizon", () => {
    const w = aqWindow(data, 0, 2, 10, "clean");
    expect(w?.startIdx).toBe(0); // the dip at hour 20 is out of reach
    expect(w?.avg).toBe(100);
  });
  it("returns null when no full window fits", () => {
    const short = makeData(10, constant({ us_aqi: 50 }));
    expect(aqWindow(short, 9, 2, 24, "clean")).toBeNull();
  });
});

describe("bestHourIn", () => {
  it("penalises night hours: a slightly worse daytime hour wins", () => {
    const data = makeData(24, (i) => ({ us_aqi: i === 3 ? 10 : i === 10 ? 45 : 120 }));
    const b = bestHourIn(data, 0, 24);
    expect(b?.idx).toBe(10); // 45 beats 10 + 40 night penalty
    expect(b?.aqi).toBe(45);
  });
  it("still picks the night hour when it is far cleaner", () => {
    const data = makeData(24, (i) => ({ us_aqi: i === 3 ? 10 : i === 10 ? 100 : 120 }));
    const b = bestHourIn(data, 0, 24);
    expect(b?.idx).toBe(3);
    expect(b?.aqi).toBe(10);
  });
});

/* ---------- Dominant pollutant & day summaries ---------- */
describe("dominantPollutant", () => {
  it("picks the pollutant with the highest US sub-index, not the highest concentration", () => {
    const data = makeData(24, constant({
      pm2_5: 10,           // sub-index 42
      pm10: 200,           // sub-index 123 ← dominant
      nitrogen_dioxide: 50, sulphur_dioxide: 30, ozone: 50, carbon_monoxide: 1000
    }));
    const d = dominantPollutant(data, 5);
    expect(d?.pollutant.name).toBe("PM10");
    expect(d?.si).toBe(123);
  });
  it("returns null when every pollutant is missing", () => {
    expect(dominantPollutant(makeData(24, constant({})), 5)).toBeNull();
  });
});

describe("daySummaries / daySummaryFor", () => {
  const data = makeData(72, (i) => ({ us_aqi: i === 30 ? 150 : i === 31 ? 40 : 80 }));
  it("aggregates max/min per calendar day", () => {
    const days = daySummaries(data, 0);
    expect(days).toHaveLength(3);
    expect(days[1]).toEqual({ date: "2026-11-25", max: 150, min: 40 });
    expect(days[0]).toEqual({ date: "2026-11-24", max: 80, min: 80 });
  });
  it("daySummaryFor returns one day or null", () => {
    expect(daySummaryFor(data, "2026-11-25")).toEqual({ date: "2026-11-25", max: 150, min: 40 });
    expect(daySummaryFor(data, "2027-01-01")).toBeNull();
  });
});

/* ---------- Source insights ---------- */
describe("sourceInsights", () => {
  const base = {
    nitrogen_dioxide: 20, sulphur_dioxide: 10, ozone: 50,
    carbon_monoxide: 500, dust: 10, us_aqi: 100
  };
  const tags = (data, idx) => sourceInsights(data, idx).map((x) => x.tag);
  it("flags dust & construction when PM10 dominates PM2.5 (ratio ≥ 1.8)", () => {
    const data = makeData(24, constant({ ...base, pm2_5: 60, pm10: 180 }));
    expect(tags(data, 12)).toEqual(["Dust & construction"]);
    expect(sourceInsights(data, 12)[0].text).toContain("3.0×");
  });
  it("flags combustion when fine particles dominate (ratio ≤ 1.3, PM2.5 ≥ 35)", () => {
    const data = makeData(24, constant({ ...base, pm2_5: 60, pm10: 70 }));
    expect(tags(data, 12)).toEqual(["Combustion sources"]);
  });
  it("flags industry when SO2 is elevated", () => {
    const data = makeData(24, constant({ ...base, pm2_5: 60, pm10: 90, sulphur_dioxide: 60 }));
    expect(tags(data, 12)).toContain("Industry & coal burning");
  });
  it("flags traffic when NO2 peaks at rush hour vs late night", () => {
    const data = makeData(72, (i, t) => {
      const h = Number(t.slice(11, 13));
      const no2 = [8, 9, 18, 19].includes(h) ? 120 : [2, 3, 4].includes(h) ? 30 : 50;
      return { ...base, pm2_5: 60, pm10: 100, nitrogen_dioxide: no2 };
    });
    expect(tags(data, 36)).toEqual(["Traffic"]);
  });
  it("falls back to a mixed-sources note when no signal stands out", () => {
    const data = makeData(24, constant({ ...base, pm2_5: 60, pm10: 90 }));
    expect(tags(data, 12)).toEqual(["Mixed urban sources"]);
  });
});

/* ---------- Health guidance & GRAP staging ---------- */
describe("healthAdvice", () => {
  it("gives clean-air advice at low AQI for every profile", () => {
    const a = healthAdvice(30, "general");
    expect(a.mask).toContain("No mask needed");
    expect(a.exercise).toContain("exercise outdoors freely");
  });
  it("differentiates sensitive profiles at moderate AQI", () => {
    expect(healthAdvice(75, "child").mask).toContain("sensitive lungs may prefer an N95");
    expect(healthAdvice(75, "general").mask).toContain("No mask needed for most people");
  });
  it("moves asthma patients indoors at USG levels while others only reduce exertion", () => {
    expect(healthAdvice(120, "asthma").exercise).toContain("Move exercise indoors");
    expect(healthAdvice(120, "general").exercise).toContain("Reduce prolonged or heavy exertion");
    expect(healthAdvice(120, "asthma").mask).toContain("N95/KN95");
  });
  it("escalates mask and ventilation advice at high AQI", () => {
    expect(healthAdvice(175, "general").mask).toContain("Cloth and surgical masks give little protection");
    const severe = healthAdvice(250, "asthma");
    expect(severe.exercise).toContain("No outdoor exercise");
    expect(severe.vent).toContain("Keep windows and doors closed");
  });
  it("treats a missing AQI as clean air rather than crashing", () => {
    expect(healthAdvice(null, "general").mask).toContain("No mask needed");
  });
});

describe("stageIdxFor (US category → GRAP stage)", () => {
  it("maps categories onto the staged plan", () => {
    expect([0, 1, 2, 3, 4, 5].map(stageIdxFor)).toEqual([0, 0, 1, 2, 3, 5]);
    expect(stageIdxFor(99)).toBe(0);
  });
});

/* ---------- Activity risk planner ---------- */
describe("planActivity (dose model: dose = PM × rate × hours; score = dose × vuln ÷ 3, capped 0–100)", () => {
  const flat = (pm) => makeData(48, constant({ pm2_5: pm, us_aqi: 100 }));
  const plan = (data, opts) => planActivity(data, 0, opts);

  it("computes dose and score for a simple case", () => {
    const r = plan(flat(50), { activityId: "walk", startIdx: 0, durationH: 1, profileId: "general" });
    expect(r.avgPM).toBe(50);
    expect(r.dose).toBeCloseTo(55, 6);        // 50 × 1.1 m³/h × 1 h
    expect(r.score).toBe(18);                 // round(55 × 1.0 / 3)
    expect(r.verdict.label).toBe("Go");
  });
  it("walks through every verdict band at its exact boundary", () => {
    // schoolrun rate = 1.0, general vuln = 1.0, 1 h → score = PM / 3
    const cases = [[75, 25, "Go"], [150, 50, "Go with care"], [225, 75, "Avoid"], [240, 80, "Skip"]];
    for (const [pm, score, label] of cases) {
      const r = plan(flat(pm), { activityId: "schoolrun", startIdx: 0, durationH: 1, profileId: "general" });
      expect(r.score, `PM ${pm}`).toBe(score);
      expect(r.verdict.label, `PM ${pm}`).toBe(label);
    }
  });
  it("caps the score at 100 for extreme doses", () => {
    const r = plan(flat(500), { activityId: "run", startIdx: 0, durationH: 3, profileId: "asthma" });
    expect(r.dose).toBeCloseTo(3900, 6);      // 500 × 2.6 × 3
    expect(r.score).toBe(100);                // raw 2080, capped
    expect(r.verdict.label).toBe("Skip");
  });
  it("never lets the score leave the 0–100 range", () => {
    for (const pm of [0, 1, 40, 120, 300, 999]) {
      const r = plan(flat(pm), { activityId: "run", startIdx: 0, durationH: 4, profileId: "asthma" });
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
    expect(plan(flat(0), { activityId: "walk", startIdx: 0, durationH: 1, profileId: "general" }).score).toBe(0);
  });
  it("scores strictly higher when the air is dirtier", () => {
    const clean = plan(flat(40), { activityId: "walk", startIdx: 0, durationH: 1, profileId: "general" });
    const dirty = plan(flat(120), { activityId: "walk", startIdx: 0, durationH: 1, profileId: "general" });
    expect(clean.score).toBe(15);
    expect(dirty.score).toBe(44);
    expect(dirty.score).toBeGreaterThan(clean.score);
  });
  it("scores strictly higher for longer durations at the same concentration", () => {
    const one = plan(flat(60), { activityId: "walk", startIdx: 0, durationH: 1, profileId: "general" });
    const three = plan(flat(60), { activityId: "walk", startIdx: 0, durationH: 3, profileId: "general" });
    expect(one.score).toBe(22);
    expect(three.score).toBe(66);
    expect(three.dose).toBeCloseTo(one.dose * 3, 6);
  });
  it("is more protective for more vulnerable profiles at identical exposure", () => {
    const opts = { activityId: "cycling", startIdx: 0, durationH: 1 };
    const general = plan(flat(100), { ...opts, profileId: "general" });
    const child = plan(flat(100), { ...opts, profileId: "child" });
    const asthma = plan(flat(100), { ...opts, profileId: "asthma" });
    expect(general.score).toBe(63);   // 190 × 1.0 / 3
    expect(child.score).toBe(82);     // 190 × 1.3 / 3
    expect(asthma.score).toBe(100);   // 190 × 1.6 / 3, capped
    expect(child.score).toBeGreaterThan(general.score);
    expect(asthma.score).toBeGreaterThan(child.score);
  });
  it("suggests the cleanest window as an alternative with the exposure saving", () => {
    const data = makeData(48, (i) => {
      const v = i < 4 ? 200 : 20;
      return { pm2_5: v, us_aqi: v };
    });
    const r = plan(data, { activityId: "walk", startIdx: 0, durationH: 2, profileId: "general" });
    expect(r.score).toBe(100); // starting in the dirty block is capped
    expect(r.alt).not.toBeNull();
    expect(r.alt?.avgPM).toBe(20);
    expect(r.alt?.score).toBe(15);
    expect(r.alt?.pctLess).toBe(90); // 20 vs 200 µg/m³
  });
  it("reports No data when the PM2.5 series is missing", () => {
    const r = plan(makeData(48, constant({ us_aqi: 100 })),
      { activityId: "walk", startIdx: 0, durationH: 1, profileId: "general" });
    expect(r.avgPM).toBeNull();
    expect(r.score).toBeNull();
    expect(r.dose).toBeNull();
    expect(r.verdict.label).toBe("No data");
  });
  it("falls back to the first profile/activity for unknown ids", () => {
    expect(profileById("nope").id).toBe("general");
    expect(activityById("nope").id).toBe("walk");
    expect(profileById("asthma").vuln).toBe(1.6);
    expect(activityById("run").rate).toBe(2.6);
  });
});

/* ---------- summarize (integration over the whole library) ---------- */
describe("summarize", () => {
  it("assembles a consistent snapshot from three days of hourly data", () => {
    const data = makeData(72, (i, t) => {
      const day = t.slice(0, 10);
      let a = 120;
      if (day === "2026-11-24") a = i === 10 ? 160 : 100;   // yesterday
      if (day === "2026-11-26") a = i === 60 ? 210 : 130;   // tomorrow
      return {
        us_aqi: a, european_aqi: 60, pm2_5: 66, pm10: 100,
        nitrogen_dioxide: 40, sulphur_dioxide: 40, ozone: 50, carbon_monoxide: 1000
      };
    });
    const s = summarize(data, 36, { name: "Delhi" }); // 2026-11-25T12:00
    expect(s.todayStr).toBe("2026-11-25");
    expect(s.aqi).toBe(120);
    expect(s.cat?.name).toBe("Unhealthy for Sensitive Groups");
    expect(s.yesterdayMax).toBe(160);
    expect(s.todayMax).toBe(120);
    expect(s.tomorrowMax).toBe(210);
    expect(s.cig?.cigs).toBe(3);            // 66 / 22
    expect(s.cpcb.enough).toBe(true);
    expect(s.cpcb.aqi).toBe(118);           // PM2.5 66 → CPCB band 3 interpolation
    expect(s.cpcb.cat?.name).toBe("Moderate");
    expect(s.dom?.pollutant.name).toBe("PM2.5");
    expect(s.cleanWindow).not.toBeNull();
    expect(s.worstWindow).not.toBeNull();
    expect(s.best).not.toBeNull();
    expect(Array.isArray(s.sources)).toBe(true);
  });
});
