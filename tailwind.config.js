/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#1b2a35',
        inksoft: '#43586a',
        mist: '#f4f8fa',
        brand: {
          DEFAULT: '#0e7c86',
          deep: '#0a5c64',
          soft: '#e3f2f3',
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
