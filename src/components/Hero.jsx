import { useEffect, useRef, useState } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { fmt, fmtTime } from '../lib/core';

function useCountUp(value) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) { setDisplay(0); return undefined; }
    if (reduce) { setDisplay(value); prev.current = value; return undefined; }
    const controls = animate(prev.current, value, {
      duration: 1.1,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);
  return display;
}

function ScaleBadge({ label, value, catName, color, title }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white/70 px-3.5 py-2.5 ring-1 ring-slate-900/5 backdrop-blur" title={title}>
      <span className="h-8 w-1.5 rounded-full" style={{ background: color || '#cbd5e1' }} />
      <div className="leading-tight">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="font-display text-[15px] font-bold text-ink">
          {value} {catName && <span className="text-xs font-semibold" style={{ color: color || '#64748b' }}>{catName}</span>}
        </p>
      </div>
    </div>
  );
}

export default function Hero({ summary }) {
  const s = summary;
  const shown = useCountUp(s ? s.aqi : null);
  const color = s && s.cat ? s.cat.color : '#94a3b8';
  const R = 82;
  const CIRC = 2 * Math.PI * R;
  const frac = s && s.aqi !== null ? Math.min(500, Math.max(0, s.aqi)) / 500 : 0;

  function shareText() {
    const lines = [
      `🌬️ Air report — ${s.city.name} (${fmtTime(s.timeStr, s.todayStr)})`,
      `US AQI ${fmt(s.aqi)} — ${s.cat ? s.cat.name : '—'}${s.cpcb && s.cpcb.enough ? ` · India CPCB AQI ${s.cpcb.aqi} — ${s.cpcb.cat.name}` : ''}`,
      s.dom ? `Main pollutant: ${s.dom.pollutant.plain}` : null,
      s.cig ? `Breathing today's air ≈ ${s.cig.cigs.toFixed(1)} cigarettes/day` : null,
      s.cleanWindow ? `Cleanest 2 hours: ${fmtTime(s.cleanWindow.startTime, s.todayStr)} – ${fmtTime(s.cleanWindow.endTime, s.todayStr)} (avg AQI ${fmt(s.cleanWindow.avg)})` : null,
      s.cat ? s.cat.advice : null,
      '— via Vayu, Urban Air Quality Assistant',
    ];
    return lines.filter(Boolean).join('\n');
  }
  async function share() {
    const text = shareText();
    if (navigator.share) {
      try { await navigator.share({ title: 'Vayu — Air Report', text }); return; } catch { /* user cancelled */ }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }

  if (!s) return null;
  const trendDelta = s.yesterdayMax !== null && s.todayMax !== null ? Math.round(s.todayMax - s.yesterdayMax) : null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl p-5 shadow-card ring-1 ring-slate-900/5 sm:p-7"
      style={{
        background: `radial-gradient(720px 340px at 88% -10%, ${color}30, transparent 62%), radial-gradient(560px 300px at -10% 110%, #0e7c8614, transparent 60%), linear-gradient(180deg, #ffffff, #fbfdfe)`,
      }}
      aria-label="Live air quality"
    >
      <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-[28px]">
                {s.city.name}
                <span className="font-semibold text-inksoft">
                  {s.city.admin1 ? `, ${s.city.admin1}` : ''}{s.city.country ? `, ${s.city.country}` : ''}
                </span>
              </h2>
              <p className="mt-1 text-[13px] text-inksoft">
                Hour: {fmtTime(s.timeStr)} · Timezone: {s.timezone} · Source: Open-Meteo (CAMS)
              </p>
            </div>
            <button
              type="button"
              onClick={share}
              className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
              Share today's air report
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <ScaleBadge label="US AQI" value={fmt(s.aqi)} catName={s.cat ? s.cat.name : ''} color={color} title="United States EPA Air Quality Index" />
            <ScaleBadge label="EU AQI" value={fmt(s.values.european_aqi)} color="#38bdf8" title="European Air Quality Index, for comparison" />
            <ScaleBadge
              label="India CPCB"
              value={s.cpcb && s.cpcb.enough ? String(s.cpcb.aqi) : '—'}
              catName={s.cpcb && s.cpcb.enough ? s.cpcb.cat.name : 'needs more data'}
              color={s.cpcb && s.cpcb.cat ? s.cpcb.cat.color : '#cbd5e1'}
              title="India's National AQI, computed locally from trailing 24-h / 8-h means using CPCB breakpoints"
            />
          </div>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink">
            {s.cat ? s.cat.advice : 'Live data is unavailable for this location right now.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-inksoft">
            <p>Dominant pollutant: <strong className="font-display text-ink">{s.dom ? `${s.dom.pollutant.name} (sub-index ${s.dom.si})` : '—'}</strong></p>
            {s.cig && (
              <p title="Berkeley Earth rule: 24 hours at 22 µg/m³ PM2.5 ≈ one cigarette">
                🚬 Breathing today's air ≈ <strong className="font-display text-ink">{s.cig.cigs.toFixed(1)} cigarettes/day</strong>
                <span className="text-slate-400"> (24-h PM2.5 {fmt(s.cig.mean)} µg/m³)</span>
              </p>
            )}
          </div>

          {trendDelta !== null && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[13px] font-medium text-inksoft ring-1 ring-slate-900/5">
              <span aria-hidden="true">{trendDelta > 0 ? '📈' : trendDelta < 0 ? '📉' : '➖'}</span>
              Yesterday's peak AQI {fmt(s.yesterdayMax)} → today's peak {fmt(s.todayMax)}
              <strong style={{ color: trendDelta > 0 ? '#d92323' : trendDelta < 0 ? '#00a344' : '#64748b' }}>
                {trendDelta > 0 ? `+${trendDelta} worse` : trendDelta < 0 ? `${trendDelta} better` : 'no change'}
              </strong>
            </p>
          )}
        </div>

        <div className="relative mx-auto h-[196px] w-[196px] shrink-0">
          <svg viewBox="0 0 196 196" className="h-full w-full -rotate-90">
            <circle cx="98" cy="98" r={R} fill="none" stroke="#e8eff3" strokeWidth="15" />
            <motion.circle
              cx="98" cy="98" r={R} fill="none"
              stroke={color} strokeWidth="15" strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={false}
              animate={{ strokeDashoffset: CIRC * (1 - frac) }}
              transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
              style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[56px] font-extrabold leading-none tracking-tight" style={{ color }}>
              {s.aqi === null ? '–' : shown}
            </span>
            <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">US AQI</span>
            <span className="mt-1 max-w-[130px] text-center font-display text-[13px] font-bold leading-tight" style={{ color }}>
              {s.cat ? s.cat.name : 'No data'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex gap-1" aria-hidden="true">
        {['#00c853', '#f5c518', '#ff7e00', '#ef3f36', '#8f3f97', '#7e0023'].map((c) => (
          <span key={c} className="h-1.5 flex-1 rounded-full" style={{ background: c, opacity: 0.85 }} />
        ))}
      </div>
    </section>
  );
}
