import { cn } from '../../lib/utils';

/*
 * Adapted from Aceternity UI — Aurora Background
 * (https://ui.aceternity.com/components/aurora-background)
 *
 * Adaptations for Vayu (plain Vite React, no "use client", no dark-mode demo
 * wrapper):
 *  - Rendered as an absolutely-positioned backdrop layer for the hero card
 *    instead of a full-page <main> wrapper, so it sits behind the AQI gauge.
 *  - The --aurora gradient is built from the live AQI category colour (the
 *    `color` prop) blended with soft sky/teal stops, so the live AQI tint
 *    stays dominant over the hero's own radial-gradient background.
 *  - The original's `invert` filter and mix-blend-difference ::after layer
 *    are dropped — they fight the AQI tint on a light card. A single animated
 *    layer (animate-aurora, keyframes in tailwind.config.js) is used.
 *  - Animation is pure CSS, so the global prefers-reduced-motion rule in
 *    index.css freezes it automatically.
 */
export const AuroraBackground = ({
  className,
  color = '#38bdf8',
  showRadialGradient = true,
}) => {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className={cn(
          'pointer-events-none absolute -inset-[10px] animate-aurora opacity-40 blur-[10px]',
          '[--white-gradient:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)]',
          '[background-image:var(--white-gradient),var(--aurora)]',
          '[background-size:300%,200%]',
          '[background-position:50%_50%,50%_50%]',
          showRadialGradient &&
            '[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]',
          className
        )}
        style={{
          '--aurora': `repeating-linear-gradient(100deg, ${color} 10%, #7dd3fc 16%, #5eead4 21%, #a5b4fc 26%, ${color} 32%)`,
        }}
      />
    </div>
  );
};

export default AuroraBackground;
