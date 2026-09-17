/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scp: {
          bg: '#0b0e14',
          surface: '#121722',
          card: '#181f2e',
          cardHover: '#202a3e',
          border: '#2a364f',
          red: '#dc2626',
          amber: '#f59e0b',
          green: '#10b981',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          purple: '#a855f7',
          text: '#f1f5f9',
          muted: '#94a3b8'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Consolas', 'Menlo', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
