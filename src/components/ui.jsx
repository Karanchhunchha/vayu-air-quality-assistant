import { motion, useReducedMotion } from 'framer-motion';

/* Scroll-reveal wrapper: sections fade/slide in as they enter the viewport */
export function Reveal({ children, delay = 0, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ kicker, title, sub }) {
  return (
    <div className="mb-5">
      {kicker && (
        <p className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
          <span className="h-[2px] w-5 rounded-full bg-brand" aria-hidden="true" />
          {kicker}
        </p>
      )}
      {/* h2: the hero city name is the page h1 (impeccable audit — heading hierarchy) */}
      <h2 className="mt-1.5 font-display text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      {sub && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-inksoft">{sub}</p>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <section className={`rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-900/5 sm:p-7 ${className}`}>
      {children}
    </section>
  );
}

/* Small wind-swash logo mark */
export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#0e7c86" />
      <path d="M10 19h17.5a5.25 5.25 0 1 0-5.25-5.25" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M7 27h23.5a5.25 5.25 0 1 1-5.25 5.25" stroke="#bfe6ea" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M13 35h11" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}
