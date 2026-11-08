/**
 * Bandeau d'accueil de « LeonTechLab », en vrai pixel art.
 *
 * La scène est calculée case par case sur une petite grille (≈ 420 × 96 cases
 * sur ordinateur, ≈ 180 × 144 sur téléphone), puis agrandie d'un facteur
 * ENTIER : chaque case occupe exactement B × B pixels de l'écran. Ni
 * anti-crénelage ni demi-pixel : des carrés nets, à toutes les tailles. Quand
 * l'écran s'élargit, la grille gagne des colonnes au lieu d'étirer l'image.
 *
 * L'écusson est un dessin original (disque, orbite dorée, horizon vert,
 * sigle LTL) et non l'emblème d'une agence spatiale réelle : afficher le
 * sceau d'une organisation existante sur un site personnel laisserait
 * entendre une affiliation qui n'existe pas. Le drapeau planté est celui du
 * Sénégal, pays de l'auteur.
 *
 * Deux compositions : « large » à partir de 640 px, « compacte » sur
 * téléphone, où le titre HTML s'intercale entre le ciel et le sol lunaire.
 */

import { clamp, dither, FONT, hash, lerp, paintEarth, rgb, shade, smooth } from './pixel.js'

/* Positions en fraction de la grille (x : largeur, y et r : hauteur) */
export const LAYOUTS = {
  wide: {
    w: 960, // proportions du canevas avant le premier rendu
    h: 220,
    artW: 420, // largeur visée de la grille, en cases
    aspect: 220 / 960,
    badge: { x: 0.115, y: 0.5, r: 0.38 },
    earth: { x: 0.915, y: 0.37, r: 0.25 },
    ground: { x0: 0.585, base: 0.9, amp: 0.035, ramp: 0.06 },
    craters: [[0.07, 6, 2], [0.2, 4, 1.5], [0.8, 3, 1], [0.95, 7, 2]], // fraction du sol, rayons
    rocks: [0.04, 0.16, 0.27, 0.86, 0.99],
    lander: 0.775,
    flag: 0.87,
  },
  compact: {
    w: 400,
    h: 320,
    artW: 180,
    aspect: 320 / 400,
    badge: { x: 0.17, y: 0.2, r: 0.145 },
    earth: { x: 0.84, y: 0.19, r: 0.12 },
    ground: { x0: 0, base: 0.945, amp: 0.025, ramp: 0 },
    craters: [[0.08, 5, 2], [0.28, 7, 2], [0.45, 4, 1.5]],
    rocks: [0.18, 0.37, 0.53, 0.99],
    lander: 0.8,
    flag: 0.6,
  },
}

/* ---------- Palette ---------- */
const C = {
  sky: rgb('#000000'),
  white: rgb('#ffffff'),
  // écusson
  rim: rgb('#fff3d1'),
  rimShade: rgb('#cdbb8e'),
  gold: rgb('#ffd21e'),
  goldText: rgb('#ffd21e'),
  textShadow: rgb('#3a2a00'),
  navyDark: rgb('#081a33'),
  navy: rgb('#0d2b4f'),
  navyLight: rgb('#1b4a80'),
  limb: rgb('#5fd35f'),
  hill: rgb('#2fbf4a'),
  hillDark: rgb('#1f8a34'),
  panel: rgb('#5fb4f0'),
  // Lune
  moonEdge: rgb('#d6d6d6'),
  moonLight: rgb('#a9a9a9'),
  moonMid: rgb('#7c7c7c'),
  moonDark: rgb('#525252'),
  moonDeep: rgb('#333333'),
  moonShadow: rgb('#1f1f1f'),
  // module lunaire
  foilLight: rgb('#ffd96a'),
  foil: rgb('#e0a82a'),
  foilDark: rgb('#8a6510'),
  black: rgb('#141414'),
  blackSoft: rgb('#2a2a2a'),
  silver: rgb('#e4e4e4'),
  silverMid: rgb('#b2b2b2'),
  silverDark: rgb('#7c7c7c'),
  glass: rgb('#0a1a2a'),
  glassHi: rgb('#5fb4f0'),
  beacon: rgb('#ff4040'),
  flameHot: rgb('#fff3d1'),
  flame: rgb('#ffd21e'),
  flameOut: rgb('#ff8c1a'),
  dust: rgb('#9a9a9a'),
  // drapeau du Sénégal
  flagGreen: rgb('#00853f'),
  flagGreenDark: rgb('#006a32'),
  flagYellow: rgb('#fdef42'),
  flagYellowDark: rgb('#d9cc2c'),
  flagRed: rgb('#e31b23'),
  flagRedDark: rgb('#b5141b'),
}
const STAR = [rgb('#3b4a3f'), rgb('#9fb3a6'), rgb('#eafff0')]
const MOON = [C.moonDeep, C.moonDark, C.moonMid]

/* ---------- Le bandeau ---------- */
export function createHero(canvas, { compact = false } = {}) {
  const ctx = canvas.getContext('2d')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const buf = document.createElement('canvas')
  const bctx = buf.getContext('2d')

  let L = compact ? LAYOUTS.compact : LAYOUTS.wide
  let B = 3 // taille d'une case, en pixels de l'écran
  let AW = 0 // largeur de la grille, en cases
  let AH = 0
  let img = null
  let px = null // image en cours
  let still = null // calque fixe : ciel, écusson, sol, drapeau, base du module
  let target = null // calque où écrivent les fonctions de dessin
  let surf = null // hauteur du sol, colonne par colonne
  let stars = []
  const S = {} // positions de la scène, en cases

  let running = false
  let frame = 0
  let last = 0
  let t = 0 // pas d'animation, 30 par seconde
  let launchAt = -1 // pas du décollage, -1 au sol

  /* ---------- Primitives ---------- */
  function put(x, y, c) {
    if (x < 0 || y < 0 || x >= AW || y >= AH) return
    target[y * AW + x] = c
  }
  function hline(x0, x1, y, c) {
    for (let x = x0; x <= x1; x++) put(x, y, c)
  }
  function rect(x0, y0, x1, y1, c) {
    for (let y = y0; y <= y1; y++) hline(x0, x1, y, c)
  }
  /** Segment de Bresenham : une diagonale en escalier, sans flou */
  function line(x0, y0, x1, y1, c) {
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
  const isSky = (x, y) => x >= 0 && y >= 0 && x < AW && y < AH && still[y * AW + x] === C.sky

  /* ---------- Mise en place ---------- */
  function measure() {
    const dpr = window.devicePixelRatio || 1
    const cssW = canvas.parentElement?.clientWidth || canvas.clientWidth || L.w
    const deviceW = Math.max(1, Math.round(cssW * dpr))
    B = Math.max(2, Math.round(deviceW / L.artW))
    AW = Math.max(60, Math.floor(deviceW / B))
    AH = Math.max(40, Math.round(AW * L.aspect))
    canvas.width = AW * B
    canvas.height = AH * B
    canvas.style.width = `${(AW * B) / dpr}px`
    canvas.style.height = `${(AH * B) / dpr}px`
    buf.width = AW
    buf.height = AH
    img = bctx.createImageData(AW, AH)
    px = new Uint32Array(img.data.buffer)
    layout()
    buildStill()
  }

  function layout() {
    const g = L.ground
    S.badge = { x: Math.round(L.badge.x * AW), y: Math.round(L.badge.y * AH), r: Math.round(L.badge.r * AH) }
    S.earth = { x: Math.round(L.earth.x * AW), y: Math.round(L.earth.y * AH), r: Math.max(8, Math.round(L.earth.r * AH)) }
    S.lander = Math.round(L.lander * AW)
    S.flag = Math.round(L.flag * AW)
    S.x0 = Math.round(g.x0 * AW)
    S.padY = Math.round(g.base * AH)

    // Relief : deux ondulations, une rampe d'entrée, et une aire plate sous le
    // module — sinon un pied flotterait au-dessus d'un creux.
    const amp = g.amp * AH
    const ramp = Math.max(1, Math.round(g.ramp * AW))
    surf = new Int16Array(AW).fill(AH + 8)
    for (let x = S.x0; x < AW; x++) {
      const d = x - S.x0
      let y = S.padY - amp * (Math.sin(d / 23 + 0.4) + 0.55 * Math.sin(d / 8.5 + 1.3))
      if (g.ramp > 0 && d < ramp) y = lerp(AH + 4, y, smooth(d / ramp))
      y = lerp(y, S.padY, 1 - smooth((Math.abs(x - S.lander) - 22) / 9))
      surf[x] = Math.round(y)
    }

    const count = Math.round((AW * AH) / 130)
    stars = []
    for (let i = 0; i < count; i++) {
      const r = hash(i, 37)
      stars.push({
        x: Math.floor(hash(i, 11) * AW),
        y: Math.floor(hash(i, 23) * AH),
        kind: r > 0.965 ? 2 : r > 0.6 ? 1 : 0, // 0 fixe, 1 scintille, 2 en croix
        phase: hash(i, 51) * 6.28,
        speed: 0.05 + hash(i, 67) * 0.12,
      })
    }
  }

  /** Tout ce qui ne bouge pas, calculé une fois par taille d'écran */
  function buildStill() {
    still = new Uint32Array(AW * AH)
    still.fill(C.sky)
    target = still
    drawBadge()
    drawGround()
    drawFlag()
    drawDescentStage()
  }

  /* ---------- Écusson ---------- */
  function drawBadge() {
    const { x: cx, y: cy, r } = S.badge
    const hy = cy + r * 1.18 // centre du limbe terrestre, sous l'écusson
    const hr = r * 0.95
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx
        const y = cy + dy
        const d = Math.hypot(dx + 0.5, dy + 0.5)
        if (d > r) continue
        let c
        if (d > r - 2) c = dx + dy > r * 0.55 ? C.rimShade : C.rim
        else if (d > r - 3) c = C.gold
        else if (d > r - 4) c = C.navyDark
        else {
          const h = Math.hypot(x + 0.5 - cx, y + 0.5 - hy)
          if (h <= hr) c = h > hr - 1.2 ? C.limb : shade([C.hillDark, C.hill], (hr - h) / (r * 0.5) > 0.6 ? 0.2 : 0.75, x, y)
          else c = shade([C.navyDark, C.navy, C.navyLight], 0.45 - (dy / r) * 0.35 - (dx / r) * 0.12, x, y)
        }
        put(x, y, c)
      }
    }
    // Étoiles du champ
    for (const [sx, sy] of [[-0.5, -0.55], [0.42, -0.6], [0.62, -0.18], [-0.66, -0.12], [0.18, -0.74]]) {
      put(Math.round(cx + sx * r), Math.round(cy + sy * r), C.rim)
    }
    // Orbite dorée, en une seule épaisseur de pixel
    eachOrbitPoint((x, y) => put(x, y, C.gold))
    // Sigle, avec son ombre portée
    const s = r >= 30 ? 2 : 1
    const w = (5 * 3 + 2) * s
    const x0 = cx - Math.floor(w / 2)
    const y0 = Math.round(cy - r * 0.14) - Math.floor((7 * s) / 2)
    drawText('LTL', x0 + s, y0 + s, s, C.textShadow)
    drawText('LTL', x0, y0, s, C.goldText)
  }
  function orbit() {
    const { x: cx, y: cy, r } = S.badge
    return { cx, cy: cy - r * 0.06, a: r * 0.78, b: r * 0.27, ang: -0.45 }
  }
  function orbitPoint(theta) {
    const o = orbit()
    const u = o.a * Math.cos(theta)
    const v = o.b * Math.sin(theta)
    return [Math.round(o.cx + u * Math.cos(o.ang) - v * Math.sin(o.ang)), Math.round(o.cy + u * Math.sin(o.ang) + v * Math.cos(o.ang))]
  }
  function eachOrbitPoint(fn) {
    const o = orbit()
    const steps = Math.ceil(o.a * 9)
    let prev = ''
    for (let i = 0; i < steps; i++) {
      const [x, y] = orbitPoint((i / steps) * Math.PI * 2)
      const key = `${x},${y}`
      if (key !== prev) fn(x, y)
      prev = key
    }
  }
  function drawText(str, x0, y0, s, c) {
    ;[...str].forEach((ch, k) => {
      FONT[ch]?.forEach((row, gy) => {
        ;[...row].forEach((cell, gx) => {
          if (cell === '1') rect(x0 + (k * 6 + gx) * s, y0 + gy * s, x0 + (k * 6 + gx) * s + s - 1, y0 + gy * s + s - 1, c)
        })
      })
    })
  }
  function drawSatellite() {
    const theta = reduced.matches ? 2.2 : t * 0.045
    const [x, y] = orbitPoint(theta)
    const { x: cx, y: cy, r } = S.badge
    if (Math.hypot(x - cx, y - cy) > r - 5) return
    put(x - 2, y, C.panel)
    put(x + 1, y, C.panel)
    put(x - 1, y, C.rim)
    put(x, y, C.rim)
    put(x - 1, y - 1, C.white)
  }

  /* ---------- Sol lunaire ---------- */
  function drawGround() {
    for (let x = S.x0; x < AW; x++) {
      const top = surf[x]
      for (let y = Math.max(0, top); y < AH; y++) {
        const depth = y - top
        let c
        if (depth === 0) c = C.moonEdge
        else if (depth === 1) c = C.moonLight
        else {
          c = shade(MOON, 0.82 - depth / 16 + (hash(x, y) - 0.5) * 0.28, x, y)
          const n = hash(x * 7 + 3, y * 13 + 1)
          if (n > 0.965) c = C.moonDeep
          else if (n < 0.014) c = C.moonLight
        }
        put(x, y, c)
      }
    }
    // Cratères : paroi gauche dans l'ombre, paroi droite au soleil (lumière venant de la gauche)
    const span = AW - S.x0
    for (const [f, rx, ry] of L.craters) {
      const cx = Math.round(S.x0 + f * span)
      if (cx < 0 || cx >= AW) continue
      const cy = surf[cx] + Math.ceil(ry) + 1
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
          if (x < 0 || x >= AW || y >= AH || y <= surf[x]) continue
          const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
          if (e > 1.45) continue
          if (e > 1) put(x, y, y < cy ? C.moonLight : C.moonDark)
          else put(x, y, x < cx ? C.moonDeep : C.moonMid)
        }
      }
    }
    // Rochers posés sur la crête
    for (const f of L.rocks) {
      const x = Math.round(S.x0 + f * span)
      if (x < 1 || x >= AW - 1 || Math.abs(x - S.lander) < 26) continue
      const y = surf[x] - 1
      put(x - 1, y, C.moonLight)
      put(x, y, C.moonMid)
      put(x + 1, y, C.moonDark)
      put(x, y - 1, C.moonLight)
    }
    // Ombre du module, portée vers la droite
    for (let x = S.lander - 12; x <= S.lander + 21; x++) {
      if (x < 0 || x >= AW) continue
      const y = surf[x]
      put(x, y + 1, C.moonShadow)
      if (x > S.lander - 8 && x < S.lander + 17) put(x, y + 2, C.moonShadow)
    }
  }

  /* ---------- Drapeau du Sénégal ---------- */
  function drawFlag() {
    const fx = S.flag
    if (fx < 0 || fx >= AW - 16) return
    const base = surf[fx]
    const top = base - 21
    for (let y = top; y < base; y++) put(fx, y, C.silverMid)
    put(fx, top - 1, C.white)
    hline(fx + 1, fx + 15, top, C.silverDark) // tringle : sans air, un drapeau ne flotte pas
    const bands = [
      [C.flagGreen, C.flagGreenDark],
      [C.flagYellow, C.flagYellowDark],
      [C.flagRed, C.flagRedDark],
    ]
    for (let j = 0; j < 9; j++) {
      for (let i = 0; i < 15; i++) {
        const [light, dark] = bands[Math.floor(i / 5)]
        const fold = (i % 5 === 3 && j % 4 === 1) || (i === 14 && j > 0)
        put(fx + 1 + i, top + 1 + j, fold ? dark : light)
      }
    }
    // Étoile verte, au centre de la bande jaune
    const sx = fx + 1 + 6
    const sy = top + 1 + 3
    put(sx + 1, sy, C.flagGreen)
    hline(sx, sx + 2, sy + 1, C.flagGreen)
    put(sx, sy + 2, C.flagGreen)
    put(sx + 2, sy + 2, C.flagGreen)
  }

  /* ---------- Module lunaire ---------- */
  // Repère local : x depuis l'axe du module, y depuis le sol (négatif vers le haut).
  const lp = (x, y, c) => put(S.lander + x, S.padY + y, c)

  /** Étage de descente, pieds et jambes : il reste au sol au décollage */
  function drawDescentStage() {
    const o = { x: S.lander, y: S.padY }
    for (const side of [-1, 1]) {
      const p0 = side < 0 ? -17 : 13
      for (let x = p0; x <= p0 + 4; x++) {
        lp(x, -2, C.silverMid)
        lp(x, -1, C.silverDark) // la semelle repose sur le sol : rangée -1, le sol est en 0
      }
      line(o.x + side * 10, o.y - 14, o.x + side * 15, o.y - 3, C.silver)
      line(o.x + side * 8, o.y - 12, o.x + side * 13, o.y - 6, C.silverDark)
    }
    // Tuyère
    for (let x = -2; x <= 2; x++) lp(x, -11, C.silverDark)
    for (let x = -3; x <= 3; x++) {
      lp(x, -10, C.black)
      lp(x, -9, x === -3 ? C.blackSoft : C.black)
    }
    // Caisson en feuille d'or, coins coupés, ceinture noire en bas
    for (let y = -22; y <= -12; y++) {
      for (let x = -11; x <= 11; x++) {
        if (Math.abs(x) === 11 && (y === -22 || y === -12)) continue
        let c
        if (y >= -14) c = (x + y) % 3 === 0 ? C.blackSoft : C.black
        else {
          const n = hash(x + 50, y + 50)
          c = n > 0.8 ? C.foilLight : n < 0.2 ? C.foilDark : C.foil
          if (x === -11 || y === -22) c = n > 0.5 ? C.foilLight : C.foil
          if (x === 11 || x === -4 || x === 4) c = C.foilDark
        }
        lp(x, y, c)
      }
    }
    for (let y = -19; y <= -17; y++) {
      for (const x0 of [-9, 7]) for (let x = x0; x <= x0 + 2; x++) lp(x, y, C.black)
    }
  }

  /** Étage de remontée : cabine, hublot, écoutille, antennes et balise */
  function drawAscentStage(lift) {
    const oy = S.padY - Math.round(lift)
    const ap = (x, y, c) => put(S.lander + x, oy + y, c)
    for (let y = -34; y <= -23; y++) {
      const half = y <= -32 ? 5 : 8
      for (let x = -half; x <= half; x++) {
        let c = x < -2 ? C.silver : x < 4 ? C.silverMid : C.silverDark
        if (y === -34 || x === half || (y === -31 && Math.abs(x) > 5)) c = C.silverDark
        ap(x, y, c)
      }
    }
    // Hublot triangulaire, avec un reflet
    for (const [x, y] of [[-6, -30], [-5, -30], [-4, -30], [-6, -29], [-5, -29], [-6, -28]]) ap(x, y, C.glass)
    ap(-5, -30, C.glassHi)
    // Écoutille
    for (let y = -28; y <= -24; y++) for (let x = -1; x <= 2; x++) ap(x, y, y === -28 || x === -1 || x === 2 ? C.silverDark : C.black)
    // Propulseurs d'attitude, de chaque côté
    for (const s of [-1, 1]) {
      ap(s * 9, -28, C.silverDark)
      ap(s * 10, -28, C.black)
      ap(s * 10, -29, C.black)
      ap(s * 10, -27, C.black)
    }
    // Tunnel d'amarrage
    for (let x = -2; x <= 2; x++) {
      ap(x, -35, C.silverMid)
      ap(x, -36, C.silverDark)
    }
    // Antenne parabolique (à droite) et fouet (à gauche) avec sa balise
    for (let y = -39; y <= -35; y++) ap(5, y, C.silverMid)
    for (let x = 4; x <= 6; x++) ap(x, -42, C.silver)
    for (const y of [-41, -40]) {
      ap(3, y, C.silver)
      ap(7, y, C.silverMid)
    }
    for (let y = -40; y <= -35; y++) ap(-4, y, C.silverDark)
    const blink = reduced.matches || t % 20 < 10
    ap(-4, -41, blink ? C.beacon : C.blackSoft)
  }

  function drawLaunch() {
    if (launchAt < 0) {
      drawAscentStage(0)
      return
    }
    const k = t - launchAt
    const lift = k < 6 ? 0 : 0.06 * (k - 6) ** 2
    const cabinBottom = S.padY - Math.round(lift) - 22
    // Poussière soulevée par l'allumage
    if (k < 26) {
      for (let i = 0; i < 12; i++) {
        const side = i % 2 ? 1 : -1
        const speed = 0.6 + hash(i, 5) * 1.1
        const x = S.lander + side * Math.round(6 + k * speed)
        const y = S.padY - 22 + Math.round(hash(i, 9) * 4 + k * k * 0.012)
        if (y < S.padY && hash(i, k) > 0.25) put(x, y, C.dust)
      }
    }
    // Flamme, qui vacille d'une image à l'autre
    const len = 3 + Math.floor(hash(t, 7) * 6)
    for (let r = 0; r <= len; r++) {
      const half = Math.max(0, 2 - Math.floor(r / 2))
      for (let x = -half; x <= half; x++) {
        const c = r < 2 && x === 0 ? C.flameHot : r < 4 ? C.flame : C.flameOut
        if (r < len || hash(x, t) > 0.5) put(S.lander + x, cabinBottom + 1 + r, c)
      }
    }
    if (cabinBottom > -30) drawAscentStage(lift)
    // Hors champ : on attend un peu, puis l'étage réapparaît à sa place
    if (cabinBottom < -60) launchAt = -1
  }

  /* ---------- Terre ---------- */
  function drawEarth() {
    const { x: cx, y: cy, r } = S.earth
    paintEarth(put, { cx, cy, r, spin: reduced.matches ? 20 : t * 0.35, drift: reduced.matches ? 0 : t })
  }

  /* ---------- Étoiles ---------- */
  function drawStars() {
    const still2 = reduced.matches
    for (const s of stars) {
      if (!isSky(s.x, s.y)) continue
      let level = s.kind === 0 ? 0 : 1
      if (s.kind > 0 && !still2) {
        const w = Math.sin(t * s.speed + s.phase)
        level = w > 0.55 ? 2 : w > -0.35 ? 1 : 0
      }
      put(s.x, s.y, STAR[level])
      if (s.kind === 2 && level === 2) {
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (isSky(s.x + ox, s.y + oy)) put(s.x + ox, s.y + oy, STAR[1])
      }
    }
  }
  function drawShootingStar() {
    if (reduced.matches) return
    const period = 210
    const k = t % period
    if (k >= 16) return
    const n = Math.floor(t / period)
    const hx = Math.floor((0.2 + 0.35 * hash(n, 1)) * AW) + k * 4
    const hy = Math.floor((0.04 + 0.22 * hash(n, 2)) * AH) + Math.floor(k * 1.6)
    for (let j = 0; j < 7; j++) {
      const x = hx - Math.round(j * 1.86)
      const y = hy - Math.round(j * 0.74)
      if (isSky(x, y)) put(x, y, j === 0 ? C.white : STAR[j < 3 ? 2 : j < 5 ? 1 : 0])
    }
  }

  /* ---------- Image ---------- */
  function render() {
    if (!px) return
    px.set(still)
    target = px
    drawStars()
    drawShootingStar()
    drawEarth()
    drawSatellite()
    drawLaunch()
    bctx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(buf, 0, 0, AW * B, AH * B)
  }

  const STEP = 1000 / 30 // 30 images par seconde suffisent au pixel art, et ménagent la batterie
  function loop(now) {
    if (!running) return
    if (now - last >= STEP) {
      last = now - ((now - last) % STEP)
      t += 1
      render()
    }
    frame = window.requestAnimationFrame(loop)
  }

  // Le bandeau suit la largeur de son conteneur (rotation du téléphone, fenêtre redimensionnée)
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

  function begin() {
    measure()
    render()
    if (reduced.matches || running) return
    running = true
    last = performance.now()
    frame = window.requestAnimationFrame(loop)
  }

  if (canvas.parentElement) resizer?.observe(canvas.parentElement)

  return {
    start() {
      if (!running) begin()
    },
    /** Pause, quand le bandeau sort de l'écran ; start() reprend là où on en était */
    stop() {
      running = false
      window.cancelAnimationFrame(frame)
    },
    /** Bascule entre la composition large et la composition téléphone */
    setCompact(value) {
      const next = value ? LAYOUTS.compact : LAYOUTS.wide
      if (next === L) return
      L = next
      measure()
      render()
    },
    /** Décollage de l'étage de remontée ; refusé si le visiteur préfère moins d'animations */
    fire() {
      if (reduced.matches || launchAt >= 0) return false
      launchAt = t
      if (!running) begin()
      return true
    },
    dispose() {
      running = false
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(resizeFrame)
      resizer?.disconnect()
    },
  }
}
