/* Eco-game logic tests (src/lib/eco.js) — points, streaks, badges and
   progress rules for the gamified eco-action checklist. */
import { describe, it, expect } from "vitest";
import { badgeEarned, dateKey, ecoProgress, emptyEcoState, toggleEcoAction } from "./eco.js";

const TODAY = "2026-11-26";
const YESTERDAY = "2026-11-25";
const transport = { id: "transport", pts: 20 };
const plant = { id: "plant", pts: 25 };

describe("dateKey", () => {
  it("formats a local date with zero padding", () => {
    expect(dateKey(new Date(2026, 8, 5))).toBe("2026-09-05");
    expect(dateKey(new Date(2026, 10, 26))).toBe("2026-11-26");
  });
  it("rolls over month and year boundaries via the offset", () => {
    expect(dateKey(new Date(2026, 0, 31), 1)).toBe("2026-02-01");
    expect(dateKey(new Date(2026, 2, 1), -1)).toBe("2026-02-28");
    expect(dateKey(new Date(2026, 11, 31), 1)).toBe("2027-01-01");
  });
});

describe("toggleEcoAction", () => {
  it("checking a first action adds points and starts a 1-day streak", () => {
    const s = toggleEcoAction(emptyEcoState(), transport, true, TODAY, YESTERDAY);
    expect(s.points).toBe(20);
    expect(s.streak).toBe(1);
    expect(s.lastDay).toBe(TODAY);
    expect(s.done[TODAY]).toEqual(["transport"]);
  });

  it("checking a second action the same day adds points but not streak", () => {
    const s1 = toggleEcoAction(emptyEcoState(), transport, true, TODAY, YESTERDAY);
    const s2 = toggleEcoAction(s1, plant, true, TODAY, YESTERDAY);
    expect(s2.points).toBe(45);
    expect(s2.streak).toBe(1);
    expect(s2.done[TODAY]).toEqual(["transport", "plant"]);
  });

  it("continuing from yesterday extends the streak", () => {
    const state = { points: 20, streak: 1, lastDay: YESTERDAY, done: {} };
    const s = toggleEcoAction(state, transport, true, TODAY, YESTERDAY);
    expect(s.streak).toBe(2);
    expect(s.lastDay).toBe(TODAY);
  });

  it("a gap day restarts the streak at 1", () => {
    const state = { points: 90, streak: 4, lastDay: "2026-11-20", done: {} };
    const s = toggleEcoAction(state, transport, true, TODAY, YESTERDAY);
    expect(s.streak).toBe(1);
  });

  it("later actions on an already-active day never touch the streak", () => {
    const state = { points: 20, streak: 3, lastDay: TODAY, done: { [TODAY]: ["transport"] } };
    const s = toggleEcoAction(state, plant, true, TODAY, YESTERDAY);
    expect(s.streak).toBe(3);
    expect(s.points).toBe(45);
  });

  it("re-checking a done action returns the same state object", () => {
    const s1 = toggleEcoAction(emptyEcoState(), transport, true, TODAY, YESTERDAY);
    expect(toggleEcoAction(s1, transport, true, TODAY, YESTERDAY)).toBe(s1);
  });

  it("unchecking removes the points and the entry, streak untouched", () => {
    const s1 = toggleEcoAction(emptyEcoState(), transport, true, TODAY, YESTERDAY);
    const s2 = toggleEcoAction(s1, transport, false, TODAY, YESTERDAY);
    expect(s2.points).toBe(0);
    expect(s2.done[TODAY]).toEqual([]);
    expect(s2.streak).toBe(1);
    expect(s2.lastDay).toBe(TODAY);
  });

  it("unchecking an action that is not done returns the same state object", () => {
    const s1 = toggleEcoAction(emptyEcoState(), transport, true, TODAY, YESTERDAY);
    expect(toggleEcoAction(s1, plant, false, TODAY, YESTERDAY)).toBe(s1);
  });

  it("points never drop below zero when unchecking", () => {
    const state = { points: 10, streak: 0, lastDay: null, done: { [TODAY]: ["plant"] } };
    expect(toggleEcoAction(state, plant, false, TODAY, YESTERDAY).points).toBe(0);
  });

  it("does not mutate the input state", () => {
    const state = emptyEcoState();
    toggleEcoAction(state, transport, true, TODAY, YESTERDAY);
    expect(state.points).toBe(0);
    expect(state.done).toEqual({});
  });
});

describe("badgeEarned", () => {
  it("points badges are earned at and above the threshold", () => {
    const badge = { type: "points", need: 150 };
    expect(badgeEarned(badge, 149, 0)).toBe(false);
    expect(badgeEarned(badge, 150, 0)).toBe(true);
    expect(badgeEarned(badge, 300, 0)).toBe(true);
  });
  it("streak badges look at the streak, not the points", () => {
    const badge = { type: "streak", need: 3 };
    expect(badgeEarned(badge, 500, 2)).toBe(false);
    expect(badgeEarned(badge, 0, 3)).toBe(true);
  });
});

describe("ecoProgress", () => {
  it("computes the completion percentage", () => {
    expect(ecoProgress(0, 7)).toBe(0);
    expect(ecoProgress(7, 7)).toBe(100);
    expect(ecoProgress(3, 7)).toBeCloseTo(42.857, 2);
  });
  it("clamps at 100 and tolerates a zero total", () => {
    expect(ecoProgress(9, 7)).toBe(100);
    expect(ecoProgress(0, 0)).toBe(0);
  });
});
