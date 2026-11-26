import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PROFILES, categoryFor, fmt, fmtTime, healthAdvice } from '../lib/core';
import { SectionHeading } from './ui';
import { CardSpotlight } from './aceternity/card-spotlight';

const BOXES = [
  { key: 'mask', icon: '😷', title: 'Mask' },
  { key: 'exercise', icon: '🏃', title: 'Exercise' },
  { key: 'vent', icon: '🪟', title: 'Ventilation' },
];

export default function Health({ summary, profile, setProfile }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => { if (window.speechSynthesis) window.speechSynthesis.cancel(); }, [summary?.city?.name]);

  if (!summary) return null;
  const advice = healthAdvice(summary.aqi, profile);
  const best = summary.best;
  const win = summary.cleanWindow;

  const ventText = advice.vent + (win && summary.aqi !== null && summary.aqi <= 150
    ? ` Today's cleanest window is ${fmtTime(win.startTime, summary.todayStr)} – ${fmtTime(win.endTime, summary.todayStr)} (avg AQI ${fmt(win.avg)}).`
    : '');

  const texts = { mask: advice.mask, exercise: advice.exercise, vent: ventText };
  const bestText = best
    ? `The cleanest time to step out in the next 24 hours is around ${fmtTime(best.time, summary.todayStr)}, when AQI is expected to be about ${fmt(best.aqi)} (${categoryFor(best.aqi)?.name || '—'}). Plan walks and errands then.`
    : 'Forecast data is unavailable right now.';

  function readAloud() {
    if (!window.speechSynthesis) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const prof = PROFILES.find((p) => p.id === profile);
    const u = new SpeechSynthesisUtterance(
      `Air quality guidance for ${summary.city.name}, for a ${prof ? prof.label.toLowerCase() : 'general adult'}. ` +
      `The AQI is ${fmt(summary.aqi)}, ${summary.cat ? summary.cat.name : ''}. ` +
      `Mask: ${advice.mask} Exercise: ${advice.exercise} Ventilation: ${ventText} Best time outdoors: ${bestText}`
    );
    u.rate = 1.02;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  return (
    <CardSpotlight>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading
          kicker="Personalised"
          title="Health guidance"
          sub="Advice adapts to who it is for — the same AQI means different things for a child, an asthma patient or a traffic policeman."
        />
        <button
          type="button"
          onClick={readAloud}
          className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold ring-1 transition ${
            speaking ? 'bg-red-50 text-red-600 ring-red-200' : 'bg-brand-soft text-brand-deep ring-brand/25 hover:bg-brand hover:text-white'
          }`}
        >
          {speaking ? '⏹ Stop' : '🔊 Read aloud'}
        </button>
      </div>

      <label htmlFor="profileSelect" className="text-sm font-semibold text-ink">Who is this guidance for?</label>
      {/* Segmented control — pattern adapted from Mantine's SegmentedControl:
          one recessed track, the active option as a raised white pill. */}
      <div className="mt-2 inline-flex max-w-full flex-wrap gap-1 rounded-full bg-surface p-1 ring-1 ring-line" role="group" aria-label="Guidance profile">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProfile(p.id)}
            aria-pressed={profile === p.id}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              profile === p.id
                ? 'bg-white text-brand-deep shadow-sm ring-1 ring-slate-900/10'
                : 'text-inksoft hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <select id="profileSelect" className="sr-only" value={profile} onChange={(e) => setProfile(e.target.value)} aria-hidden="true" tabIndex={-1}>
        {PROFILES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {BOXES.map((b, i) => (
          <motion.div
            key={b.key + profile}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="rounded-2xl bg-mist/80 p-4 ring-1 ring-slate-900/5"
          >
            <p className="font-display text-sm font-bold text-ink">{b.icon} {b.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-inksoft">{texts[b.key]}</p>
          </motion.div>
        ))}
      </div>
      {/* Featured banner (bento move): the single most actionable fact in this
          section is promoted out of the tile grid to full width. */}
      <motion.div
        key={'best' + profile}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.21 }}
        className="mt-3 flex items-start gap-3.5 rounded-2xl bg-brand-soft/70 p-4 ring-1 ring-brand/20 sm:items-center"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-brand/15" aria-hidden="true">🕒</span>
        <div>
          <p className="font-display text-sm font-bold text-brand-deep">Best time outdoors</p>
          <p className="mt-0.5 text-sm leading-relaxed text-inksoft">{bestText}</p>
        </div>
      </motion.div>
      <p className="mt-4 text-xs text-inkfaint">General information, not medical advice. If you have breathing difficulty, seek medical help.</p>
    </CardSpotlight>
  );
}
