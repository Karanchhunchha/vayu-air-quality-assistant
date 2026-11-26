/* Chat engine tests — intent detection, city parsing and reply building
   for the rule-based assistant (src/lib/chat.js). Replies are asserted
   against hand-built summary view-models, so no network is involved. */
import { describe, it, expect } from "vitest";
import { POLLUTANTS, categoryFor, cpcbCategoryFor } from "./core.js";
import {
  CHAT_CHIPS,
  CHAT_GREETING,
  compareReply,
  extractCityQuery,
  findPresetCitiesIn,
  intentFor,
  replyFor,
} from "./chat.js";

/* A Delhi summary at US AQI 132, shaped exactly like core.summarize output. */
function fakeSummary(overrides = {}) {
  const aqi = overrides.aqi !== undefined ? overrides.aqi : 132;
  return {
    city: { name: "Delhi", admin1: "Delhi", country: "India", lat: 28.6139, lon: 77.209 },
    aqi,
    cat: categoryFor(aqi),
    cpcb: { enough: true, aqi: 118, cat: cpcbCategoryFor(118), subs: {}, means: {} },
    cig: { mean: 66, cigs: 3 },
    dom: { pollutant: POLLUTANTS[0], si: 132 },
    values: { pm2_5: 66, pm10: 120, european_aqi: 80 },
    best: { time: "2026-11-26T07:00", aqi: 54, score: 54, idx: 7 },
    cleanWindow: {
      startIdx: 6,
      endIdx: 7,
      startTime: "2026-11-26T06:00",
      endTime: "2026-11-26T08:00",
      avg: 61,
    },
    worstWindow: {
      startIdx: 18,
      endIdx: 19,
      startTime: "2026-11-26T18:00",
      endTime: "2026-11-26T20:00",
      avg: 188,
    },
    tomorrowMax: 210,
    sources: [{ tag: "Traffic", text: "NO2 peaks at rush hour." }],
    todayStr: "2026-11-26",
    timeStr: "2026-11-26T14:00",
    ...overrides,
  };
}

describe("intentFor (rule order is significant)", () => {
  const cases = [
    ["what is the aqi in mumbai?", "current"],
    ["should i wear a mask today?", "mask"],
    ["should i wear a mask tomorrow?", "mask"], // mask is checked before tomorrow
    ["is it safe to exercise outdoors?", "exercise"], // exercise before the "safe" tips rule
    ["safest time for a run", "exercise"], // "run" wins over "safest"
    ["when is the best time to go out?", "best-time"],
    ["when should i open windows?", "ventilation"], // "window" before best-time
    ["what will the aqi be tomorrow?", "tomorrow"],
    ["compare delhi and bengaluru", "compare"],
    ["delhi vs mumbai", "compare"],
    ["which city is better than delhi?", "compare"],
    ["what is causing the pollution?", "sources"],
    ["why is the air so bad?", "sources"],
    ["give me some health tips", "tips"],
    ["is it safe to go out?", "tips"], // bare "safe" lands on tips
    ["how many cigarettes is this like smoking?", "cigarette"],
    ["tell me about delhi", "current"],
  ];
  it.each(cases)("%s → %s", (text, expected) => {
    expect(intentFor(text)).toBe(expected);
  });
});

describe("findPresetCitiesIn", () => {
  it("finds both cities in a comparison, in preset-list order", () => {
    expect(findPresetCitiesIn("compare bengaluru and delhi").map((c) => c.name)).toEqual([
      "Delhi",
      "Bengaluru",
    ]);
  });
  it("returns list order, not mention order", () => {
    expect(findPresetCitiesIn("I live in Mumbai and work in Delhi").map((c) => c.name)).toEqual([
      "Delhi",
      "Mumbai",
    ]);
  });
  it("is case-insensitive and returns each city once", () => {
    expect(findPresetCitiesIn("DELHI delhi DeLhI").map((c) => c.name)).toEqual(["Delhi"]);
  });
  it("returns an empty array when no preset city is mentioned", () => {
    expect(findPresetCitiesIn("what about surat?")).toEqual([]);
  });
});

describe("extractCityQuery", () => {
  it("extracts the place after 'in', stopping at 'tomorrow'", () => {
    expect(extractCityQuery("AQI in Surat tomorrow")).toBe("Surat");
  });
  it("extracts multi-word places after 'in', stopping at 'today'", () => {
    expect(extractCityQuery("weather in New York today")).toBe("New York");
  });
  it("extracts the place after 'for'", () => {
    expect(extractCityQuery("air quality for Jaipur")).toBe("Jaipur");
  });
  it("returns null when there is no in/for/at phrase", () => {
    expect(extractCityQuery("What is the AQI?")).toBeNull();
  });
  it("returns null when the capture is just an article", () => {
    expect(extractCityQuery("AQI in the")).toBeNull();
  });
});

describe("compareReply", () => {
  it("names the cleaner city and both AQIs", () => {
    const a = fakeSummary();
    const b = fakeSummary({
      city: { name: "Bengaluru", admin1: "Karnataka", country: "India", lat: 12.97, lon: 77.59 },
      aqi: 68,
      cat: categoryFor(68),
    });
    const text = compareReply(a, b);
    expect(text).toContain("Delhi: AQI 132 (Unhealthy for Sensitive Groups)");
    expect(text).toContain("Bengaluru: AQI 68 (Moderate)");
    expect(text).toContain("Bengaluru has cleaner air right now.");
  });
  it("handles a tie by naming the first city", () => {
    const a = fakeSummary();
    const b = fakeSummary({
      city: { name: "Pune", admin1: "Maharashtra", country: "India", lat: 18.52, lon: 73.86 },
    });
    expect(compareReply(a, b)).toContain("Delhi has cleaner air right now.");
  });
});

describe("replyFor", () => {
  const ctx = { profileId: "general", guidance: null };

  it("mask advice escalates with the category index", () => {
    expect(replyFor("mask", fakeSummary({ aqi: 45 }), ctx)).toContain(
      "you generally don't need a mask",
    );
    expect(replyFor("mask", fakeSummary(), ctx)).toContain(
      "sensitive people should wear an N95/KN95",
    );
    expect(replyFor("mask", fakeSummary({ aqi: 180 }), ctx)).toContain(
      "wear a well-fitting N95/KN95 — cloth masks don't filter PM2.5 well",
    );
  });

  it("mask advice names the caller's profile", () => {
    const text = replyFor("mask", fakeSummary({ aqi: 45 }), {
      profileId: "child",
      guidance: null,
    });
    expect(text).toContain("For a child (under 12),");
  });

  it("cigarette reply uses the summary's cigarette equivalent", () => {
    const text = replyFor("cigarette", fakeSummary(), ctx);
    expect(text).toContain("trailing 24-hour PM2.5 average is 66 µg/m³");
    expect(text).toContain("≈ 3.0 cigarettes a day");
  });
  it("cigarette reply falls back when there is not enough history", () => {
    expect(replyFor("cigarette", fakeSummary({ cig: null }), ctx)).toContain(
      "don't have enough PM2.5 history for Delhi",
    );
  });

  it("ventilation reply quotes the cleanest and worst windows", () => {
    const text = replyFor("ventilation", fakeSummary(), ctx);
    expect(text).toContain("cleanest window: Today, 6:00 AM – Today, 8:00 AM");
    expect(text).toContain("averages about 61 (Moderate)");
    expect(text).toContain("Avoid the worst window, Today, 6:00 PM – Today, 8:00 PM (avg 188)");
  });
  it("ventilation reply falls back without window data", () => {
    expect(
      replyFor("ventilation", fakeSummary({ cleanWindow: null, worstWindow: null }), ctx),
    ).toContain("unavailable for Delhi");
  });

  it("exercise reply adds the cleanest-hour hint when available", () => {
    const text = replyFor("exercise", fakeSummary(), ctx);
    expect(text).toContain("Light outdoor exercise is OK");
    expect(text).toContain("around Today, 7:00 AM (AQI about 54)");
    const clean = replyFor("exercise", fakeSummary({ aqi: 45, best: null }), ctx);
    expect(clean).toContain("Outdoor exercise is fine.");
    expect(clean).not.toContain("cleanest time");
  });

  it("best-time reply quotes the best hour and the current AQI", () => {
    const text = replyFor("best-time", fakeSummary(), ctx);
    expect(text).toContain("best time to go out in the next 24 hours is around Today, 7:00 AM");
    expect(text).toContain("drop to about 54 (Moderate)");
    expect(text).toContain("Right now it is 132.");
    expect(replyFor("best-time", fakeSummary({ best: null }), ctx)).toContain(
      "Forecast data is unavailable",
    );
  });

  it("tomorrow reply quotes the forecast peak", () => {
    const text = replyFor("tomorrow", fakeSummary(), ctx);
    expect(text).toContain("forecast to peak at about 210 (Very Unhealthy)");
    expect(replyFor("tomorrow", fakeSummary({ tomorrowMax: null }), ctx)).toContain(
      "don't have tomorrow's forecast",
    );
  });

  it("sources reply lists every insight as a bullet", () => {
    const text = replyFor("sources", fakeSummary(), ctx);
    expect(text).toContain("Likely pollution sources in Delhi today");
    expect(text).toContain("• Traffic: NO2 peaks at rush hour.");
  });

  it("tips reply uses the guidance panel when provided", () => {
    const text = replyFor("tips", fakeSummary(), {
      profileId: "general",
      guidance: { mask: "M", exercise: "E", vent: "V" },
    });
    expect(text).toContain("Health tips for Delhi (AQI 132, Unhealthy for Sensitive Groups)");
    expect(text).toContain("• M\n• E\n• V");
  });
  it("tips reply falls back to the category advice without guidance", () => {
    const text = replyFor("tips", fakeSummary(), ctx);
    expect(text).toContain("Health tips for Delhi: Sensitive groups may feel health effects.");
  });

  it("current (default) reply combines US + CPCB + cigarette + dominant pollutant", () => {
    const text = replyFor("current", fakeSummary(), ctx);
    expect(text).toContain("Right now in Delhi: US AQI 132 — Unhealthy for Sensitive Groups.");
    expect(text).toContain("On India's CPCB scale it is 118 (Moderate).");
    expect(text).toContain("Dominant pollutant: PM2.5 (sub-index 132).");
    expect(text).toContain("PM2.5 is 66 µg/m³ and PM10 is 120 µg/m³.");
    expect(text).toContain("like smoking about 3.0 cigarettes a day");
  });
  it("current reply omits the CPCB and cigarette bits when data is missing", () => {
    const text = replyFor(
      "current",
      fakeSummary({ cpcb: { enough: false, aqi: null, cat: null }, cig: null }),
      ctx,
    );
    expect(text).not.toContain("CPCB scale");
    expect(text).not.toContain("cigarettes");
  });
});

describe("chat constants", () => {
  it("every suggestion chip carries a label and a question", () => {
    expect(CHAT_CHIPS.length).toBeGreaterThanOrEqual(6);
    for (const chip of CHAT_CHIPS) {
      expect(chip.label.length).toBeGreaterThan(0);
      expect(chip.q.length).toBeGreaterThan(0);
    }
  });
  it("the greeting is honest about being data-driven", () => {
    expect(CHAT_GREETING).toContain("Open-Meteo");
  });
});
