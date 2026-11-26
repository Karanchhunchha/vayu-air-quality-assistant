import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
  MONTHS,
  addDays,
  categoryFor,
  dayName,
  daySummaries,
  fmt,
  fmtTime,
  num,
} from "../lib/core";
import { Card, SectionHeading } from "./ui";

function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function useMeasure() {
  const ref = useRef(null);
  const [w, setW] = useState(720);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0].contentRect.width;
      if (cw > 0) setW(cw);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const BANDS = [
  [0, 50],
  [50, 100],
  [100, 150],
  [150, 200],
  [200, 300],
  [300, 500],
];

export default function Forecast({ data, curIdx, summary }) {
  const [wrapRef, width] = useMeasure();
  if (!data || !summary) return null;
  const H = data.hourly;
  const raw = [];
  for (let i = curIdx; i < Math.min(curIdx + 72, H.time.length); i++) {
    raw.push({ t: H.time[i], v: num(H.us_aqi[i]) });
  }
  const valid = raw.filter((p) => p.v !== null);
  if (!valid.length) return null;

  const h = 232,
    padL = 36,
    padR = 12,
    padT = 12,
    padB = 28;
  const iw = Math.max(200, width - padL - padR);
  const ih = h - padT - padB;
  const maxV = Math.max(...valid.map((p) => p.v), 120);
  const yMax = Math.min(500, Math.ceil(maxV / 100) * 100);
  const X = (i) => padL + (i / (raw.length - 1)) * iw;
  const Y = (v) => padT + ih - (v / yMax) * ih;
  const pts = [];
  raw.forEach((p, i) => {
    if (p.v !== null) pts.push({ x: X(i), y: Y(p.v), v: p.v, i });
  });
  const line = smoothPath(pts);
  const area =
    pts.length > 1
      ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${Y(0)} L ${pts[0].x.toFixed(1)} ${Y(0)} Z`
      : "";
  const days = daySummaries(data, curIdx);
  const todayStr = summary.todayStr;
  const chartKey = summary.city.name + "|" + raw[0].t;

  return (
    <Card>
      <SectionHeading
        kicker="Hyperlocal forecast"
        title="Next 72 hours, hour by hour"
        sub="Modelled hourly US AQI from Open-Meteo (CAMS). Bands show the US EPA health categories."
      />
      <div ref={wrapRef} className="w-full">
        <svg
          viewBox={`0 0 ${width} ${h}`}
          width={width}
          height={h}
          className="block w-full"
          role="img"
          aria-label={`Hourly US AQI forecast chart for ${summary.city.name}, next 72 hours`}
        >
          {BANDS.map(([lo, hi]) => {
            if (lo >= yMax) return null;
            const cat = categoryFor(lo + 1);
            return (
              <rect
                key={lo}
                x={padL}
                y={Y(Math.min(hi, yMax))}
                width={iw}
                height={Y(lo) - Y(Math.min(hi, yMax))}
                fill={cat ? cat.color : "#ccc"}
                opacity="0.10"
              />
            );
          })}
          {[0, 100, 200, 300, 400, 500]
            .filter((g) => g <= yMax)
            .map((g) => (
              <g key={g}>
                <line
                  x1={padL}
                  x2={padL + iw}
                  y1={Y(g)}
                  y2={Y(g)}
                  stroke="#dde6ec"
                  strokeWidth="1"
                />
                <text
                  x={8}
                  y={Y(g) + 4}
                  fontSize="11"
                  fill="#5d7182"
                  fontFamily="Inter, sans-serif"
                >
                  {g}
                </text>
              </g>
            ))}
          {/* Chart colours are the brand / brand-strong design tokens
              (#0e7c86 / #0b7285 in tailwind.config.js), as SVG attributes. */}
          {area && (
            <motion.path
              key={"a" + chartKey}
              d={area}
              fill="#0e7c86"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.09 }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          )}
          {line && (
            <motion.path
              key={"l" + chartKey}
              d={line}
              fill="none"
              stroke="#0b7285"
              strokeWidth="2.4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          )}
          {pts
            .filter((p) => p.i % 3 === 0)
            .map((p) => {
              const cat = categoryFor(p.v);
              return (
                <circle
                  key={p.i}
                  cx={p.x}
                  cy={p.y}
                  r="3.2"
                  fill={cat ? cat.color : "#999"}
                  stroke="#fff"
                  strokeWidth="1.2"
                />
              );
            })}
          {raw.map((p, i) => {
            if (i % 12 !== 0) return null;
            const d = p.t.slice(0, 10);
            const label = `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${p.t.slice(11, 16)}`;
            return (
              <text
                key={i}
                x={Math.min(X(i), width - 76)}
                y={h - 8}
                fontSize="11"
                fill="#5d7182"
                fontFamily="Inter, sans-serif"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {days.map((d, i) => {
          const cat = categoryFor(d.max);
          const label =
            d.date === todayStr
              ? "Today"
              : d.date === addDays(todayStr, 1)
                ? "Tomorrow"
                : dayName(d.date);
          return (
            <motion.div
              key={d.date}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="rounded-2xl bg-mist/80 p-3.5 ring-1 ring-slate-900/5"
              style={{ borderTop: `3px solid ${cat ? cat.color : "#cbd5e1"}` }}
            >
              <p className="text-[13px] font-semibold text-inksoft">
                {label} · {Number(d.date.slice(8, 10))} {MONTHS[Number(d.date.slice(5, 7)) - 1]}
              </p>
              <p className="tnum mt-1 font-display text-xl font-bold text-ink">Max {fmt(d.max)}</p>
              <p
                className="text-[13px] font-semibold"
                style={{ color: cat ? cat.text : "#5d7182" }}
              >
                {cat ? cat.name : "—"}
              </p>
              <p className="tnum mt-0.5 text-xs text-inkfaint">Cleanest hour AQI {fmt(d.min)}</p>
            </motion.div>
          );
        })}
      </div>

      {(summary.cleanWindow || summary.worstWindow) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {summary.cleanWindow && (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-600/15">
              <span className="text-xl" aria-hidden="true">
                🌿
              </span>
              <div>
                <p className="font-display text-sm font-bold text-emerald-900">
                  Cleanest 2-hour window
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-emerald-900/80">
                  {fmtTime(summary.cleanWindow.startTime, todayStr)} –{" "}
                  {fmtTime(summary.cleanWindow.endTime, todayStr)} · avg AQI{" "}
                  <strong>{fmt(summary.cleanWindow.avg)}</strong> (
                  {categoryFor(summary.cleanWindow.avg)?.name})
                </p>
              </div>
            </div>
          )}
          {summary.worstWindow && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-600/15">
              <span className="text-xl" aria-hidden="true">
                ⚠️
              </span>
              <div>
                <p className="font-display text-sm font-bold text-red-900">Worst 2-hour window</p>
                <p className="mt-0.5 text-sm leading-relaxed text-red-900/80">
                  {fmtTime(summary.worstWindow.startTime, todayStr)} –{" "}
                  {fmtTime(summary.worstWindow.endTime, todayStr)} · avg AQI{" "}
                  <strong>{fmt(summary.worstWindow.avg)}</strong> (
                  {categoryFor(summary.worstWindow.avg)?.name})
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

Forecast.propTypes = {
  /** Raw air-quality API payload (core.fetchAQ). */
  data: PropTypes.object,
  /** Index of the current hour inside data.hourly. */
  curIdx: PropTypes.number.isRequired,
  /** Summary view-model for the current city (core.summarize). */
  summary: PropTypes.object,
};
