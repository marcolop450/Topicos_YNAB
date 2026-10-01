/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ynab: {
          blue: {
            DEFAULT: '#1b3a6b',
            light: '#255494',
            dark: '#102444',
          },
          green: {
            DEFAULT: '#059669',
            light: '#d1fae5',
            dark: '#047857',
          },
          red: {
            DEFAULT: '#dc2626',
            light: '#fee2e2',
            dark: '#b91c1c',
          },
          yellow: {
            DEFAULT: '#d97706',
            light: '#fef3c7',
            dark: '#b45309',
          },
        }
      }
    },
  },
  plugins: [],
}
