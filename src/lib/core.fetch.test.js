/* =====================================================================
   Tests for the network-facing helpers in src/lib/core.js.
   `fetch` is stubbed — these tests verify URL construction, response
   handling and error propagation without touching the network.
   ===================================================================== */
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchAQ, fetchTickerAQI, geocode, currentIndex } from "./core.js";

const DELHI = { name: "Delhi", lat: 28.6139, lon: 77.209 };

function stubFetch(handler) {
  const fn = vi.fn(handler);
  vi.stubGlobal("fetch", fn);
  return fn;
}
const okJson = (payload) => async () => ({ ok: true, status: 200, json: async () => payload });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAQ", () => {
  it("requests the Open-Meteo air-quality endpoint for the city's coordinates", async () => {
    const payload = { hourly: { time: [], us_aqi: [] } };
    const fn = stubFetch(okJson(payload));
    await expect(fetchAQ(DELHI)).resolves.toBe(payload);
    const url = fn.mock.calls[0][0];
    expect(url).toContain("https://air-quality-api.open-meteo.com/v1/air-quality?");
    expect(url).toContain("latitude=28.6139");
    expect(url).toContain("longitude=77.209");
    expect(url).toContain("hourly=pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,us_aqi,european_aqi");
    expect(url).toContain("forecast_days=5");
    expect(url).toContain("past_days=2"); // past days feed the CPCB trailing means
  });
  it("throws a descriptive error on a non-OK response", async () => {
    stubFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    await expect(fetchAQ(DELHI)).rejects.toThrow("Air quality API returned 503");
  });
});

describe("geocode", () => {
  it("returns the API's results and URL-encodes the query", async () => {
    const results = [{ name: "New Delhi", latitude: 28.61, longitude: 77.21 }];
    const fn = stubFetch(okJson({ results }));
    await expect(geocode("New Delhi")).resolves.toEqual(results);
    expect(fn.mock.calls[0][0]).toContain("name=New%20Delhi");
    expect(fn.mock.calls[0][0]).toContain("count=5");
  });
  it("returns an empty array when the API finds nothing", async () => {
    stubFetch(okJson({}));
    await expect(geocode("zzzz-not-a-place")).resolves.toEqual([]);
  });
  it("throws on a non-OK response", async () => {
    stubFetch(async () => ({ ok: false, status: 429, json: async () => ({}) }));
    await expect(geocode("Delhi")).rejects.toThrow("Geocoding API returned 429");
  });
});

/* Builds hourly timestamps (local-format strings) spanning ±48 h around
   now in UTC, with a marker AQI at the current hour. */
function aroundNow() {
  const now = new Date();
  const hourStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours());
  const times = [], aqis = [];
  for (let h = -48; h <= 48; h++) {
    times.push(new Date(hourStart + h * 3600e3).toISOString().slice(0, 16));
    aqis.push(h === 0 ? 222 : 111);
  }
  return { times, aqis, currentKey: times[48].slice(0, 13) };
}

describe("currentIndex", () => {
  it("points at the entry for the current hour in the location's timezone", () => {
    const { times, aqis, currentKey } = aroundNow();
    const data = { utc_offset_seconds: 0, hourly: { time: times, us_aqi: aqis } };
    const idx = currentIndex(data);
    expect(data.hourly.time[idx].slice(0, 13)).toBe(currentKey);
    expect(data.hourly.us_aqi[idx]).toBe(222);
  });
  it("falls back to the last entry when all data is in the past", () => {
    const past = [];
    for (let h = 0; h < 24; h++) past.push(new Date(Date.UTC(2020, 0, 1, h)).toISOString().slice(0, 16));
    const data = { utc_offset_seconds: 0, hourly: { time: past, us_aqi: past.map(() => 50) } };
    expect(currentIndex(data)).toBe(23);
  });
});

describe("fetchTickerAQI", () => {
  it("returns the current-hour AQI for the city", async () => {
    const { times, aqis } = aroundNow();
    stubFetch(okJson({ utc_offset_seconds: 0, hourly: { time: times, us_aqi: aqis } }));
    const r = await fetchTickerAQI(DELHI);
    expect(r.city).toBe(DELHI);
    expect(r.aqi).toBe(222);
    expect(typeof r.time).toBe("string");
  });
});
