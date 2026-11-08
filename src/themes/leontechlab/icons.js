/**
 * Icônes d'articles en pixel art, 32 × 24 pixels logiques, agrandies par
 * le CSS sans lissage. Dessinées par primitives (rectangles, disques,
 * lettres 3 × 5) : lisibles, déterministes, aucune image à embarquer.
 */

export const ICON_W = 32
export const ICON_H = 24

const P = {
  k: '#000000',
  K: '#0a1f0a',
  g: '#33ff33',
  G: '#1a7a1a',
  b: '#3a7bd5',
  B: '#1b3f78',
  y: '#ffd21e',
  Y: '#a8780a',
  s: '#c8c8c8',
  S: '#6b6b6b',
  e: '#ddd0b8',
  E: '#8d7f66',
  w: '#ffffff',
  c: '#50f0ff',
  r: '#ff5555',
}

/** Lettres 3 × 5 pour l'écran du terminal */
const GLYPHS = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
}

function painter(ctx) {
  const px = (x, y, w, h, color) => {
    ctx.fillStyle = P[color]
    ctx.fillRect(x, y, w, h)
  }
  const disc = (cx, cy, r, color) => {
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5)
      px(cx - half, cy + dy, half * 2 + 1, 1, color)
    }
  }
  const glyph = (ch, x, y, color) => {
    GLYPHS[ch]?.forEach((row, dy) => {
      ;[...row].forEach((cell, dx) => {
        if (cell === '#') px(x + dx, y + dy, 1, 1, color)
      })
    })
  }
  const stars = (list) => list.forEach(([x, y]) => px(x, y, 1, 1, 'w'))
  return { px, disc, glyph, stars }
}

const ICONS = {
  /** Terminal à tube cathodique affichant « AI> » */
  computer({ px, glyph }) {
    px(4, 1, 23, 16, 'e')
    px(26, 1, 1, 16, 'E')
    px(4, 16, 23, 1, 'E')
    px(6, 3, 19, 11, 'k')
    for (let y = 4; y < 14; y += 2) px(6, y, 19, 1, 'K')
    glyph('A', 8, 5, 'g')
    glyph('I', 12, 5, 'g')
    glyph('>', 16, 5, 'g')
    px(20, 5, 3, 5, 'K')
    px(8, 11, 3, 1, 'g')
    px(13, 17, 6, 2, 'E')
    px(9, 19, 14, 1, 'E')
    px(2, 21, 28, 2, 'e')
    px(2, 23, 28, 1, 'E')
    for (let x = 3; x < 29; x += 2) px(x, 22, 1, 1, 'E')
  },

  /** Satellite au-dessus de l'horizon terrestre */
  satellite({ px, stars }) {
    stars([
      [3, 2],
      [27, 4],
      [8, 7],
      [24, 1],
      [29, 11],
      [1, 13],
    ])
    // Horizon
    const rows = [
      [18, 10, 12],
      [19, 7, 18],
      [20, 5, 22],
      [21, 3, 26],
      [22, 1, 30],
      [23, 0, 32],
    ]
    rows.forEach(([y, x, w], i) => px(x, y, w, 1, i === 0 ? 'g' : 'G'))
    // Panneaux solaires
    px(1, 10, 10, 4, 'b')
    px(21, 10, 10, 4, 'b')
    for (let x = 3; x < 11; x += 2) px(x, 10, 1, 4, 'B')
    for (let x = 23; x < 31; x += 2) px(x, 10, 1, 4, 'B')
    px(1, 12, 10, 1, 'B')
    px(21, 12, 10, 1, 'B')
    px(11, 11, 2, 2, 's')
    px(19, 11, 2, 2, 's')
    // Corps
    px(13, 8, 6, 8, 'y')
    px(13, 14, 6, 2, 'Y')
    px(17, 8, 2, 8, 'Y')
    px(14, 10, 2, 2, 'k')
    // Antenne parabolique
    px(15, 3, 2, 2, 's')
    px(13, 5, 6, 1, 's')
    px(14, 6, 4, 1, 's')
    px(15, 7, 2, 1, 's')
    px(16, 1, 1, 2, 's')
    px(15, 0, 3, 1, 'r')
  },

  /** Globe, Afrique au centre */
  globe({ px, disc, stars }) {
    stars([
      [2, 3],
      [29, 2],
      [27, 20],
      [3, 19],
      [30, 12],
    ])
    disc(16, 12, 11, 'B')
    disc(16, 12, 10, 'b')
    // Afrique et Europe, stylisées
    px(14, 5, 5, 1, 'G')
    px(13, 6, 7, 2, 'g')
    px(12, 8, 9, 2, 'g')
    px(13, 10, 8, 2, 'g')
    px(14, 12, 6, 3, 'g')
    px(15, 15, 4, 2, 'g')
    px(16, 17, 2, 1, 'G')
    // Amérique du Sud, en bordure gauche
    px(7, 11, 2, 4, 'G')
    px(8, 15, 1, 2, 'G')
    // Reflet
    px(10, 5, 2, 1, 'c')
    px(9, 6, 1, 2, 'c')
    // Trame
    for (let y = 3; y < 22; y += 3) px(6, y, 21, 1, 'B')
  },

  /** Engrenage de maintenance */
  gear({ px, disc }) {
    const cx = 16
    const cy = 12
    // Dents sur huit directions
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i
      const x = Math.round(cx + Math.cos(a) * 9)
      const y = Math.round(cy + Math.sin(a) * 9)
      px(x - 1, y - 1, 3, 3, 'S')
    }
    disc(cx, cy, 8, 'S')
    disc(cx, cy, 7, 's')
    disc(cx, cy, 3, 'k')
    // Reflet et repère
    px(13, 7, 2, 1, 'w')
    px(12, 8, 1, 1, 'w')
    px(cx + 4, cy - 1, 1, 1, 'y')
    px(cx - 5, cy + 1, 1, 1, 'y')
    px(cx, cy - 5, 1, 1, 'y')
    px(cx, cy + 4, 1, 1, 'y')
    // Base
    px(0, 22, 32, 2, 'G')
    px(0, 21, 32, 1, 'g')
  },
}

export function drawIcon(ctx, name) {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, ICON_W, ICON_H)
  ctx.fillStyle = P.k
  ctx.fillRect(0, 0, ICON_W, ICON_H)
  ;(ICONS[name] ?? ICONS.computer)(painter(ctx))
}
