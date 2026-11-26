import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PRESET_CITIES, currentIndex, fetchAQ, fetchTickerAQI, fmt, healthAdvice, summarize,
} from './lib/core';
import Header from './components/Header';
import CityPicker from './components/CityPicker';
import Hero from './components/Hero';
import Pollutants from './components/Pollutants';
import Forecast from './components/Forecast';
import Health from './components/Health';
import Planner from './components/Planner';
import { ActionPlan, Sources } from './components/Insights';
import Chat from './components/Chat';
import EcoGame from './components/EcoGame';
import PrintSummary from './components/PrintSummary';
import { Card, Reveal } from './components/ui';

export default function App() {
  const [city, setCity] = useState(PRESET_CITIES[0]);
  const [data, setData] = useState(null);
  const [curIdx, setCurIdx] = useState(0);
  const [profile, setProfile] = useState('general');
  const [status, setStatusState] = useState({ text: 'Loading live data for Delhi…', error: false });
  const [ticker, setTicker] = useState([]);
  const reqRef = useRef(0);

  const setStatus = useCallback((text, error = false) => setStatusState({ text, error }), []);

  const loadCity = useCallback(async (c) => {
    const req = ++reqRef.current;
    setCity(c);
    setStatus(`Loading live data for ${c.name}…`);
    try {
      const d = await fetchAQ(c);
      if (req !== reqRef.current) return;
      const idx = currentIndex(d);
      setData(d);
      setCurIdx(idx);
      const s = summarize(d, idx, c);
      setStatus(`Live data loaded for ${c.name} — current US AQI ${fmt(s.aqi)} (${s.cat ? s.cat.name : '—'})${s.cpcb && s.cpcb.enough ? ` · India CPCB ${s.cpcb.aqi} (${s.cpcb.cat.name})` : ''}. Source: Open-Meteo (CAMS).`);
    } catch {
      if (req !== reqRef.current) return;
      setStatus(`Could not load data for ${c.name}. Check your internet connection and try again.`, true);
    }
  }, [setStatus]);

  useEffect(() => { loadCity(PRESET_CITIES[0]); }, [loadCity]);

  useEffect(() => {
    let alive = true;
    Promise.allSettled(PRESET_CITIES.map((c) => fetchTickerAQI(c))).then((rs) => {
      if (!alive) return;
      setTicker(rs.filter((r) => r.status === 'fulfilled').map((r) => r.value));
    });
    return () => { alive = false; };
  }, []);

  const summary = useMemo(() => (data ? summarize(data, curIdx, city) : null), [data, curIdx, city]);
  const guidance = useMemo(
    () => (summary ? healthAdvice(summary.aqi, profile) : null),
    [summary, profile]
  );

  const handlePersona = useCallback((p) => {
    setProfile(p.profile);
    const c = PRESET_CITIES.find((x) => x.name === p.cityName) || PRESET_CITIES[0];
    loadCity(c);
  }, [loadCity]);

  return (
    <div className="min-h-screen">
      <Header ticker={ticker} />
      <main className="print-hidden mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6 sm:px-6">
        <Reveal>
          <Card>
            <CityPicker city={city} onCity={loadCity} onPersona={handlePersona} status={status} setStatus={setStatus} />
          </Card>
        </Reveal>

        {summary ? (
          <>
            <Reveal>
              <Hero summary={summary} />
            </Reveal>
            <Reveal>
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <Forecast data={data} curIdx={curIdx} summary={summary} />
                </div>
                <div className="lg:col-span-2">
                  <Pollutants values={summary.values} />
                </div>
              </div>
            </Reveal>
            <Reveal>
              <Health summary={summary} profile={profile} setProfile={setProfile} />
            </Reveal>
            <Reveal>
              <Planner data={data} curIdx={curIdx} summary={summary} profile={profile} />
            </Reveal>
            <Reveal>
              <div className="grid gap-6 lg:grid-cols-2">
                <Sources summary={summary} />
                <ActionPlan summary={summary} />
              </div>
            </Reveal>
            <Reveal>
              <Chat currentSummary={summary} profile={profile} guidance={guidance} />
            </Reveal>
            <Reveal>
              <EcoGame />
            </Reveal>
          </>
        ) : (
          <Card>
            <div className="flex items-center gap-3 py-8 text-inksoft">
              <span className="h-3 w-3 animate-ping rounded-full bg-brand" />
              <p className="font-display font-semibold">Fetching live air-quality data…</p>
            </div>
          </Card>
        )}

        <footer className="px-2 pb-2 pt-4 text-center text-[13px] leading-relaxed text-inkfaint">
          <p>
            Data: <a className="font-medium text-brand underline-offset-2 hover:underline" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>{' '}
            Air Quality API (CAMS atmosphere data) &amp; Geocoding API — free, no key required. CPCB AQI is computed locally
            from trailing 24-h / 8-h means using CPCB breakpoints. Source insights are heuristics from the live pollutant mix,
            not official source apportionment. Health guidance is general information, not medical advice.
          </p>
          <p className="mt-1.5 font-medium text-inksoft">
            Vayu — built for Hack2Skill PromptWars, Challenge 6: Urban Air Quality Assistant · Team Vayu
          </p>
        </footer>
      </main>
      <PrintSummary summary={summary} profile={profile} />
    </div>
  );
}
