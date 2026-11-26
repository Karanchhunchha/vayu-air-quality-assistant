import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES, CITIZEN_ACTIONS, GRAP_STAGES, categoryIndex, stageIdxFor } from '../lib/core';
import { SectionHeading } from './ui';
import { CardSpotlight } from './aceternity/card-spotlight';

export function Sources({ summary }) {
  if (!summary) return null;
  return (
    <CardSpotlight className="h-full">
      <SectionHeading
        kicker="Why is the air like this?"
        title="Pollution source insights"
        sub="Heuristic analysis of the live pollutant mix — an informed estimate, not a measured source apportionment."
      />
      <ul className="space-y-3">
        {summary.sources.map((s, i) => (
          <motion.li
            key={s.tag + summary.city.name}
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-2xl bg-mist/80 p-4 ring-1 ring-slate-900/5"
          >
            <span className="inline-block rounded-full bg-brand-soft px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-brand-deep">
              {s.tag}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-inksoft">{s.text}</p>
          </motion.li>
        ))}
      </ul>
    </CardSpotlight>
  );
}

export function ActionPlan({ summary }) {
  const ci = summary ? categoryIndex(summary.aqi) : 0;
  const active = stageIdxFor(ci);
  const [open, setOpen] = useState(null);
  const openIdx = open === null ? active : open;
  if (!summary) return null;
  return (
    <CardSpotlight className="h-full">
      <SectionHeading
        kicker="City response"
        title="City action plan"
        sub="GRAP-style staged interventions keyed to the live AQI category — the stage matching right now is highlighted."
      />
      <div className="space-y-2">
        {GRAP_STAGES.map((stage, i) => {
          const isActive = i === active;
          const isOpen = i === openIdx;
          const barColor = (CATEGORIES[Math.min(i + 1, 5)] || CATEGORIES[0]).color;
          return (
            <div
              key={stage.title}
              className={`overflow-hidden rounded-2xl ring-1 transition ${isActive ? 'bg-white ring-brand/30 shadow-card' : 'bg-mist/60 ring-slate-900/5'}`}
              style={{ borderLeft: `4px solid ${barColor}` }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="flex-1 font-display text-sm font-bold text-ink">{stage.title}</span>
                {isActive && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 ring-1 ring-red-200">
                    ● Active now
                  </span>
                )}
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-slate-400">▾</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                  >
                    <p className="px-4 pb-4 text-sm leading-relaxed text-inksoft">{stage.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <h4 className="mt-5 font-display text-sm font-bold text-ink">What you can do today</h4>
      <ul className="mt-2 space-y-1.5">
        {CITIZEN_ACTIONS[ci].map((a) => (
          <li key={a} className="flex gap-2 text-sm leading-relaxed text-inksoft">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            {a}
          </li>
        ))}
      </ul>
    </CardSpotlight>
  );
}
