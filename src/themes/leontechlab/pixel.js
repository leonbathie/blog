/**
 * Boîte à outils de pixel art, partagée par le bandeau (hero.js) et les
 * vignettes (icons.js) : couleurs entières pour ImageData, bruit déterministe,
 * tramage ordonné, dégradés en demi-teinte, polices bitmap et la Terre.
 *
 * Tout est calculé case par case sur une petite grille, puis agrandi d'un
 * facteur entier par l'appelant : jamais d'anti-crénelage, des carrés nets.
 */

/* ---------- Couleurs ---------- */
/** '#rrggbb' → entier 32 bits dans l'ordre des octets d'ImageData (petit-boutiste) */
export const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return (0xff000000 | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0
}

/* ---------- Mathématiques ---------- */
export const DEG = 180 / Math.PI
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
export const lerp = (a, b, k) => a + (b - a) * k
export const smooth = (v) => {
  const k = clamp(v, 0, 1)
  return k * k * (3 - 2 * k)
}

/** Bruit déterministe : même case, même valeur, d'une image à l'autre */
export function hash(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Tramage ordonné 4 × 4 : la demi-teinte devient un motif de pixels */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
export const dither = (x, y, v) => v * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5

/** Teinte tramée entre plusieurs tons, v de 0 (le plus sombre) à 1 (le plus clair) */
export function shade(tones, v, x, y) {
  const level = clamp(v, 0, 1) * (tones.length - 1)
  const base = Math.floor(level)
  return tones[Math.min(tones.length - 1, base + (dither(x, y, level - base) ? 1 : 0))]
}

/* ---------- Police bitmap 5 × 7 ---------- */
export const FONT = {
  A: ['.111.', '1...1', '1...1', '11111', '1...1', '1...1', '1...1'],
  I: ['11111', '..1..', '..1..', '..1..', '..1..', '..1..', '11111'],
  L: ['1....', '1....', '1....', '1....', '1....', '1....', '11111'],
  T: ['11111', '..1..', '..1..', '..1..', '..1..', '..1..', '..1..'],
  '>': ['1....', '.1...', '..1..', '...1.', '..1..', '.1...', '1....'],
  _: ['.....', '.....', '.....', '.....', '.....', '.....', '11111'],
}

/**
 * Pinceau sur un tableau de cases : toutes les primitives écrivent dans
 * `target` (Uint32Array de w × h), en ignorant ce qui dépasse.
 */
export function painter(target, w, h) {
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    target[y * w + x] = c
  }
  const get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? undefined : target[y * w + x])
  const hline = (x0, x1, y, c) => {
    for (let x = x0; x <= x1; x++) put(x, y, c)
  }
  const vline = (x, y0, y1, c) => {
    for (let y = y0; y <= y1; y++) put(x, y, c)
  }
  const rect = (x0, y0, x1, y1, c) => {
    for (let y = y0; y <= y1; y++) hline(x0, x1, y, c)
  }
  /** Rectangle en dégradé tramé : fn(x, y) renvoie la clarté 0 … 1 */
  const grad = (x0, y0, x1, y1, tones, fn) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, shade(tones, fn(x, y), x, y))
  }
  /** Segment de Bresenham : une diagonale en escalier, sans flou */
  const line = (x0, y0, x1, y1, c) => {
    const dx = Math.abs(x1 - x0)
    const dy = -Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx + dy
    for (;;) {
      put(x0, y0, c)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 >= dy) {
        err += dy
        x0 += sx
      }
      if (e2 <= dx) {
        err += dx
        y0 += sy
      }
    }
  }
  /** Disque plein ; fn(x, y, d) facultative donne la couleur selon la distance au centre (0 … 1) */
  const disc = (cx, cy, r, c, fn) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx + 0.5, dy + 0.5)
        if (d > r) continue
        put(cx + dx, cy + dy, fn ? fn(cx + dx, cy + dy, d / r) : c)
      }
    }
  }
  /** Anneau d'épaisseur `t` cases */
  const ring = (cx, cy, r, t, c) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx + 0.5, dy + 0.5)
        if (d <= r && d > r - t) put(cx + dx, cy + dy, c)
      }
    }
  }
  /** Ellipse pleine */
  const ellipse = (cx, cy, rx, ry, c, fn) => {
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        const e = ((dx + 0.5) / rx) ** 2 + ((dy + 0.5) / ry) ** 2
        if (e > 1) continue
        put(cx + dx, cy + dy, fn ? fn(cx + dx, cy + dy, Math.sqrt(e)) : c)
      }
    }
  }
  /** Texte en police 5 × 7, agrandi `s` fois, 1 case d'interlettre */
  const text = (str, x0, y0, c, s = 1) => {
    ;[...str].forEach((ch, k) => {
      FONT[ch]?.forEach((row, gy) => {
        ;[...row].forEach((cell, gx) => {
          if (cell === '1') rect(x0 + (k * 6 + gx) * s, y0 + gy * s, x0 + (k * 6 + gx) * s + s - 1, y0 + gy * s + s - 1, c)
        })
      })
    })
  }
  /** Étoiles déterministes sur le fond, là où `bg` est encore présent */
  const stars = (count, bg, tones, seed = 0) => {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(hash(i + seed, 11) * w)
      const y = Math.floor(hash(i + seed, 23) * h)
      if (get(x, y) !== bg) continue
      const k = hash(i + seed, 37)
      put(x, y, tones[k > 0.85 ? 2 : k > 0.5 ? 1 : 0])
      if (k > 0.96) {
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (get(x + ox, y + oy) === bg) put(x + ox, y + oy, tones[0])
      }
    }
  }
  return { put, get, hline, vline, rect, grad, line, disc, ring, ellipse, text, stars }
}

/* ---------- La Terre ---------- */
export const EARTH = {
  seaDeep: rgb('#0b2552'),
  sea: rgb('#1b4f9c'),
  seaLight: rgb('#3a7bd5'),
  seaHi: rgb('#8fc3ff'),
  landDark: rgb('#145c22'),
  land: rgb('#2e9a3c'),
  landLight: rgb('#6ad35a'),
  desertDark: rgb('#8a6f33'),
  desert: rgb('#c9a95b'),
  desertLight: rgb('#e8cf86'),
  iceDark: rgb('#9cb8cc'),
  ice: rgb('#e8f6ff'),
  night: rgb('#03091a'),
  cloud: rgb('#ffffff'),
  cloudShade: rgb('#9cb8cc'),
  atmo: rgb('#9fe0ff'),
  atmoDark: rgb('#1b3f78'),
}

// Planisphère grossier : [longitude, latitude, demi-axes en degrés, nature]
// nature : 0 végétation, 1 désert, 2 glace
const LAND = [
  [-8, 13, 11, 6, 0], // Afrique de l'Ouest, Sénégal compris
  [22, -2, 14, 12, 0],
  [26, -18, 11, 11, 0],
  [17, 19, 27, 12, 1], // Sahara
  [44, 9, 6, 5, 1],
  [47, -19, 2.5, 7, 0],
  [14, 50, 16, 8, 0],
  [-4, 40, 5, 4, 0],
  [17, 63, 7, 7, 0],
  [-2, 54, 2.5, 4, 0],
  [12, 43, 3, 4, 0],
  [95, 60, 50, 12, 0],
  [105, 34, 18, 12, 0],
  [78, 21, 8, 10, 0],
  [103, 15, 6, 8, 0],
  [160, 60, 6, 6, 0],
  [138, 37, 2.5, 5, 0],
  [114, 0, 4, 4, 0],
  [102, -1, 6, 3, 0],
  [140, -5, 7, 3, 0],
  [80, 45, 30, 9, 1],
  [46, 24, 9, 8, 1],
  [55, 33, 8, 5, 1],
  [146, -19, 6, 8, 0],
  [134, -25, 17, 9, 1],
  [172, -41, 2.5, 5, 0],
  [-100, 52, 28, 13, 0],
  [-100, 37, 20, 9, 0],
  [-152, 64, 12, 6, 0],
  [-85, 70, 25, 6, 0],
  [-87, 13, 4, 4, 0],
  [-82, 28, 1.5, 3, 0],
  [-60, -8, 17, 14, 0],
  [-66, -32, 8, 14, 0],
  [-70, 4, 9, 6, 0],
  [-112, 32, 7, 6, 1],
  [-103, 23, 7, 7, 1],
  [-70, -48, 4, 7, 1],
  [-42, 72, 13, 10, 2], // Groenland
]
const MAP_W = 180
const MAP_H = 90
const MAP = new Uint8Array(MAP_W * MAP_H) // 0 mer, 1 végétation, 2 désert, 3 glace
for (let j = 0; j < MAP_H; j++) {
  const lat = 90 - (j + 0.5) * 2
  for (let i = 0; i < MAP_W; i++) {
    const lon = -180 + (i + 0.5) * 2
    let v = lat > 78 || lat < -66 ? 3 : 0
    if (!v) {
      // Côtes un peu irrégulières : sans ce bruit, les continents seraient des ovales
      const ragged = 1 + (hash(i, j) - 0.5) * 0.4
      for (const [clon, clat, rx, ry, kind] of LAND) {
        const dl = ((((lon - clon + 540) % 360) + 360) % 360) - 180
        if ((dl / rx) ** 2 + ((lat - clat) / ry) ** 2 <= ragged) {
          v = kind === 2 ? 3 : kind === 1 ? 2 : 1
          if (kind === 0) break
        }
      }
    }
    MAP[j * MAP_W + i] = v
  }
}
export function mapAt(lon, lat) {
  const i = Math.floor(((((lon + 180) % 360) + 360) % 360) / 2) % MAP_W
  const j = clamp(Math.floor((90 - lat) / 2), 0, MAP_H - 1)
  return MAP[j * MAP_W + i]
}
// Bancs nuageux qui dérivent vers l'est : [longitude, latitude, demi-axes, vitesse]
const CLOUDS = [
  [-30, 8, 22, 4, 0.5],
  [60, -14, 26, 5, 0.35],
  [150, 42, 18, 5, 0.7],
  [-120, -36, 24, 4, 0.45],
  [100, 56, 28, 5, 0.25],
]

/**
 * Dessine la Terre : océan, continents du planisphère, nuages, nuit sur le
 * flanc droit et halo d'atmosphère. `spin` tourne le globe (degrés), `drift`
 * fait dériver les nuages ; les deux valent 0 pour une image fixe.
 */
export function paintEarth(put, { cx, cy, r, spin = 0, drift = 0, P = EARTH, lightDir = [-0.55, -0.42, 0.72] }) {
  const [lx, ly, lz] = lightDir
  const outer = ((r + 1.3) / r) ** 2
  for (let dy = -r - 1; dy <= r + 1; dy++) {
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const x = cx + dx
      const y = cy + dy
      const nx = (dx + 0.5) / r
      const ny = (dy + 0.5) / r
      const d2 = nx * nx + ny * ny
      if (d2 > 1) {
        // Halo atmosphérique d'une case, éclairé du côté du soleil
        if (d2 <= outer) put(x, y, nx * lx + ny * ly > -0.15 ? P.atmo : P.atmoDark)
        continue
      }
      const nz = Math.sqrt(1 - d2)
      const light = clamp(nx * lx + ny * ly + nz * lz, 0, 1)
      const lat = Math.asin(-ny) * DEG
      const lon = Math.atan2(nx, nz) * DEG + spin
      let c
      if (light < 0.07) c = P.night
      else {
        const kind = mapAt(lon, lat)
        if (kind === 1) c = shade([P.landDark, P.land, P.landLight], light, x, y)
        else if (kind === 2) c = shade([P.desertDark, P.desert, P.desertLight], light, x, y)
        else if (kind === 3) c = shade([P.iceDark, P.ice], light * 1.2, x, y)
        else c = light > 0.93 ? P.seaHi : shade([P.seaDeep, P.sea, P.seaLight], light, x, y)
        for (const [clon, clat, rx, ry, sp] of CLOUDS) {
          const dl = ((((lon - clon - drift * sp + 540) % 360) + 360) % 360) - 180
          const e = (dl / rx) ** 2 + ((lat - clat) / ry) ** 2
          if (e < 1 && dither(x, y, (1 - e) * 0.9)) {
            c = light > 0.35 ? P.cloud : P.cloudShade
            break
          }
        }
      }
      put(x, y, c)
    }
  }
}
