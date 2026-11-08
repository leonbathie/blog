import defaultTheme from 'tailwindcss/defaultTheme'

/**
 * Tailwind v3 : même moteur que le CDN utilisé par les maquettes HTML,
 * ce qui permet de reprendre leurs classes telles quelles dans les formes Vue.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{vue,js,md}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        serif: ['Newsreader', 'Georgia', ...defaultTheme.fontFamily.serif],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
        pixel: ['"Press Start 2P"', 'monospace'],
        syne: ['Syne', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        // Forme « Monographie » : couleurs pilotées par des variables CSS (papier clair / obsidienne)
        mono: {
          page: 'rgb(var(--mono-page) / <alpha-value>)',
          ink: 'rgb(var(--mono-ink) / <alpha-value>)',
          muted: 'rgb(var(--mono-muted) / <alpha-value>)',
          line: 'rgb(var(--mono-line) / <alpha-value>)',
          accent: 'rgb(var(--mono-accent) / <alpha-value>)',
          panel: 'rgb(var(--mono-panel) / <alpha-value>)',
          surface: 'rgb(var(--mono-surface) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
