/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ynab: {
          blue: {
            DEFAULT: '#1c4482',
            light: '#2d68c4',
            dark: '#143160',
          },
          green: {
            DEFAULT: '#16a34a',
            light: '#dcfce7',
            dark: '#15803d',
          },
          red: {
            DEFAULT: '#dc2626',
            light: '#fee2e2',
            dark: '#b91c1c',
          },
          yellow: {
            DEFAULT: '#ca8a04',
            light: '#fef9c3',
            dark: '#a16207',
          },
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            600: '#475569',
            800: '#1e293b',
            900: '#0f172a',
          }
        }
      }
    },
  },
  plugins: [],
}
