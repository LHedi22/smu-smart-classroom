/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00c49a',
          dark:    '#009e7a',
          light:   '#33d4b0',
        },
        surface: {
          DEFAULT: '#0b1428',
          deep:    '#05091a',
          raised:  '#111e35',
          border:  '#1e3050',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
