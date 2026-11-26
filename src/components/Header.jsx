import PropTypes from "prop-types";
import { categoryFor, fmt } from "../lib/core";
import { LogoMark } from "./ui";

export default function Header({ ticker }) {
  const items = ticker && ticker.length ? ticker : [];
  const doubled = [...items, ...items];
  return (
    <header className="print-hidden sticky top-0 z-40">
      <div className="border-b border-white/40 bg-white/75 shadow-[0_8px_30px_-18px_rgba(21,48,63,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <LogoMark size={42} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold leading-tight text-ink sm:text-xl">
              Vayu{" "}
              <span className="hidden font-semibold text-inksoft sm:inline">
                — Urban Air Quality Assistant
              </span>
            </p>
            <p className="truncate text-xs text-inksoft sm:text-[13px]">
              Live AQI · 72-hour forecasts · Personalised health guidance
            </p>
          </div>
          <span className="hidden shrink-0 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-deep ring-1 ring-brand/20 md:block">
            PromptWars · Challenge 6
          </span>
        </div>
        {items.length > 0 && (
          <div
            className="relative overflow-hidden border-t border-slate-900/5 bg-white/50"
            role="region"
            aria-label="Live AQI across Indian cities"
          >
            <div className="marquee-track flex w-max items-center gap-8 px-4 py-1.5">
              {doubled.map((t, i) => {
                const cat = categoryFor(t.aqi);
                return (
                  /* The marquee renders the list twice for a seamless loop;
                     the second copy is hidden from assistive tech. */
                  <span
                    key={i}
                    aria-hidden={i >= items.length}
                    className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-inksoft"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: cat ? cat.color : "#cbd5e1" }}
                    />
                    {t.city.name}
                    <strong className="tnum font-display text-ink">{fmt(t.aqi)}</strong>
                    <span style={{ color: cat ? cat.text : "#5d7182" }}>{cat ? cat.name : ""}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

Header.propTypes = {
  /** Ticker entries from core.fetchTickerAQI: one per preset city. */
  ticker: PropTypes.arrayOf(
    PropTypes.shape({
      city: PropTypes.shape({ name: PropTypes.string }).isRequired,
      aqi: PropTypes.number,
    }),
  ),
};
