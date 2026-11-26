import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ACTIVITIES, fmt, fmtTime, hourLabel, planActivity, profileById,
} from '../lib/core';
import { SectionHeading } from './ui';
import { CardSpotlight } from './aceternity/card-spotlight';

const DURATIONS = [0.5, 1, 1.5, 2, 3];

export default function Planner({ data, curIdx, summary, profile }) {
  const [activityId, setActivityId] = useState('walk');
  const [startOffset, setStartOffset] = useState(1);
  const [durationH, setDurationH] = useState(1);

  const plan = useMemo(() => {
    if (!data) return null;
    return planActivity(data, curIdx, {
      activityId,
      startIdx: Math.min(curIdx + startOffset, data.hourly.time.length - 1),
      durationH,
      profileId: profile,
    });
  }, [data, curIdx, activityId, startOffset, durationH, profile]);

  if (!data || !summary || !plan) return null;
  const H = data.hourly;
  const prof = profileById(profile);
  const showAlt = plan.alt && plan.score !== null && plan.score > 25 && plan.alt.pctLess >= 10;

  const selectCls = 'w-full rounded-2xl border border-slate-200 bg-mist/60 px-3.5 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15';

  return (
    <CardSpotlight>
      <SectionHeading
        kicker="Plan ahead"
        title="Plan an activity — what's my risk?"
        sub="Pick an activity, a start time and a duration. Vayu estimates the PM2.5 you would actually inhale, and scores it for the selected profile."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="plannerActivity" className="text-[13px] font-semibold text-ink">Activity</label>
          <select id="plannerActivity" className={`${selectCls} mt-1.5`} value={activityId} onChange={(e) => setActivityId(e.target.value)}>
            {ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="plannerStart" className="text-[13px] font-semibold text-ink">Start time</label>
          <select id="plannerStart" className={`${selectCls} mt-1.5`} value={startOffset} onChange={(e) => setStartOffset(Number(e.target.value))}>
            {Array.from({ length: 24 }, (_, k) => {
              const i = curIdx + k;
              if (i >= H.time.length) return null;
              return (
                <option key={k} value={k}>
                  {k === 0 ? 'Now · ' : ''}{hourLabel(H.time[i], summary.todayStr)} ({fmtTime(H.time[i], summary.todayStr)})
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label htmlFor="plannerDuration" className="text-[13px] font-semibold text-ink">Duration</label>
          <select id="plannerDuration" className={`${selectCls} mt-1.5`} value={durationH} onChange={(e) => setDurationH(Number(e.target.value))}>
            {DURATIONS.map((d) => <option key={d} value={d}>{d} hour{d > 1 ? 's' : ''}</option>)}
          </select>
        </div>
      </div>

      <motion.div
        key={`${activityId}-${startOffset}-${durationH}-${profile}-${summary.city.name}`}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="mt-5 flex flex-col gap-4 rounded-3xl bg-mist/80 p-5 ring-1 ring-slate-900/5 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-4">
          {/* Score ring — pattern adapted from Mantine's RingProgress:
              SVG track + verdict-coloured progress arc, value centred. */}
          <div className="relative h-[92px] w-[92px] shrink-0">
            <svg viewBox="0 0 92 92" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="46" cy="46" r="40" fill="none" stroke="#e2ebee" strokeWidth="9" />
              <motion.circle
                cx="46" cy="46" r="40" fill="none"
                stroke={plan.verdict.color} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                initial={false}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (plan.score ?? 0) / 100) }}
                transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="tnum font-display text-[26px] font-extrabold leading-none" style={{ color: plan.verdict.color }}>
                {plan.score === null ? '–' : plan.score}
              </span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-inkfaint">/ 100 risk</span>
            </div>
          </div>
          <div>
            <p className="font-display text-lg font-bold" style={{ color: plan.verdict.color }}>{plan.verdict.label}</p>
            <p className="max-w-sm text-sm leading-relaxed text-inksoft">
              {plan.activity.label} at {fmtTime(plan.startTime, summary.todayStr)} for {durationH}h · for a {prof.label.toLowerCase()}.
            </p>
          </div>
        </div>
        <dl className="grid flex-1 grid-cols-3 gap-3 text-center sm:border-l sm:border-line sm:pl-6 sm:text-left">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-inkfaint">Avg PM2.5</dt>
            <dd className="tnum font-display text-base font-bold text-ink">{fmt(plan.avgPM)} µg/m³</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-inkfaint">Inhaled dose</dt>
            <dd className="tnum font-display text-base font-bold text-ink">{plan.dose === null ? '—' : `≈${fmt(plan.dose)} µg`}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-inkfaint">Breathing rate</dt>
            <dd className="tnum font-display text-base font-bold text-ink">{plan.activity.rate} m³/h</dd>
          </div>
        </dl>
      </motion.div>

      {showAlt && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-600/15"
        >
          💡 <strong>Shift it:</strong> the same activity in today's cleanest window ({fmtTime(plan.alt.startTime, summary.todayStr)} – {fmtTime(plan.alt.endTime, summary.todayStr)})
          averages PM2.5 {fmt(plan.alt.avgPM)} µg/m³ — about <strong>{plan.alt.pctLess}% less</strong>, dropping the risk score to <strong>{plan.alt.score}</strong>.
        </motion.p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-inkfaint">
        How this score works — dose = mean PM2.5 × breathing rate × duration; score = dose × profile sensitivity
        ({prof.label}: ×{prof.vuln}) ÷ 3, capped at 100. A transparent estimate, not a medical measurement.
      </p>
    </CardSpotlight>
  );
}
