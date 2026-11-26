/* =====================================================================
   Vayu — eco-game state logic (pure, no DOM, no storage).
   Extracted from components/EcoGame.jsx so the points / streak / badge
   rules can be unit-tested in Node. The component owns persistence
   (localStorage); everything here is a pure function of its inputs.
   ===================================================================== */

/**
 * Local calendar-day key ("YYYY-MM-DD") for a Date, shifted by whole days.
 * @param {Date} date base date
 * @param {number} [offsetDays] days to shift (negative = past)
 * @returns {string} day key
 */
export function dateKey(date, offsetDays = 0) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/**
 * A fresh eco-game state: no points, no streak, nothing done.
 * @returns {{points: number, streak: number, lastDay: string|null, done: Object<string, string[]>}}
 */
export function emptyEcoState() {
  return { points: 0, streak: 0, lastDay: null, done: {} };
}

/**
 * Apply one checkbox toggle to the eco-game state.
 *
 * Rules:
 *  - Checking an action not yet done today adds its points. The first
 *    check of a new day also updates the streak: +1 when yesterday was
 *    the last active day, otherwise the streak restarts at 1.
 *  - Unchecking an action done today removes its points (never below 0);
 *    the streak is left untouched.
 *  - Anything else (re-checking a done action, unchecking one not done)
 *    changes nothing and returns the SAME state object, so callers can
 *    skip re-rendering / persisting.
 *
 * @param {{points: number, streak: number, lastDay: string|null, done: Object<string, string[]>}} state
 * @param {{id: string, pts: number}} action the eco action toggled
 * @param {boolean} checked the checkbox's new state
 * @param {string} today today's day key (see dateKey)
 * @param {string} yesterday yesterday's day key
 * @returns {object} the next state (same reference when nothing changed)
 */
export function toggleEcoAction(state, action, checked, today, yesterday) {
  const list = state.done[today] || [];
  if (checked && !list.includes(action.id)) {
    const next = {
      ...state,
      points: state.points + action.pts,
      done: { ...state.done, [today]: [...list, action.id] },
    };
    if (state.lastDay !== today) {
      next.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
      next.lastDay = today;
    }
    return next;
  }
  if (!checked && list.includes(action.id)) {
    return {
      ...state,
      points: Math.max(0, state.points - action.pts),
      done: { ...state.done, [today]: list.filter((id) => id !== action.id) },
    };
  }
  return state;
}

/**
 * Whether a badge is earned at the given points / streak totals.
 * @param {{type: string, need: number}} badge badge definition (see core.BADGES)
 * @param {number} points total points
 * @param {number} streak current day streak
 * @returns {boolean}
 */
export function badgeEarned(badge, points, streak) {
  return badge.type === "points" ? points >= badge.need : streak >= badge.need;
}

/**
 * Today's completion percentage (0–100) for the progress bar.
 * @param {number} doneCount actions completed today
 * @param {number} total total actions available
 * @returns {number} percentage, clamped to 100
 */
export function ecoProgress(doneCount, total) {
  if (!total) return 0;
  return Math.min(100, (doneCount / total) * 100);
}
