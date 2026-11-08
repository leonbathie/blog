/**
 * Bandeau de la forme « Évolution », en pixel art à facteur entier (voir
 * leontechlab/hero.js pour le principe), d'après la maquette : à gauche, en
 * sépia, un ingénieur à lunettes devant les consoles d'une salle de contrôle
 * des années 1960 ; au centre le titre (en HTML, par-dessus) ; à droite, dans
 * le noir de l'espace, un globe filaire tourné vers l'Afrique, un satellite
 * et le sol lunaire au premier plan.
 *
 * L'écusson au mur est un dessin original (disque, orbite dorée, horizon,
 * sigle LTL) et non l'emblème d'une agence spatiale réelle : afficher le
 * sceau d'une organisation existante laisserait croire à une affiliation.
 */
import { clamp, DEG, hash, mapAt, painter, rgb, shade, smooth } from '../leontechlab/pixel.js'

/* Positions en fraction de la grille (x : largeur, y et r : hauteur) */
export const LAYOUTS = {
  wide: {
    w: 900, // proportions du canevas avant le premier rendu
    h: 100,
    artW: 640, // largeur visée de la grille, en cases
    room: 0.43, // la salle de contrôle occupe la gauche…
    fade: [0.27, 0.43], // … et s'éteint derrière le titre
    man: { x: -0.015, top: 0.1, h: 0.9 },
    badge: { x: 0.118, y: 0.36, r: 0.27 },
    racks: { x0: 0.165, x1: 0.36, y0: 0.04, y1: 0.6 },
    consoles: { x0: 0.09, x1: 0.43, y0: 0.58, y1: 0.86 },
    earth: { x: 0.76, y: 0.53, r: 0.45 },
    sat: { x: 0.855, y: 0.36, l: 0.26 },
    ground: { x0: 0.5, top: 0.78 },
  },
  compact: {
    w: 240,
    h: 70,
    artW: 320,
    room: 0.56,
    fade: [0.42, 0.56],
    man: { x: -0.015, top: 0.1, h: 0.9 },
    badge: { x: 0.29, y: 0.34, r: 0.25 },
    racks: { x0: 0.33, x1: 0.52, y0: 0.04, y1: 0.6 },
    consoles: { x0: 0.14, x1: 0.56, y0: 0.58, y1: 0.86 },
    earth: { x: 0.74, y: 0.56, r: 0.4 },
    sat: { x: 0.93, y: 0.26, l: 0.2 },
    ground: { x0: 0.57, top: 0.8 },
  },
}

/* ---------- Palette ---------- */
const C = {
  sky: rgb('#000000'),
  // salle de contrôle, en sépia
  wallDark: rgb('#342a20'),
  wall: rgb('#574637'),
  wallLight: rgb('#7a6652'),
  rackDark: rgb('#3a2c20'),
  rack: rgb('#5e4b39'),
  rackLight: rgb('#8a7458'),
  lampOff: rgb('#6a5642'),
  lampDim: rgb('#a08660'),
  lamp: rgb('#e6c88a'),
  lampHot: rgb('#f3e6c8'),
  consDark: rgb('#3a2e22'),
  cons: rgb('#6e5c48'),
  consLight: rgb('#9c8a72'),
  consTop: rgb('#c2b299'),
  bezel: rgb('#1e1610'),
  screen: rgb('#c8b990'),
  screenDark: rgb('#9a8a68'),
  trace: rgb('#fff7dc'),
  traceDim: rgb('#d0c29a'),
  knob: rgb('#d8ccb0'),
  knobDark: rgb('#7a6a56'),
  desk: rgb('#3a2c20'),
  deskTop: rgb('#5e4c3a'),
  // l'ingénieur
  hair: rgb('#17110d'),
  hairHi: rgb('#362a20'),
  skin: rgb('#75513a'),
  skinDark: rgb('#4c3322'),
  skinLight: rgb('#966b4c'),
  shirt: rgb('#e8dfc8'),
  shirtShade: rgb('#bdb094'),
  crease: rgb('#8f836b'),
  glass: rgb('#d9ccb0'),
  glassHi: rgb('#fff9e8'),
  eye: rgb('#120d0a'),
  // écusson
  rim: rgb('#efe3c4'),
  rimShade: rgb('#b8a888'),
  gold: rgb('#d9b35a'),
  field: rgb('#2a2420'),
  fieldLight: rgb('#4a4038'),
  limb: rgb('#a89870'),
  hill: rgb('#7a6a50'),
  hillDark: rgb('#5a4c3a'),
  // espace
  globeDeep: rgb('#05070c'),
  globe: rgb('#0e1420'),
  globeLight: rgb('#1c2538'),
  grid: rgb('#46526a'),
  limbDark: rgb('#2a3345'),
  limbLight: rgb('#7d8aa0'),
  land: rgb('#1a2030'),
  dotDim: rgb('#6b7484'),
  dot: rgb('#aeb6c4'),
  dotHot: rgb('#f2f5fa'),
  coast: rgb('#ffffff'),
  beacon: rgb('#ff5a3c'),
  satBody: rgb('#d9dde4'),
  satDark: rgb('#7a818e'),
  satPanel: rgb('#c4cad4'),
  satCell: rgb('#5b6475'),
  satEdge: rgb('#f4f6fa'),
  moonEdge: rgb('#a6a6a6'),
}
const MOON = [rgb('#1c1c1c'), rgb('#343434'), rgb('#525252'), rgb('#767676')]
const STARS = [rgb('#3e4450'), rgb('#9aa3b1'), rgb('#f2f5fa')]

/*
 * L'ingénieur, de profil, tourné vers les consoles, le bras tendu vers le pupitre : 56 × 50 cases, étirées à
 * la hauteur voulue. Lettres : h/H cheveux, s/S/L peau (ombre, lumière),
 * g/G monture des lunettes, e œil, n ombre du cou, w/W chemise, c plis.
 */
const MAN = [
  '................hhhhhhhhhhhh............................',
  '..............hhhhhhhhhhhhhhhh..........................',
  '.............hhhhhhhhhhhhhhhhhh.........................',
  '............hhhhhhhhHHhhhhhhhhhh........................',
  '............hhhhhhhHHHhhhhhhhhhhh.......................',
  '...........hhhhhhhhhhhhhhhhhhhsss.......................',
  '...........hhhhhhhhhhhhhhhhhhssss.......................',
  '...........hhhhhhhhhhhhhhhhsssssss......................',
  '...........hhhhhhhhhhhhhhSssssssssgg....................',
  '...........hhhhhhhhhhhSSsgggggggggg.....................',
  '...........hhhhhhhhhhhSsSsssssgessG.....................',
  '...........hhhhhhhhhhhSsSssssssgsssg....................',
  '............hhhhhhhhhhSSSsssssssgggg....................',
  '............hhhhhhhhhhhSsssssssssssss...................',
  '.............hhhhhhhhhhhssssssssssssLs..................',
  '..............hhhhhhhhhhsssssssssssSS...................',
  '...............hhhhhhhhSssssssssssss....................',
  '................hhhhhhSSsssssssssSSS....................',
  '..................hhhSSssssssssssss.....................',
  '...................SSSsssssssssssS......................',
  '....................SSSsssssssssS.......................',
  '......................nSSsssssssS.......................',
  '......................nnSsssssss........................',
  '......................nnSsssssss........................',
  '......................nnSsssssss........................',
  '......................nnSsssssss........................',
  '....................Wcnnssssssssc.......................',
  '.................Wwwwwcnnsssssscwwww....................',
  '..............Wwwwwwwwwcnnsssscwwwwwwww.................',
  '...........Wwwwwwwwwwwwwcnnsscwwwwwwwwwwww..............',
  '........Wwwwwwwwwwwwwwwwwcnncwwwwwwwwwwwwwww............',
  '....WWwwwwwwwwwwwwwwwwwwwwwccwwwwwwwwwwwwwwwww..........',
  '.WWwwwwwwwwwwwwwwwwwwwwwwwwccwwwwwwwwwwwwwwwcww.........',
  'WWWwwwwwwwwwwwwwwwwwwwwwwwwccwwwwwwwwwwwwwwwcwww........',
  'WWWwwwwwwwwwwwwwwwwwwwwwwwwwcwwwwwwwwwwwwwwwcwwww.......',
  'WWWWwwwwwwwwwwwwwwwwwwwwwwwcwwwwwwwwwwwwwwwwcwwww.......',
  'WWWWwwwwwwwwwwwwwwwwwwwwwwwwcwwwwwwwwwwwwwwwcwwwww......',
  'WWWWWwwwwwwwwwwwwwwwwwwwwwwcwwwwwwwwwwwwwwwcwwwwwww.....',
  'WWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwcwwwwwww.....',
  'WWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwcwwwwwwww....',
  'WWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwcwwwwwwwww...',
  'WWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwcwwwwwwwwww...',
  'WWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwccccccccccc..',
  'WWWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwSssssssssss..',
  'WWWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwSssssssssLss.',
  'WWWWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwSssssssssLss.',
  'WWWWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwSssssssssssss',
  'WWWWWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwSssssssssssss',
  'WWWWWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwSssssssssssss',
  'WWWWWWWWWWWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwSSSSSSSSSSSSS',
]
const MAN_PALETTE = {
  h: C.hair,
  H: C.hairHi,
  s: C.skin,
  S: C.skinDark,
  L: C.skinLight,
  n: C.skinDark,
  g: C.glass,
  G: C.glassHi,
  e: C.eye,
  w: C.shirt,
  W: C.shirtShade,
  c: C.crease,
}

/** Assombrit une couleur : k = 1 inchangée, k = 0 noire */
function dim(c, k) {
  const r = ((c & 0xff) * k) | 0
  const g = (((c >> 8) & 0xff) * k) | 0
  const b = (((c >> 16) & 0xff) * k) | 0
  return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0
}

export function createBanner(canvas, { compact = false } = {}) {
  const ctx = canvas.getContext('2d')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const buf = document.createElement('canvas')
  const bctx = buf.getContext('2d')
  let L = compact ? LAYOUTS.compact : LAYOUTS.wide
  let B = 2
  let AW = 0
  let AH = 0
  let img = null
  let px = null
  let running = false
  let frame = 0
  let last = 0
  let t = 0

  function measure() {
    const dpr = window.devicePixelRatio || 1
    const cssW = canvas.parentElement?.clientWidth || L.w
    const deviceW = Math.max(1, Math.round(cssW * dpr))
    B = Math.max(1, Math.round(deviceW / L.artW))
    AW = Math.max(60, Math.floor(deviceW / B))
    AH = Math.round(AW * (L.h / L.w))
    canvas.width = AW * B
    canvas.height = AH * B
    canvas.style.width = `${(AW * B) / dpr}px`
    canvas.style.height = `${(AH * B) / dpr}px`
    buf.width = AW
    buf.height = AH
    img = bctx.createImageData(AW, AH)
    px = new Uint32Array(img.data.buffer)
  }

  const X = (f) => Math.round(f * AW)
  const Y = (f) => Math.round(f * AH)

  /* ---------- La salle de contrôle ---------- */

  /** Image étirée à la hauteur `height`, au plus proche voisin */
  function blit(p, rows, palette, x0, y0, height) {
    const sh = rows.length
    const sw = rows[0].length
    const s = height / sh
    const width = Math.round(sw * s)
    for (let ty = 0; ty < height; ty++) {
      const row = rows[Math.min(sh - 1, Math.floor(ty / s))]
      for (let tx = 0; tx < width; tx++) {
        const c = palette[row[Math.min(sw - 1, Math.floor(tx / s))]]
        if (c !== undefined) p.put(x0 + tx, y0 + ty, c)
      }
    }
  }

  /** Écusson original « LTL », version sépia (voir leontechlab/hero.js) */
  function badge(p, cx, cy, r) {
    const hy = cy + r * 1.18 // centre du limbe, sous l'écusson
    const hr = r * 0.95
    p.disc(cx, cy, r, C.field, (x, y, k) => {
      const d = k * r
      const dx = x - cx
      const dy = y - cy
      if (d > r - 1.5) return dx + dy > r * 0.55 ? C.rimShade : C.rim
      if (d > r - 2.5) return C.gold
      if (d > r - 3.5) return C.field
      const h = Math.hypot(x + 0.5 - cx, y + 0.5 - hy)
      if (h <= hr) return h > hr - 1.2 ? C.limb : shade([C.hillDark, C.hill], 0.6, x, y)
      return shade([C.field, C.fieldLight], 0.5 - (dy / r) * 0.35, x, y)
    })
    for (const [sx, sy] of [[-0.5, -0.55], [0.42, -0.6], [0.62, -0.18], [-0.66, -0.12], [0.18, -0.74]]) {
      p.put(Math.round(cx + sx * r), Math.round(cy + sy * r), C.rim)
    }
    // Orbite, en une seule épaisseur de case
    const a = r * 0.78
    const b = r * 0.27
    const ang = -0.45
    const oy = cy - r * 0.06
    const steps = Math.ceil(a * 9)
    for (let i = 0; i < steps; i++) {
      const th = (i / steps) * Math.PI * 2
      const u = a * Math.cos(th)
      const v = b * Math.sin(th)
      p.put(Math.round(cx + u * Math.cos(ang) - v * Math.sin(ang)), Math.round(oy + u * Math.sin(ang) + v * Math.cos(ang)), C.gold)
    }
    // Sigle, avec son ombre portée
    const s = r >= 26 ? 2 : 1
    const w = (5 * 3 + 2) * s
    const x0 = cx - Math.floor(w / 2)
    const y0 = Math.round(cy - r * 0.14) - Math.floor((7 * s) / 2)
    p.text('LTL', x0 + 1, y0 + 1, C.field, s)
    p.text('LTL', x0, y0, C.gold, s)
  }

  /** Armoires d'équipement : rangées de modules à voyants, certains clignotent */
  function racks(p, x0, x1, y0, y1) {
    const cols = Math.max(2, Math.round((x1 - x0) / (AH * 0.34)))
    const cw = Math.floor((x1 - x0) / cols)
    const mh = Math.max(4, Math.round(AH * 0.09))
    const phase = Math.floor(t / 8)
    for (let c = 0; c < cols; c++) {
      const rx = x0 + c * cw
      p.rect(rx, y0, rx + cw - 2, y1, C.rackDark)
      p.rect(rx + 1, y0 + 1, rx + cw - 3, y1 - 1, C.rack)
      for (let my = y0 + 2; my + mh - 1 < y1; my += mh) {
        p.hline(rx + 1, rx + cw - 3, my, C.rackLight)
        p.hline(rx + 1, rx + cw - 3, my + mh - 1, C.rackDark)
        for (let lx = rx + 3; lx < rx + cw - 4; lx += 3) {
          const k = hash(lx, my)
          const on = k > 0.55 || (k > 0.35 && hash(lx + phase, my) > 0.5)
          p.put(lx, my + 2, on ? (k > 0.8 ? C.lampHot : C.lamp) : k > 0.3 ? C.lampDim : C.lampOff)
          if (mh > 5) p.put(lx, my + mh - 3, hash(lx, my + 1) > 0.6 ? C.knobDark : C.lampOff)
        }
      }
    }
  }

  /** Rangée de consoles : écran bombé, tracé qui vit, boutons */
  function consoles(p, x0, x1, y0, y1) {
    const n = Math.max(3, Math.round((x1 - x0) / (AH * 0.42)))
    const cw = Math.floor((x1 - x0) / n)
    for (let i = 0; i < n; i++) {
      const cx0 = x0 + i * cw
      p.rect(cx0, y0, cx0 + cw - 2, y1, C.cons)
      p.hline(cx0, cx0 + cw - 2, y0, C.consTop)
      p.vline(cx0, y0, y1, C.consLight)
      p.vline(cx0 + cw - 2, y0, y1, C.consDark)
      // Écran
      const sw = Math.round(cw * 0.62)
      const sh = Math.round((y1 - y0) * 0.5)
      const sx = cx0 + Math.round((cw - 2 - sw) / 2)
      const sy = y0 + 2
      p.rect(sx - 1, sy - 1, sx + sw, sy + sh, C.bezel)
      p.grad(sx, sy, sx + sw - 1, sy + sh - 1, [C.screenDark, C.screen], (x, y) => 0.55 + hash(x >> 1, y >> 1) * 0.2 - ((y - sy) / sh) * 0.3)
      if (i % 3 === 1) {
        // Radar : cercle et aiguille qui tourne
        const rc = Math.max(2, Math.min(sw, sh) >> 1)
        const ccx = sx + (sw >> 1)
        const ccy = sy + (sh >> 1)
        p.ring(ccx, ccy, rc, 1, C.traceDim)
        const a = t * 0.12 + i
        p.line(ccx, ccy, Math.round(ccx + Math.cos(a) * (rc - 1)), Math.round(ccy + Math.sin(a) * (rc - 1)), C.trace)
      } else {
        // Oscilloscope
        for (let x = 0; x < sw; x++) {
          const wave = Math.sin(x / 2.2 + t / 6 + i) * sh * 0.28 + (hash(x, (t >> 2) + i) - 0.5) * 1.5
          p.put(sx + x, clamp(Math.round(sy + sh / 2 + wave), sy, sy + sh - 1), C.trace)
        }
      }
      // Boutons et interrupteurs
      const ky = sy + sh + 3
      for (let kx = cx0 + 2; kx < cx0 + cw - 3; kx += 3) p.put(kx, ky, hash(kx, i) > 0.5 ? C.knob : C.knobDark)
      if (y1 - ky > 5) {
        for (let kx = cx0 + 2; kx < cx0 + cw - 4; kx += 4) {
          p.put(kx, ky + 3, C.knobDark)
          p.put(kx + 1, ky + 3, C.knob)
        }
      }
    }
  }

  function room(p) {
    const w = X(L.room)
    p.grad(0, 0, w, AH - 1, [C.wallDark, C.wall, C.wallLight], (x, y) => 0.55 - (y / AH) * 0.35 + hash(x >> 2, y >> 2) * 0.12)
    badge(p, X(L.badge.x), Y(L.badge.y), Math.max(8, Y(L.badge.r)))
    racks(p, X(L.racks.x0), X(L.racks.x1), Y(L.racks.y0), Y(L.racks.y1))
    consoles(p, X(L.consoles.x0), X(L.consoles.x1), Y(L.consoles.y0), Y(L.consoles.y1))
    // Pupitre au premier plan
    const dy = Y(L.consoles.y1)
    p.grad(0, dy, w, AH - 1, [C.desk, C.deskTop], (x, y) => 0.6 - ((y - dy) / (AH - dy)) * 0.5 + hash(x >> 2, y) * 0.1)
    p.hline(0, w, dy, C.deskTop)
    // L'ingénieur, devant les consoles
    const mh = Y(L.man.h)
    blit(p, MAN, MAN_PALETTE, X(L.man.x), Y(L.man.top), mh)
    // La salle s'éteint vers le centre, derrière le titre
    const f0 = X(L.fade[0])
    const f1 = X(L.fade[1])
    for (let x = f0; x <= Math.min(f1, AW - 1); x++) {
      const k = 1 - smooth((x - f0) / Math.max(1, f1 - f0))
      for (let y = 0; y < AH; y++) px[y * AW + x] = dim(px[y * AW + x], k)
    }
  }

  /* ---------- L'espace ---------- */

  /** Globe filaire : sphère sombre, méridiens et parallèles, continents en pointillé, côtes claires */
  function globe(p, cx, cy, r, spin) {
    const [lx, ly, lz] = [-0.5, -0.45, 0.74]
    const outer = ((r + 1.3) / r) ** 2
    const land = []
    for (let dy = -r - 1; dy <= r + 1; dy++) {
      for (let dx = -r - 1; dx <= r + 1; dx++) {
        const x = cx + dx
        const y = cy + dy
        const nx = (dx + 0.5) / r
        const ny = (dy + 0.5) / r
        const d2 = nx * nx + ny * ny
        if (d2 > 1) {
          if (d2 <= outer) p.put(x, y, nx * lx + ny * ly > -0.1 ? C.limbLight : C.limbDark)
          continue
        }
        const nz = Math.sqrt(1 - d2)
        const light = clamp(nx * lx + ny * ly + nz * lz, 0, 1)
        if (d2 > 0.93) {
          p.put(x, y, nx * lx + ny * ly > 0 ? C.limbLight : C.limbDark)
          continue
        }
        p.put(x, y, shade([C.globeDeep, C.globe, C.globeLight], light * 0.9, x, y))
        const lat = Math.asin(-ny) * DEG
        const lon = Math.atan2(nx, nz) * DEG + spin
        if (!mapAt(lon, lat)) continue
        // Taille angulaire d'une case : une côte est une terre voisine de la mer
        const step = clamp(DEG / r / Math.max(nz, 0.35), 1.6, 4.5)
        const coast = !mapAt(lon + step, lat) || !mapAt(lon - step, lat) || !mapAt(lon, lat + step) || !mapAt(lon, lat - step)
        let c
        if (coast) c = light > 0.3 ? C.coast : C.dot
        else if (((x + y) & 1) === 0) c = shade([C.land, C.dotDim, C.dot], light, x, y)
        else c = shade([C.globe, C.land], light, x, y)
        land.push(x, y, c)
      }
    }
    // Grille : méridiens et parallèles tous les 30°, sous les continents
    const plot = (lonGeo, lat, c) => {
      const la = lat / DEG
      const ph = (lonGeo - spin) / DEG
      const nz = Math.cos(la) * Math.cos(ph)
      if (nz <= 0.04) return false
      const nx = Math.cos(la) * Math.sin(ph)
      const ny = -Math.sin(la)
      if (nx * nx + ny * ny > 0.93) return false
      p.put(cx + Math.round(nx * r - 0.5), cy + Math.round(ny * r - 0.5), c)
      return true
    }
    for (let m = 0; m < 12; m++) for (let la = -90; la <= 90; la += 1.5) plot(m * 30, la, C.grid)
    for (const la of [-60, -30, 0, 30, 60]) for (let lo = 0; lo < 360; lo += 1) plot(lo, la, C.grid)
    for (let i = 0; i < land.length; i += 3) p.put(land[i], land[i + 1], land[i + 2])
    // Balise sur Dakar
    if (reduced.matches || t % 40 < 20) plot(-17.4, 14.7, C.beacon)
  }

  /** Satellite : panneaux en diagonale, corps, antenne parabolique tournée vers la Terre */
  function satellite(p, cx, cy, l) {
    const u = Math.SQRT1_2
    const w = Math.max(1, Math.round(l * 0.12))
    const body = Math.max(3, Math.round(l * 0.3))
    for (let i = -l; i <= l; i++) {
      if (Math.abs(i) < body) continue
      for (let j = -w; j <= w; j++) {
        const x = Math.round(cx + (i + j) * u)
        const y = Math.round(cy + (j - i) * u)
        p.put(x, y, j === -w ? C.satEdge : j === w ? C.satDark : Math.abs(i) % 3 === 0 ? C.satCell : C.satPanel)
      }
    }
    for (let i = -body; i <= body; i++) {
      for (let j = -w - 1; j <= w + 1; j++) {
        const x = Math.round(cx + (i + j) * u)
        const y = Math.round(cy + (j - i) * u)
        p.put(x, y, j > w - 1 ? C.satDark : Math.abs(i) === body ? C.satDark : C.satBody)
      }
    }
    // Parabole, côté Terre
    const dx = cx - Math.round(body * 1.3)
    const dy = cy + Math.round(body * 1.3)
    p.disc(dx, dy, Math.max(2, Math.round(l * 0.19)), C.satEdge, (x, y, k) => (k < 0.4 ? C.satDark : C.satEdge))
    p.line(dx, dy, dx - 2, dy + 2, C.satDark)
    // Mât et balise
    p.line(cx + 1, cy - 1, cx + 4, cy - 5, C.satDark)
    p.put(cx + 4, cy - 6, reduced.matches || t % 30 < 15 ? C.beacon : C.satDark)
  }

  /** Sol lunaire au premier plan : horizon qui monte vers la droite, cratères */
  function ground(p) {
    const x0 = X(L.ground.x0)
    const span = Math.max(1, AW - x0)
    const topAt = (x) => {
      const u = (x - x0) / span
      return Math.round(AH * (L.ground.top + (1 - L.ground.top) * (1 - u) ** 2) + (hash(x, 7) - 0.5) * 1.2)
    }
    for (let x = x0; x < AW; x++) {
      const top = topAt(x)
      for (let y = Math.max(0, top); y < AH; y++) {
        const depth = y - top
        let c
        if (depth === 0) c = C.moonEdge
        else if (depth === 1) c = MOON[3]
        else {
          c = shade(MOON, 0.8 - depth / 14 + (hash(x, y) - 0.5) * 0.3, x, y)
          const n = hash(x * 7 + 3, y * 13 + 1)
          if (n > 0.965) c = MOON[0]
          else if (n < 0.014) c = MOON[3]
        }
        p.put(x, y, c)
      }
    }
    // Cratères : paroi lointaine au soleil
    for (const [f, rx, ry] of [[0.3, 5, 1.5], [0.55, 3, 1], [0.78, 7, 2], [0.95, 3, 1]]) {
      const ccx = x0 + Math.round(f * span)
      const ccy = topAt(ccx) + 3 + Math.round(ry * 1.5)
      p.ellipse(ccx, ccy, rx, ry, MOON[1], (x, y, k) => (k > 0.72 ? (y > ccy ? MOON[3] : MOON[0]) : MOON[1]))
    }
  }

  /* ---------- Image complète ---------- */
  function render() {
    if (!px) return
    px.fill(C.sky)
    const p = painter(px, AW, AH)
    room(p)
    p.stars(Math.round((AW * AH) / 70), C.sky, STARS, 5)
    // Étoiles qui scintillent : quelques-unes repassées plus claires
    const dark = X(L.fade[0])
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(hash(i, 101) * AW)
      const y = Math.floor(hash(i, 103) * AH)
      if (x < dark || p.get(x, y) !== C.sky) continue
      if (reduced.matches ? i % 3 === 0 : (t + i * 9) % 60 < 20) p.put(x, y, C.dotHot)
    }
    const e = L.earth
    const r = Math.max(8, Y(e.r))
    // Le globe reste tourné vers l'Afrique : il oscille lentement autour d'elle
    const spin = 18 + (reduced.matches ? 0 : 10 * Math.sin(t * 0.01))
    globe(p, X(e.x), Y(e.y), r, spin)
    const bob = reduced.matches ? 0 : Math.round(Math.sin(t * 0.05) * 1.5)
    satellite(p, X(L.sat.x), Y(L.sat.y) + bob, Math.max(6, Y(L.sat.l)))
    ground(p)
    bctx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(buf, 0, 0, AW * B, AH * B)
  }

  const STEP = 1000 / 20
  function loop(now) {
    if (!running) return
    if (now - last >= STEP) {
      last = now - ((now - last) % STEP)
      t += 1
      render()
    }
    frame = window.requestAnimationFrame(loop)
  }

  let resizeFrame = 0
  const resizer =
    'ResizeObserver' in window
      ? new ResizeObserver(() => {
          window.cancelAnimationFrame(resizeFrame)
          resizeFrame = window.requestAnimationFrame(() => {
            measure()
            render()
          })
        })
      : null
  if (canvas.parentElement) resizer?.observe(canvas.parentElement)

  return {
    start() {
      measure()
      render()
      if (reduced.matches || running) return
      running = true
      last = performance.now()
      frame = window.requestAnimationFrame(loop)
    },
    stop() {
      running = false
      window.cancelAnimationFrame(frame)
    },
    setCompact(value) {
      const next = value ? LAYOUTS.compact : LAYOUTS.wide
      if (next === L) return
      L = next
      measure()
      render()
    },
    dispose() {
      running = false
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(resizeFrame)
      resizer?.disconnect()
    },
  }
}
