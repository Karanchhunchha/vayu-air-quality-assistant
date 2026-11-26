import { useState } from 'react';
import { motion } from 'framer-motion';
import { BADGES, ECO_ACTIONS } from '../lib/core';
import { Card, SectionHeading } from './ui';

const LS = { points: 'vayu_points', streak: 'vayu_streak', lastDay: 'vayu_last_day', done: 'vayu_done' };
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage unavailable */ }
}
function todayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function loadGame() {
  return {
    points: lsGet(LS.points, 0),
    streak: lsGet(LS.streak, 0),
    lastDay: lsGet(LS.lastDay, null),
    done: lsGet(LS.done, {}),
  };
}

export default function EcoGame() {
  const [game, setGame] = useState(loadGame);
  const today = todayKey();
  const doneToday = game.done[today] || [];

  function toggle(action, checked) {
    const g = { ...game, done: { ...game.done } };
    const list = [...(g.done[today] || [])];
    if (checked && !list.includes(action.id)) {
      list.push(action.id);
      g.points += action.pts;
      if (g.lastDay !== today) {
        g.streak = g.lastDay === todayKey(-1) ? g.streak + 1 : 1;
        g.lastDay = today;
      }
    } else if (!checked && list.includes(action.id)) {
      g.done[today] = list.filter((id) => id !== action.id);
      g.points = Math.max(0, g.points - action.pts);
      lsSet(LS.points, g.points);
      lsSet(LS.done, g.done);
      setGame(g);
      return;
    } else {
      return;
    }
    g.done[today] = list;
    lsSet(LS.points, g.points);
    lsSet(LS.streak, g.streak);
    lsSet(LS.lastDay, g.lastDay);
    lsSet(LS.done, g.done);
    setGame(g);
  }

  return (
    <Card>
      <SectionHeading
        kicker="Gamified awareness"
        title="Eco-actions — earn points, build your streak 🌱"
        sub="Tick off the eco-friendly actions you did today. Progress is saved on this device."
      />
      <div className="mb-5 flex flex-wrap items-center gap-6">
        <div className="flex items-baseline gap-2">
          <motion.span
            key={game.points}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
            className="tnum font-display text-4xl font-extrabold text-brand"
          >
            {game.points}
          </motion.span>
          <span className="text-sm font-medium text-inksoft">points</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="tnum font-display text-4xl font-extrabold text-[#d97706]">{game.streak}</span>
          <span className="text-sm font-medium text-inksoft">day streak 🔥</span>
        </div>
        <div className="flex items-center gap-2">
          {BADGES.map((b) => {
            const earned = b.type === 'points' ? game.points >= b.need : game.streak >= b.need;
            return (
              <motion.span
                key={b.name}
                title={`${b.name}${earned ? ' — earned!' : ` — ${b.type === 'points' ? b.need + ' points' : b.need + '-day streak'} needed`}`}
                animate={earned ? { scale: [1, 1.18, 1] } : {}}
                transition={{ duration: 0.5 }}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-xl ring-1 ${
                  earned ? 'bg-amber-50 ring-amber-300' : 'bg-mist opacity-40 ring-slate-200 grayscale'
                }`}
              >
                {b.icon}
              </motion.span>
            );
          })}
        </div>
        <div className="min-w-[160px] flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand to-emerald-400"
              animate={{ width: `${Math.min(100, (doneToday.length / ECO_ACTIONS.length) * 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="tnum mt-1 text-xs text-inkfaint">{doneToday.length} of {ECO_ACTIONS.length} actions done today</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {ECO_ACTIONS.map((a) => {
          const done = doneToday.includes(a.id);
          return (
            <label
              key={a.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition ${
                done ? 'bg-emerald-50 ring-emerald-600/25' : 'bg-mist/70 ring-slate-900/5 hover:bg-brand-soft/50'
              }`}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={(e) => toggle(a, e.target.checked)}
                className="h-[18px] w-[18px] shrink-0 accent-emerald-600"
              />
              <span className={`flex-1 text-sm ${done ? 'font-medium text-emerald-900' : 'text-ink'}`}>{a.icon} {a.label}</span>
              <span className="font-display text-[13px] font-bold text-brand">+{a.pts}</span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}
