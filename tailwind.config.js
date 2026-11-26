/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        /* Design direction v2: Lexend display (ui-ux-pro-max "Corporate Trust"
           pairing — readability-first, civic/health register) + Inter body. */
        display: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#16303c',
        inksoft: '#3f5a6a',
        /* Muted text that still meets WCAG AA (>=4.5:1 on white and mist) */
        inkfaint: '#5d7182',
        mist: '#f4f8fa',
        /* Recessed panel fill (chat log, tiles) */
        surface: '#eaf2f5',
        /* Hairline borders / structural dividers */
        line: '#dce8ec',
        brand: {
          DEFAULT: '#0e7c86',
          deep: '#0a5c64',
          soft: '#e3f2f3',
          /* Data ink: chart line, emphasised figures */
          strong: '#0b7285',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(21, 48, 63, 0.05), 0 12px 32px -12px rgba(21, 48, 63, 0.14)',
        lift: '0 2px 4px rgba(21, 48, 63, 0.06), 0 20px 44px -16px rgba(21, 48, 63, 0.22)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      /* Aceternity UI — Aurora Background animation */
      animation: {
        aurora: 'aurora 60s linear infinite',
      },
      keyframes: {
        aurora: {
          from: { backgroundPosition: '50% 50%, 50% 50%' },
          to: { backgroundPosition: '350% 50%, 350% 50%' },
        },
      },
    },
  },
  plugins: [],
};
