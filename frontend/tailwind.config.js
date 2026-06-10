/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        quest: {
          bg:      '#0b0b18',
          surface: '#13132a',
          card:    '#1a1a35',
          border:  '#2a2a55',
          gold:    '#f5c542',
          purple:  '#8b5cf6',
          green:   '#22c55e',
          red:     '#ef4444',
          muted:   '#6b7280',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
