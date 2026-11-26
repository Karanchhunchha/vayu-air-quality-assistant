import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PRESET_CITIES, categoryFor, categoryIndex, currentIndex, fetchAQ, fmt, fmtTime, geocode, profileById, summarize,
} from '../lib/core';
import { Card, SectionHeading } from './ui';

const CHIPS = [
  { label: 'AQI in Mumbai', q: 'What is the AQI in Mumbai?' },
  { label: 'Should I wear a mask?', q: 'Should I wear a mask today?' },
  { label: 'Safe to exercise?', q: 'Is it safe to exercise outdoors?' },
  { label: "Tomorrow's AQI", q: 'What will the AQI be tomorrow?' },
  { label: 'Best time to go out', q: 'When is the best time to go out?' },
  { label: 'When to open windows?', q: 'When should I open windows?' },
  { label: 'Compare Delhi vs Bengaluru', q: 'Compare Delhi and Bengaluru' },
  { label: 'Pollution sources', q: 'What is causing the pollution?' },
];

const GREETING = "Namaste! I'm Vayu, your air quality assistant. I answer from live Open-Meteo data — ask me about any city's AQI (US, EU or India's CPCB scale), tomorrow's forecast, masks, exercise, the best time to go out, or compare two cities.";

export default function Chat({ currentSummary, profile, guidance }) {
  const [messages, setMessages] = useState([{ who: 'bot', text: GREETING }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy]);

  async function summaryFor(city) {
    if (currentSummary && city.name === currentSummary.city.name && city.lat === currentSummary.city.lat) {
      return currentSummary;
    }
    const key = city.lat.toFixed(3) + ',' + city.lon.toFixed(3);
    if (cacheRef.current.has(key)) return cacheRef.current.get(key);
    const data = await fetchAQ(city);
    const s = summarize(data, currentIndex(data), city);
    cacheRef.current.set(key, s);
    return s;
  }

  function findPresetCitiesIn(text) {
    const lower = ' ' + text.toLowerCase() + ' ';
    return PRESET_CITIES.filter((c) => lower.includes(c.name.toLowerCase()));
  }

  async function resolveChatCity(text) {
    const found = findPresetCitiesIn(text);
    if (found.length) return found[0];
    const m = text.match(/\b(?:in|for|at)\s+([a-zA-Z][a-zA-Z\s]{1,30}?)(?:\s+tomorrow|\s+today|\?|$)/i);
    if (m) {
      const q = m[1].trim();
      if (q && !/^(the|a|an)$/.test(q)) {
        try {
          const r = await geocode(q);
          if (r.length) return { name: r[0].name, admin1: r[0].admin1 || '', country: r[0].country || '', lat: r[0].latitude, lon: r[0].longitude };
        } catch { /* fall through */ }
      }
    }
    return currentSummary ? currentSummary.city : PRESET_CITIES[0];
  }

  async function answer(raw) {
    const text = raw.trim();
    if (!text || busy) return;
    const lower = text.toLowerCase();
    setMessages((m) => [...m, { who: 'user', text }]);
    setBusy(true);
    const bot = (t) => setMessages((m) => [...m, { who: 'bot', text: t }]);
    try {
      // Compare intent (needs two cities)
      if (/compar|vs\.?|versus|better than|worse than/.test(lower)) {
        const cities = findPresetCitiesIn(lower);
        if (cities.length >= 2) {
          const [a, b] = [await summaryFor(cities[0]), await summaryFor(cities[1])];
          const cleaner = a.aqi <= b.aqi ? a : b;
          bot(`Live comparison:\n• ${a.city.name}: AQI ${fmt(a.aqi)} (${a.cat ? a.cat.name : '—'}), dominant pollutant ${a.dom ? a.dom.pollutant.plain : '—'}.\n• ${b.city.name}: AQI ${fmt(b.aqi)} (${b.cat ? b.cat.name : '—'}), dominant pollutant ${b.dom ? b.dom.pollutant.plain : '—'}.\n${cleaner.city.name} has cleaner air right now.`);
          return;
        }
      }

      const city = await resolveChatCity(text);
      let s;
      try { s = await summaryFor(city); } catch {
        bot(`Sorry, I couldn't fetch live data for ${city.name} right now. Check your connection and try again.`);
        return;
      }
      const where = s.city.name;
      const profLabel = profileById(profile).label.toLowerCase();
      const cpcbBit = s.cpcb && s.cpcb.enough ? ` On India's CPCB scale it is ${s.cpcb.aqi} (${s.cpcb.cat.name}).` : '';
      const cigBit = s.cig ? ` Breathing today's air here is like smoking about ${s.cig.cigs.toFixed(1)} cigarettes a day (24-h PM2.5 ${fmt(s.cig.mean)} µg/m³, Berkeley Earth rule).` : '';

      if (/mask/.test(lower)) {
        const ci = categoryIndex(s.aqi);
        const advice = ci <= 1 ? "you generally don't need a mask" : ci === 2 ? 'sensitive people should wear an N95/KN95, and others should consider one for long outdoor exposure' : "wear a well-fitting N95/KN95 — cloth masks don't filter PM2.5 well";
        bot(`In ${where} the AQI is ${fmt(s.aqi)} (${s.cat ? s.cat.name : '—'}). For a ${profLabel}, ${advice}.`);
      } else if (/cigarette|smok/.test(lower)) {
        bot(s.cig
          ? `In ${where}, the trailing 24-hour PM2.5 average is ${fmt(s.cig.mean)} µg/m³. By the Berkeley Earth rule (24 h at 22 µg/m³ ≈ 1 cigarette), breathing today's air is like smoking ≈ ${s.cig.cigs.toFixed(1)} cigarettes a day.`
          : `I don't have enough PM2.5 history for ${where} to estimate a cigarette equivalent right now.`);
      } else if (/ventil|window|fresh air/.test(lower)) {
        bot(s.cleanWindow
          ? `For ${where}, open windows during today's cleanest window: ${fmtTime(s.cleanWindow.startTime, s.todayStr)} – ${fmtTime(s.cleanWindow.endTime, s.todayStr)}, when AQI averages about ${fmt(s.cleanWindow.avg)} (${categoryFor(s.cleanWindow.avg)?.name || '—'}). Avoid the worst window, ${fmtTime(s.worstWindow.startTime, s.todayStr)} – ${fmtTime(s.worstWindow.endTime, s.todayStr)} (avg ${fmt(s.worstWindow.avg)}).`
          : `Forecast data for ventilation windows is unavailable for ${where} right now.`);
      } else if (/exercise|run|jog|gym|cycle|walk|play|outdoor|sport/.test(lower)) {
        const ci = categoryIndex(s.aqi);
        const advice = ci <= 1 ? 'Outdoor exercise is fine.' : ci === 2 ? 'Light outdoor exercise is OK, but reduce prolonged or heavy exertion — or move it indoors if you are sensitive.' : 'It is better to exercise indoors today.';
        bot(`${where} AQI is ${fmt(s.aqi)} (${s.cat ? s.cat.name : '—'}). ${advice}${s.best ? ` The cleanest time to be outdoors in the next 24 hours is around ${fmtTime(s.best.time, s.todayStr)} (AQI about ${fmt(s.best.aqi)}).` : ''}`);
      } else if (/best time|when.*(go out|outside|step out|safe)|safest/.test(lower)) {
        bot(s.best ? `For ${where}, the best time to go out in the next 24 hours is around ${fmtTime(s.best.time, s.todayStr)}, when AQI is expected to drop to about ${fmt(s.best.aqi)} (${categoryFor(s.best.aqi)?.name || '—'}). Right now it is ${fmt(s.aqi)}.` : `Forecast data is unavailable for ${where} right now.`);
      } else if (/tomorrow/.test(lower)) {
        bot(s.tomorrowMax !== null && s.tomorrowMax !== undefined
          ? `Tomorrow in ${where}, the AQI is forecast to peak at about ${fmt(s.tomorrowMax)} (${categoryFor(s.tomorrowMax)?.name || '—'}). Right now it is ${fmt(s.aqi)}. Plan outdoor activities for the cleanest hours and check back in the morning.`
          : `I don't have tomorrow's forecast for ${where} right now.`);
      } else if (/source|caus|why|reason|responsible/.test(lower)) {
        const lines = s.sources.map((x) => `• ${x.tag}: ${x.text}`).join('\n');
        bot(`Likely pollution sources in ${where} today (heuristic analysis of the live pollutant mix):\n${lines}`);
      } else if (/tip|advice|protect|health|safe|precaution/.test(lower)) {
        bot(guidance
          ? `Health tips for ${where} (AQI ${fmt(s.aqi)}, ${s.cat ? s.cat.name : '—'}) for a ${profLabel}:\n• ${guidance.mask}\n• ${guidance.exercise}\n• ${guidance.vent}\nNote: the detailed tips use the guidance panel's current profile; the AQI figures are for ${where}.`
          : `Health tips for ${where}: ${s.cat ? s.cat.advice : 'Live guidance is unavailable right now.'}`);
      } else {
        bot(`Right now in ${where}: US AQI ${fmt(s.aqi)} — ${s.cat ? s.cat.name : '—'}.${cpcbBit} Dominant pollutant: ${s.dom ? `${s.dom.pollutant.plain} (sub-index ${s.dom.si})` : '—'}. PM2.5 is ${fmt(s.values.pm2_5)} µg/m³ and PM10 is ${fmt(s.values.pm10)} µg/m³.${cigBit} ${s.cat ? s.cat.advice : ''}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionHeading
        kicker="Conversational assistant"
        title="Ask the Air Quality Assistant"
        sub="A rule-based assistant that answers from the same live Open-Meteo data shown above. Try asking about another city, tomorrow, masks, exercise, windows, cigarettes — or compare two cities."
      />
      <div className="mb-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => answer(c.q)}
            className="rounded-full bg-mist px-3 py-2 text-[13px] font-medium text-inksoft ring-1 ring-slate-200 transition hover:bg-brand-soft hover:text-brand-deep hover:ring-brand/30"
          >
            {c.label}
          </button>
        ))}
      </div>
      <div ref={logRef} className="chat-scroll h-72 space-y-2.5 overflow-y-auto rounded-2xl bg-surface/70 p-4 ring-1 ring-slate-900/5" aria-live="polite">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.who === 'user'
                ? 'ml-auto rounded-br-md bg-brand text-white'
                : 'mr-auto rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-slate-900/5'
            }`}
          >
            {m.text}
          </motion.div>
        ))}
        {busy && (
          <div className="mr-auto flex gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-900/5">
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="h-1.5 w-1.5 rounded-full bg-brand"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
              />
            ))}
          </div>
        )}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); const v = input; setInput(''); answer(v); }}
      >
        <label htmlFor="chatInput" className="sr-only">Ask the air quality assistant a question</label>
        <input
          id="chatInput"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any city… e.g. 'AQI in Pune tomorrow'"
          autoComplete="off"
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        <button type="submit" className="rounded-2xl bg-ink px-5 py-3 font-display text-sm font-bold text-white transition hover:bg-brand-deep">
          Send
        </button>
      </form>
    </Card>
  );
}
