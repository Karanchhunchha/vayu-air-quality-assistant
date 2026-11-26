import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { PRESET_CITIES, currentIndex, fetchAQ, geocode, summarize } from "../lib/core";
import {
  CHAT_CHIPS,
  CHAT_GREETING,
  compareReply,
  extractCityQuery,
  findPresetCitiesIn,
  intentFor,
  replyFor,
} from "../lib/chat";
import { Card, SectionHeading } from "./ui";

export default function Chat({ currentSummary, profile, guidance }) {
  const [messages, setMessages] = useState([{ who: "bot", text: CHAT_GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, busy]);

  async function summaryFor(city) {
    if (
      currentSummary &&
      city.name === currentSummary.city.name &&
      city.lat === currentSummary.city.lat
    ) {
      return currentSummary;
    }
    const key = city.lat.toFixed(3) + "," + city.lon.toFixed(3);
    if (cacheRef.current.has(key)) return cacheRef.current.get(key);
    const data = await fetchAQ(city);
    const s = summarize(data, currentIndex(data), city);
    cacheRef.current.set(key, s);
    return s;
  }

  async function resolveChatCity(text) {
    const found = findPresetCitiesIn(text);
    if (found.length) return found[0];
    const q = extractCityQuery(text);
    if (q) {
      try {
        const r = await geocode(q);
        if (r.length)
          return {
            name: r[0].name,
            admin1: r[0].admin1 || "",
            country: r[0].country || "",
            lat: r[0].latitude,
            lon: r[0].longitude,
          };
      } catch {
        /* fall through to the current city */
      }
    }
    return currentSummary ? currentSummary.city : PRESET_CITIES[0];
  }

  async function answer(raw) {
    const text = raw.trim();
    if (!text || busy) return;
    const lower = text.toLowerCase();
    setMessages((m) => [...m, { who: "user", text }]);
    setBusy(true);
    const bot = (t) => setMessages((m) => [...m, { who: "bot", text: t }]);
    try {
      const intent = intentFor(lower);

      // Compare intent (needs two cities)
      if (intent === "compare") {
        const cities = findPresetCitiesIn(lower);
        if (cities.length >= 2) {
          const [a, b] = [await summaryFor(cities[0]), await summaryFor(cities[1])];
          bot(compareReply(a, b));
          return;
        }
      }

      const city = await resolveChatCity(text);
      let s;
      try {
        s = await summaryFor(city);
      } catch {
        bot(
          `Sorry, I couldn't fetch live data for ${city.name} right now. Check your connection and try again.`,
        );
        return;
      }
      bot(replyFor(intent, s, { profileId: profile, guidance }));
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
        {CHAT_CHIPS.map((c) => (
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
      <div
        ref={logRef}
        className="chat-scroll h-72 space-y-2.5 overflow-y-auto rounded-2xl bg-surface/70 p-4 ring-1 ring-slate-900/5"
        aria-live="polite"
        aria-label="Conversation with the assistant"
      >
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.who === "user"
                ? "ml-auto rounded-br-md bg-brand text-white"
                : "mr-auto rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-slate-900/5"
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
        onSubmit={(e) => {
          e.preventDefault();
          const v = input;
          setInput("");
          answer(v);
        }}
      >
        <label htmlFor="chatInput" className="sr-only">
          Ask the air quality assistant a question
        </label>
        <input
          id="chatInput"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any city… e.g. 'AQI in Pune tomorrow'"
          autoComplete="off"
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        <button
          type="submit"
          className="rounded-2xl bg-ink px-5 py-3 font-display text-sm font-bold text-white transition hover:bg-brand-deep"
        >
          Send
        </button>
      </form>
    </Card>
  );
}

Chat.propTypes = {
  /** Summary view-model for the currently displayed city (core.summarize). */
  currentSummary: PropTypes.object,
  /** Active guidance profile id (see core.PROFILES). */
  profile: PropTypes.string.isRequired,
  /** Guidance panel output (core.healthAdvice) for the tips intent. */
  guidance: PropTypes.object,
};
