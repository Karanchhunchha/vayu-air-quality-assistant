/* Data-table integrity + accessibility regression tests.
   The reference tables in core.js drive the whole UI; these tests pin
   their shape (every persona points at a real city + profile, citizen
   actions exist for every category, …) and verify that every colour
   used for TEXT meets WCAG AA contrast (>= 4.5:1) on the app's light
   backgrounds — the bright category colours are for bars/dots only,
   the `text` variants are what text must use. */
import { describe, it, expect } from "vitest";
import {
  BADGES,
  CATEGORIES,
  CITIZEN_ACTIONS,
  CPCB_CATEGORIES,
  ECO_ACTIONS,
  GRAP_STAGES,
  PERSONAS,
  PRESET_CITIES,
  PROFILES,
  currentValues,
  planActivity,
} from "./core.js";

/* --- WCAG 2.x relative luminance / contrast ratio --- */
function luminance(hex) {
  const c = hex.replace("#", "");
  const f = (i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const WHITE = "#ffffff";
const MIST = "#f4f8fa"; // app page background

describe("reference data integrity", () => {
  it("PRESET_CITIES: 10 unique Indian cities with valid coordinates", () => {
    expect(PRESET_CITIES).toHaveLength(10);
    expect(new Set(PRESET_CITIES.map((c) => c.name)).size).toBe(10);
    for (const c of PRESET_CITIES) {
      expect(c.country).toBe("India");
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lon).toBeGreaterThanOrEqual(-180);
      expect(c.lon).toBeLessThanOrEqual(180);
    }
  });

  it("PERSONAS: every persona targets a real preset city and profile", () => {
    const cityNames = new Set(PRESET_CITIES.map((c) => c.name));
    const profileIds = new Set(PROFILES.map((p) => p.id));
    expect(PERSONAS.length).toBeGreaterThanOrEqual(4);
    for (const p of PERSONAS) {
      expect(cityNames.has(p.cityName)).toBe(true);
      expect(profileIds.has(p.profile)).toBe(true);
    }
  });

  it("ECO_ACTIONS: unique ids, positive points, non-empty labels", () => {
    expect(new Set(ECO_ACTIONS.map((a) => a.id)).size).toBe(ECO_ACTIONS.length);
    for (const a of ECO_ACTIONS) {
      expect(a.pts).toBeGreaterThan(0);
      expect(a.label.length).toBeGreaterThan(0);
    }
  });

  it("BADGES: known types and positive thresholds", () => {
    for (const b of BADGES) {
      expect(["points", "streak"]).toContain(b.type);
      expect(b.need).toBeGreaterThan(0);
    }
  });

  it("CITIZEN_ACTIONS: one list of 3 actions per US category", () => {
    expect(CITIZEN_ACTIONS).toHaveLength(CATEGORIES.length);
    for (const row of CITIZEN_ACTIONS) expect(row).toHaveLength(3);
  });

  it("GRAP_STAGES: six stages with unique titles", () => {
    expect(GRAP_STAGES).toHaveLength(6);
    expect(new Set(GRAP_STAGES.map((s) => s.title)).size).toBe(6);
  });

  it("categories are ordered by ascending max on both scales", () => {
    for (const table of [CATEGORIES, CPCB_CATEGORIES]) {
      const maxes = table.map((c) => c.max);
      expect(maxes).toEqual([...maxes].sort((a, b) => a - b));
      expect(maxes[maxes.length - 1]).toBe(500);
    }
  });
});

describe("currentValues", () => {
  const data = {
    hourly: {
      pm2_5: [10, null],
      pm10: [20, 30],
      carbon_monoxide: [400, 500],
      nitrogen_dioxide: [12, 14],
      sulphur_dioxide: [6, 8],
      ozone: [50, 60],
      dust: [15, 25],
      us_aqi: [42, 55],
      european_aqi: [30, 38],
    },
  };
  it("reads every series at the given index", () => {
    expect(currentValues(data, 0)).toEqual({
      pm2_5: 10,
      pm10: 20,
      carbon_monoxide: 400,
      nitrogen_dioxide: 12,
      sulphur_dioxide: 6,
      ozone: 50,
      dust: 15,
      us_aqi: 42,
      european_aqi: 30,
    });
  });
  it("maps missing readings to null instead of NaN/undefined", () => {
    const v = currentValues(data, 1);
    expect(v.pm2_5).toBeNull();
    expect(v.pm10).toBe(30);
  });
});

describe("WCAG AA contrast for text colours", () => {
  it("every US category has a `text` colour passing AA on white and mist", () => {
    for (const c of CATEGORIES) {
      expect(c.text, c.name).toMatch(/^#[0-9a-f]{6}$/i);
      expect(contrast(c.text, WHITE), `${c.name} on white`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.text, MIST), `${c.name} on mist`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("every CPCB category has a `text` colour passing AA on white and mist", () => {
    for (const c of CPCB_CATEGORIES) {
      expect(c.text, c.name).toMatch(/^#[0-9a-f]{6}$/i);
      expect(contrast(c.text, WHITE), `${c.name} on white`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.text, MIST), `${c.name} on mist`).toBeGreaterThanOrEqual(4.5);
    }
  });

  /* Flat synthetic atmosphere: constant PM2.5 / AQI for 3 days. */
  function flatData(pm) {
    const time = [];
    const pmArr = [];
    const aqiArr = [];
    for (let i = 0; i < 72; i++) {
      time.push(`2026-11-${26 + Math.floor(i / 24)}T${String(i % 24).padStart(2, "0")}:00`);
      pmArr.push(pm);
      aqiArr.push(100);
    }
    return { hourly: { time, pm2_5: pmArr, us_aqi: aqiArr } };
  }
  const plan = (pm) =>
    planActivity(flatData(pm), 24, {
      activityId: "walk",
      startIdx: 24,
      durationH: 1,
      profileId: "general",
    });

  it("every planner verdict colour passes AA on the mist panel background", () => {
    const verdicts = [plan(68), plan(137), plan(205), plan(219)]; // Go / Go with care / Avoid / Skip
    expect(verdicts.map((v) => v.verdict.label)).toEqual(["Go", "Go with care", "Avoid", "Skip"]);
    for (const v of verdicts) {
      expect(contrast(v.verdict.color, MIST), v.verdict.label).toBeGreaterThanOrEqual(4.5);
    }
    const noData = planActivity(flatData(null), 24, {
      activityId: "walk",
      startIdx: 24,
      durationH: 1,
      profileId: "general",
    });
    expect(noData.verdict.label).toBe("No data");
    expect(contrast(noData.verdict.color, MIST)).toBeGreaterThanOrEqual(4.5);
  });
});
