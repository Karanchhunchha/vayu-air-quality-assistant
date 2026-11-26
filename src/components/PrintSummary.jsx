import { fmt, fmtTime, healthAdvice, profileById } from '../lib/core';

/* One-page printable air report — hidden on screen, shown only in print
   (the "Share" flow lets judges/users save this as a PDF, no libraries). */
export default function PrintSummary({ summary, profile }) {
  if (!summary) return null;
  const s = summary;
  const advice = healthAdvice(s.aqi, profile);
  const prof = profileById(profile);
  const rows = [
    ['City', `${s.city.name}${s.city.admin1 ? ', ' + s.city.admin1 : ''}${s.city.country ? ', ' + s.city.country : ''}`],
    ['Hour', `${fmtTime(s.timeStr)} (${s.timezone})`],
    ['US AQI', `${fmt(s.aqi)} — ${s.cat ? s.cat.name : '—'}`],
    ['EU AQI', fmt(s.values.european_aqi)],
    ['India CPCB AQI', s.cpcb && s.cpcb.enough ? `${s.cpcb.aqi} — ${s.cpcb.cat.name}` : 'Not enough trailing data'],
    ['Dominant pollutant', s.dom ? `${s.dom.pollutant.name} (sub-index ${s.dom.si})` : '—'],
    ['PM2.5 / PM10', `${fmt(s.values.pm2_5)} / ${fmt(s.values.pm10)} µg/m³`],
    ['Cigarette equivalent', s.cig ? `≈ ${s.cig.cigs.toFixed(1)} cigarettes/day (24-h PM2.5 ${fmt(s.cig.mean)} µg/m³)` : '—'],
    ['Cleanest 2-hour window', s.cleanWindow ? `${fmtTime(s.cleanWindow.startTime, s.todayStr)} – ${fmtTime(s.cleanWindow.endTime, s.todayStr)} (avg AQI ${fmt(s.cleanWindow.avg)})` : '—'],
    ['Best hour outdoors (24 h)', s.best ? `${fmtTime(s.best.time, s.todayStr)} (AQI ≈ ${fmt(s.best.aqi)})` : '—'],
    ['Tomorrow\'s peak AQI', s.tomorrowMax !== null && s.tomorrowMax !== undefined ? fmt(s.tomorrowMax) : '—'],
  ];
  return (
    <div className="print-sheet" style={{ display: 'none' }}>
      <div style={{ fontFamily: 'Inter, Arial, sans-serif', color: '#1b2a35', maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 2px' }}>Vayu — Daily Air Report</h1>
        <p style={{ margin: '0 0 16px', color: '#43586a', fontSize: '13px' }}>
          Urban Air Quality Assistant · Guidance profile: {prof.label} · Data: Open-Meteo (CAMS)
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, width: '190px', verticalAlign: 'top' }}>{k}</td>
                <td style={{ padding: '7px 10px', borderBottom: '1px solid #e2e8f0' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 style={{ fontSize: '16px', margin: '18px 0 6px' }}>Health guidance</h2>
        <p style={{ fontSize: '13.5px', lineHeight: 1.55, margin: '0 0 4px' }}><strong>Mask:</strong> {advice.mask}</p>
        <p style={{ fontSize: '13.5px', lineHeight: 1.55, margin: '0 0 4px' }}><strong>Exercise:</strong> {advice.exercise}</p>
        <p style={{ fontSize: '13.5px', lineHeight: 1.55, margin: '0 0 4px' }}><strong>Ventilation:</strong> {advice.vent}</p>
        <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '16px' }}>
          Source insights are heuristics from the live pollutant mix, not official source apportionment. Health guidance is
          general information, not medical advice. CPCB AQI computed locally from trailing means using CPCB breakpoints.
          Built for Hack2Skill PromptWars — Challenge 6 · Team Vayu.
        </p>
      </div>
    </div>
  );
}
