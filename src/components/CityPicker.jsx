import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRESET_CITIES, PERSONAS, geocode } from '../lib/core';

export default function CityPicker({ city, onCity, onPersona, status, setStatus }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setResults(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  async function doSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const r = await geocode(q);
      if (!r.length) {
        setStatus(`No city found for "${q}". Try another spelling.`, true);
        setResults(null);
      } else {
        setResults(r);
      }
    } catch {
      setStatus('Search failed. Check your connection and try again.', true);
    } finally {
      setSearching(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) { setStatus('Geolocation is not supported by this browser.', true); return; }
    setStatus('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => onCity({
        name: 'Your location',
        admin1: pos.coords.latitude.toFixed(2) + ', ' + pos.coords.longitude.toFixed(2),
        country: '', lat: pos.coords.latitude, lon: pos.coords.longitude,
      }),
      () => setStatus('Location access was denied. You can still search for your city above.', true),
      { timeout: 10000 }
    );
  }

  return (
    <div>
      <div ref={boxRef} className="relative">
        <label htmlFor="citySearch" className="text-sm font-semibold text-ink">
          Search any city in the world
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
            <input
              id="citySearch"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } }}
              placeholder="e.g. Surat, Jaipur, London…"
              autoComplete="off"
              className="w-full rounded-2xl border border-slate-200 bg-mist/60 py-3 pl-10 pr-4 text-[15px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={doSearch}
              disabled={searching}
              className="flex-1 rounded-2xl bg-brand px-5 py-3 font-display text-sm font-bold text-white shadow-sm transition hover:bg-brand-deep disabled:opacity-60 sm:flex-none"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
            <button
              type="button"
              onClick={locate}
              className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-brand-deep ring-1 ring-brand/30 transition hover:bg-brand-soft sm:flex-none"
            >
              📍 My location
            </button>
          </div>
        </div>
        <AnimatePresence>
          {results && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-slate-900/10"
            >
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="block w-full px-4 py-2.5 text-left text-sm text-ink transition hover:bg-brand-soft/60"
                    onClick={() => {
                      setResults(null);
                      onCity({ name: r.name, admin1: r.admin1 || '', country: r.country || '', lat: r.latitude, lon: r.longitude });
                    }}
                  >
                    <span className="font-semibold">{r.name}</span>
                    <span className="text-inksoft">{r.admin1 ? `, ${r.admin1}` : ''}{r.country ? `, ${r.country}` : ''}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Popular Indian cities">
        {PRESET_CITIES.map((c) => {
          const active = city && city.name === c.name && city.lat === c.lat;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => onCity(c)}
              className={`rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                active
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-mist text-inksoft ring-1 ring-slate-200 hover:bg-brand-soft hover:text-brand-deep hover:ring-brand/30'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-inkfaint">
          Try a persona — one click sets city + profile
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPersona(p)}
              className="group rounded-2xl bg-white px-3.5 py-2 text-left ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-card hover:ring-brand/40"
            >
              <span className="text-sm font-semibold text-ink">{p.icon} {p.label}</span>
              <span className="block text-[11px] text-inksoft">{p.detail}</span>
            </button>
          ))}
        </div>
      </div>

      <p role="status" className={`mt-4 text-sm ${status.error ? 'font-medium text-red-600' : 'text-inksoft'}`}>
        {status.text}
      </p>
    </div>
  );
}
