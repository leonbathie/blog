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
        archivo: ['Archivo', 'Helvetica Neue', 'sans-serif'],
        plex: ['"IBM Plex Sans"', 'sans-serif'],
        plexmono: ['"IBM Plex Mono"', 'monospace'],
        orbitron: ['Orbitron', 'sans-serif'],
        techmono: ['"Share Tech Mono"', 'monospace'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        // Polices des formes « console » : chaque peau fixe ses trois familles
        'term-display': ['var(--term-font-display)', 'sans-serif'],
        'term-mono': ['var(--term-font-mono)', 'monospace'],
        'term-body': ['var(--term-font-body)', 'sans-serif'],
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
        // Forme « Planche » : papier technique clair / cyanotype (bleu de plan) sombre
        pl: {
          paper: 'rgb(var(--pl-paper) / <alpha-value>)',
          ink: 'rgb(var(--pl-ink) / <alpha-value>)',
          muted: 'rgb(var(--pl-muted) / <alpha-value>)',
          rule: 'rgb(var(--pl-rule) / <alpha-value>)',
          grid: 'rgb(var(--pl-grid) / <alpha-value>)',
          blue: 'rgb(var(--pl-blue) / <alpha-value>)',
          red: 'rgb(var(--pl-red) / <alpha-value>)',
          surface: 'rgb(var(--pl-surface) / <alpha-value>)',
        },
        // Palette sémantique des formes « console » (Mission Control, CRT).
        // Les deux partagent les mêmes composants : seules ces variables changent.
        term: {
          bg: 'rgb(var(--term-bg) / <alpha-value>)',
          void: 'rgb(var(--term-void) / <alpha-value>)',
          accent: 'rgb(var(--term-accent) / <alpha-value>)',
          'accent-lt': 'rgb(var(--term-accent-lt) / <alpha-value>)',
          'accent-dk': 'rgb(var(--term-accent-dk) / <alpha-value>)',
          accent2: 'rgb(var(--term-accent2) / <alpha-value>)',
          info: 'rgb(var(--term-info) / <alpha-value>)',
          ok: 'rgb(var(--term-ok) / <alpha-value>)',
          alert: 'rgb(var(--term-alert) / <alpha-value>)',
          extra: 'rgb(var(--term-extra) / <alpha-value>)',
          head: 'rgb(var(--term-head) / <alpha-value>)',
          ink: 'rgb(var(--term-ink) / <alpha-value>)',
          dim: 'rgb(var(--term-dim) / <alpha-value>)',
          faint: 'rgb(var(--term-faint) / <alpha-value>)',
          line: 'rgb(var(--term-line) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
