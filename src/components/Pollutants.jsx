import { motion } from 'framer-motion';
import { POLLUTANTS, categoryFor, fmt, subIndex } from '../lib/core';
import { SectionHeading } from './ui';
import { CardSpotlight } from './aceternity/card-spotlight';

export default function Pollutants({ values }) {
  if (!values) return null;
  return (
    <CardSpotlight>
      <SectionHeading
        kicker="Right now"
        title="Pollutant breakdown"
        sub="Bar length is scaled to each pollutant's US EPA sub-index, so the longest bar is what is driving the AQI. The tick marks the WHO 2021 guideline value."
      />
      {/* Data-list pattern (shadcn/ui table rows): hairline-divided rows,
          tabular right-aligned values — reads as an instrument panel. */}
      <div className="divide-y divide-line">
        {POLLUTANTS.map((p, i) => {
          const v = values[p.key];
          const si = subIndex(p.key, v);
          const cat = categoryFor(si);
          const pct = si === null ? 0 : Math.min(100, si / 5);
          const whoSi = subIndex(p.key, p.who24); // WHO value on the same sub-index scale as the bar
          const whoPct = whoSi === null ? 0 : Math.min(100, whoSi / 5);
          const ratio = v !== null && v !== undefined ? v / p.who24 : null;
          return (
            <div key={p.key} className="py-3.5 first:pt-0 last:pb-0">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="font-display text-sm font-bold text-ink">{p.name}</span>
                <span className="tnum text-[13px] text-inksoft">
                  <strong className="font-display text-ink">{fmt(v)}</strong> µg/m³
                  {ratio !== null && (
                    <span className={ratio > 1 ? 'ml-2 font-semibold text-[#c81e1e]' : 'ml-2 font-semibold text-[#047857]'}>
                      {ratio >= 1 ? `${ratio.toFixed(1)}× WHO limit` : 'within WHO limit'}
                    </span>
                  )}
                </span>
              </div>
              <div className="relative h-3 overflow-visible rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: cat ? cat.color : '#cbd5e1' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, delay: i * 0.07, ease: [0.22, 0.61, 0.36, 1] }}
                />
                <span
                  className="absolute -top-[3px] h-[18px] w-[2px] rounded bg-slate-500/70"
                  style={{ left: `${Math.min(98, whoPct)}%` }}
                  title={`WHO guideline: ${p.who24} µg/m³`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-inkfaint">
        WHO 2021 guideline values (24-h; O₃ 8-h, CO 24-h): PM2.5 15 · PM10 45 · NO₂ 25 · SO₂ 40 · O₃ 100 · CO 4000 µg/m³.
      </p>
    </CardSpotlight>
  );
}
