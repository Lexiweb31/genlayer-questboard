/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        q: {
          bg:      'rgb(var(--q-bg) / <alpha-value>)',
          sidebar: 'rgb(var(--q-sidebar) / <alpha-value>)',
          surface: 'rgb(var(--q-surface) / <alpha-value>)',
          card:    'rgb(var(--q-card) / <alpha-value>)',
          border:  'rgb(var(--q-border) / <alpha-value>)',
          text:    'rgb(var(--q-text) / <alpha-value>)',
          muted:   'rgb(var(--q-muted) / <alpha-value>)',
          subtle:  'rgb(var(--q-subtle) / <alpha-value>)',
          purple:  'rgb(var(--q-purple) / <alpha-value>)',
          gold:    'rgb(var(--q-gold) / <alpha-value>)',
          green:   'rgb(var(--q-green) / <alpha-value>)',
          red:     'rgb(var(--q-red) / <alpha-value>)',
        },
        // keep quest-* aliases for backward compat
        quest: {
          bg:      'rgb(var(--q-bg) / <alpha-value>)',
          surface: 'rgb(var(--q-surface) / <alpha-value>)',
          card:    'rgb(var(--q-card) / <alpha-value>)',
          border:  'rgb(var(--q-border) / <alpha-value>)',
          gold:    'rgb(var(--q-gold) / <alpha-value>)',
          purple:  'rgb(var(--q-purple) / <alpha-value>)',
          green:   'rgb(var(--q-green) / <alpha-value>)',
          red:     'rgb(var(--q-red) / <alpha-value>)',
          muted:   'rgb(var(--q-muted) / <alpha-value>)',
          subtle:  'rgb(var(--q-subtle) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-hero':    'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15), transparent)',
      },
      boxShadow: {
        'glow':    '0 0 0 1px rgba(99,102,241,0.3), 0 4px 24px rgba(99,102,241,0.12)',
        'glow-sm': '0 0 0 1px rgba(99,102,241,0.2)',
        'card':    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
        'card-md': '0 4px 16px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
