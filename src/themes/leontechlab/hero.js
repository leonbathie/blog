/**
 * Bandeau d'accueil de « LeonTechLab », dessiné en pixel art sur un canevas :
 * champ d'étoiles, écusson de mission à gauche, et à droite un sol lunaire
 * avec module d'alunissage, drapeau et la Terre qui tourne.
 *
 * L'écusson est un dessin original — disque bleu, orbite dorée, horizon
 * vert, sigle LTL — et non l'emblème d'une agence spatiale réelle : afficher
 * le sceau d'une organisation existante sur un site personnel laisserait
 * entendre une affiliation qui n'existe pas. Le drapeau planté est celui du
 * Sénégal, pays de l'auteur.
 *
 * Deux compositions : « large » (960 × 220) pour les écrans à partir de
 * 640 px, « compacte » (400 × 320) pour le téléphone, où le titre HTML vient
 * s'intercaler entre le ciel (écusson, Terre) et le sol (module, drapeau).
 */

export const LAYOUTS = {
  wide: {
    w: 960,
    h: 220,
    stars: 170,
    badge: { x: 120, y: 110, r: 78 },
    earth: { x: 878, y: 84, r: 52 },
    ground: { from: 590, y: 198 },
    lander: 732,
    flag: 812,
  },
  compact: {
    w: 400,
    h: 320,
    stars: 90,
    badge: { x: 62, y: 60, r: 46 },
    earth: { x: 338, y: 58, r: 40 },
    ground: { from: 0, y: 312 },
    // Module à droite, drapeau à sa gauche : la ligne « par … » du titre
    // passe au-dessus sans toucher l'antenne, même sur un écran de 360 px.
    lander: 330,
    flag: 250,
  },
}

const C = {
  sky: '#000000',
  star: '#eafff0',
  badgeField: '#0d2b4f',
  badgeRim: '#fff3d1',
  badgeGold: '#ffd21e',
  badgeHorizon: '#2fbf4a',
  badgeHorizonDark: '#0b3b17',
  sea: '#2a6fd6',
  seaDark: '#163f80',
  land: '#2fbf4a',
  landDark: '#1f8a34',
  atmosphere: '#9fe0ff',
  moonEdge: '#a8a8a8',
  moon: '#5e5e5e',
  moonDark: '#363636',
  crater: '#474747',
  craterRim: '#7a7a7a',
  gold: '#d9a520',
  goldDark: '#8a6510',
  silver: '#d8d8d8',
  silverDark: '#9a9a9a',
  black: '#101010',
  flame: '#ffd21e',
  flameHot: '#fff3d1',
  flagGreen: '#00853f',
  flagYellow: '#fdef42',
  flagRed: '#e31b23',
  beacon: '#ff5555',
}

/** Continents stylisés : longitude, latitude (−1 … 1) et demi-axes relatifs au rayon */
const CONTINENTS = [
  { lon: 0.1, lat: 0.05, rx: 0.34, ry: 0.42 }, // Afrique
  { lon: 0.25, lat: 0.62, rx: 0.3, ry: 0.16 }, // Europe
  { lon: 1.25, lat: 0.5, rx: 0.62, ry: 0.3 }, // Asie
  { lon: 2.2, lat: -0.52, rx: 0.26, ry: 0.16 }, // Océanie
  { lon: -1.6, lat: 0.5, rx: 0.4, ry: 0.3 }, // Amérique du Nord
  { lon: -1.15, lat: -0.35, rx: 0.22, ry: 0.4 }, // Amérique du Sud
]

export function createHero(canvas, { compact = false } = {}) {
  const ctx = canvas.getContext('2d')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  let L = compact ? LAYOUTS.compact : LAYOUTS.wide
  let frame = 0
  let running = false
  let t = 0
  /** Montée de l'étage de remontée : 0 posé, 1 hors champ */
  let launch = 0
  let launching = false
  let stars = []

  function seedStars() {
    stars = Array.from({ length: L.stars }, (_, i) => ({
      x: (i * 61 + 7) % L.w,
      y: (i * 37 + 3) % L.h,
      s: i % 11 === 0 ? 2 : 1,
      tw: (i * 13) % 60,
    }))
  }

  /** Hauteur du sol lunaire à l'abscisse x */
  function surface(x) {
    const { from, y } = L.ground
    const d = x - from
    return y - 5 * Math.sin(d / 38) - 3 * Math.sin(d / 11 + 1.3)
  }

  function starfield() {
    for (const s of stars) {
      const on = (t + s.tw) % 70 > 22
      ctx.fillStyle = on ? C.star : 'rgba(234, 255, 240, 0.3)'
      ctx.fillRect(s.x, s.y, s.s, s.s)
    }
  }

  /** Écusson de mission rond, original */
  function badge({ x: cx, y: cy, r }) {
    // Disque et liseré crème
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = C.badgeField
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = C.badgeRim
    ctx.stroke()
    // Anneau doré
    ctx.beginPath()
    ctx.arc(cx, cy, r - 7, 0, Math.PI * 2)
    ctx.lineWidth = 1.5
    ctx.strokeStyle = C.badgeGold
    ctx.stroke()

    // Horizon : la Terre vue d'orbite, dans le bas du disque
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r - 9, 0, Math.PI * 2)
    ctx.clip()
    ctx.beginPath()
    ctx.arc(cx, cy + r * 1.05, r * 0.95, 0, Math.PI * 2)
    ctx.fillStyle = C.badgeHorizonDark
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = C.badgeHorizon
    ctx.stroke()
    ctx.restore()

    // Orbite dorée et satellite en marche
    ctx.save()
    ctx.translate(cx, cy - r * 0.06)
    ctx.rotate(-0.45)
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.8, r * 0.26, 0, 0, Math.PI * 2)
    ctx.lineWidth = 2
    ctx.strokeStyle = C.badgeGold
    ctx.stroke()
    const a = t / 48
    ctx.fillStyle = C.badgeRim
    ctx.fillRect(Math.cos(a) * r * 0.8 - 2, Math.sin(a) * r * 0.26 - 2, 4, 4)
    ctx.restore()

    // Étoiles du champ
    ctx.fillStyle = C.badgeRim
    for (const [sx, sy] of [
      [-0.48, -0.5],
      [0.4, -0.56],
      [0.58, -0.18],
      [-0.6, -0.1],
    ]) {
      ctx.fillRect(Math.round(cx + sx * r), Math.round(cy + sy * r), 2, 2)
    }

    // Sigle
    ctx.fillStyle = C.badgeGold
    ctx.font = `${Math.round(r * 0.3)}px "Press Start 2P", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('LTL', cx, cy - r * 0.1)
  }

  /** La Terre : océan, continents qui défilent, ombre du terminateur */
  function earth({ x: cx, y: cy, r }) {
    // Halo atmosphérique
    ctx.beginPath()
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2)
    ctx.fillStyle = C.atmosphere
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = C.sea
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()

    // Continents : rotation lente autour de l'axe vertical
    const spin = t / 240
    for (const c of CONTINENTS) {
      const lon = c.lon + spin
      const depth = Math.cos(lon) // > 0 : face visible
      if (depth <= 0.05) continue
      const px = cx + Math.sin(lon) * r * Math.cos(c.lat * 1.2)
      const py = cy - c.lat * r * 0.9
      ctx.beginPath()
      ctx.ellipse(px, py, Math.max(1, c.rx * r * depth), c.ry * r, 0, 0, Math.PI * 2)
      ctx.fillStyle = depth > 0.45 ? C.land : C.landDark
      ctx.fill()
    }

    // Méridiens et parallèles, discrets
    ctx.strokeStyle = 'rgba(159, 224, 255, 0.28)'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI) / 3
      ctx.beginPath()
      ctx.ellipse(cx, cy, Math.abs(Math.cos(a)) * r, r, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (const k of [-0.5, 0, 0.5]) {
      ctx.beginPath()
      ctx.moveTo(cx - r, cy + k * r)
      ctx.lineTo(cx + r, cy + k * r)
      ctx.stroke()
    }

    // Terminateur : nuit sur le flanc droit
    const shade = ctx.createLinearGradient(cx - r, 0, cx + r, 0)
    shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
    shade.addColorStop(0.55, 'rgba(0, 0, 0, 0.05)')
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.6)')
    ctx.fillStyle = shade
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.restore()

    // Trame de pixels sur le globe
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
    for (let sy = cy - r; sy < cy + r; sy += 3) ctx.fillRect(cx - r, sy, r * 2, 1)
    ctx.restore()
  }

  /** Sol lunaire : relief doux, cratères, dégradé vers le bas du cadre */
  function ground() {
    const { from } = L.ground
    ctx.beginPath()
    ctx.moveTo(from, L.h)
    for (let x = from; x <= L.w; x += 4) ctx.lineTo(x, surface(x))
    ctx.lineTo(L.w, L.h)
    ctx.closePath()
    const fill = ctx.createLinearGradient(0, L.ground.y - 10, 0, L.h)
    fill.addColorStop(0, C.moon)
    fill.addColorStop(1, C.moonDark)
    ctx.fillStyle = fill
    ctx.fill()
    // Arête éclairée
    ctx.beginPath()
    for (let x = from; x <= L.w; x += 4) {
      const y = surface(x)
      x === from ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.lineWidth = 2
    ctx.strokeStyle = C.moonEdge
    ctx.stroke()

    // Cratères, posés en fraction de la largeur du sol
    const span = L.w - from
    for (const [k, rx, ry, dy] of [
      [0.12, 16, 5, 10],
      [0.3, 9, 3, 7],
      [0.52, 22, 6, 14],
      [0.8, 11, 4, 9],
      [0.94, 7, 2.5, 6],
    ]) {
      const cx = from + span * k
      const cy = surface(cx) + dy
      if (cy + ry > L.h) continue
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fillStyle = C.crater
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(cx, cy - 1, rx, ry, 0, Math.PI, Math.PI * 2)
      ctx.lineWidth = 1
      ctx.strokeStyle = C.craterRim
      ctx.stroke()
    }
  }

  /** Module d'alunissage : étage de descente doré, étage de remontée argenté */
  function lander(x) {
    const gy = Math.round(surface(x))
    const bodyW = 46
    const bodyH = 20
    const by = gy - 26 - bodyH

    // Pieds et jambes
    ctx.strokeStyle = C.silver
    ctx.lineWidth = 2
    for (const side of [-1, 1]) {
      const sx = x + side * (bodyW / 2 - 4)
      const fx = x + side * (bodyW / 2 + 16)
      ctx.beginPath()
      ctx.moveTo(sx, by + bodyH)
      ctx.lineTo(fx, gy - 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(sx, by + 6)
      ctx.lineTo(x + side * (bodyW / 2 + 9), gy - 11)
      ctx.stroke()
      ctx.fillStyle = C.silverDark
      ctx.fillRect(fx - 7, gy - 4, 14, 3)
    }

    // Étage de descente (feuille d'or)
    ctx.fillStyle = C.gold
    ctx.fillRect(x - bodyW / 2, by, bodyW, bodyH)
    ctx.fillStyle = C.goldDark
    ctx.fillRect(x - bodyW / 2, by + bodyH - 5, bodyW, 5)
    ctx.fillRect(x + bodyW / 2 - 6, by, 6, bodyH)
    ctx.fillStyle = C.black
    for (const px of [-16, -4, 8]) ctx.fillRect(x + px, by + 5, 6, 6)
    // Tuyère
    ctx.fillStyle = C.black
    ctx.beginPath()
    ctx.moveTo(x - 6, by + bodyH)
    ctx.lineTo(x - 10, by + bodyH + 10)
    ctx.lineTo(x + 10, by + bodyH + 10)
    ctx.lineTo(x + 6, by + bodyH)
    ctx.closePath()
    ctx.fill()

    // Étage de remontée (décolle au clic)
    const rise = launch * (L.h + 80)
    const ay = by - 24 - rise
    if (launching || launch > 0) {
      const len = 12 + Math.abs(Math.sin(t / 3)) * 16
      ctx.fillStyle = C.flame
      ctx.beginPath()
      ctx.moveTo(x - 8, ay + 24)
      ctx.lineTo(x, ay + 24 + len)
      ctx.lineTo(x + 8, ay + 24)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = C.flameHot
      ctx.beginPath()
      ctx.moveTo(x - 3, ay + 24)
      ctx.lineTo(x, ay + 24 + len * 0.55)
      ctx.lineTo(x + 3, ay + 24)
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillStyle = C.silver
    ctx.fillRect(x - 14, ay, 28, 24)
    ctx.fillStyle = C.silverDark
    ctx.fillRect(x + 8, ay, 6, 24)
    ctx.fillRect(x - 14, ay + 20, 28, 4)
    // Hublot et écoutille
    ctx.fillStyle = C.black
    ctx.fillRect(x - 10, ay + 6, 7, 7)
    ctx.fillRect(x + 1, ay + 9, 6, 11)
    // Mât, antenne parabolique et balise
    ctx.fillStyle = C.silver
    ctx.fillRect(x - 1, ay - 18, 2, 18)
    ctx.beginPath()
    ctx.arc(x, ay - 20, 6, Math.PI, Math.PI * 2)
    ctx.lineWidth = 2
    ctx.strokeStyle = C.silver
    ctx.stroke()
    ctx.fillRect(x + 9, ay - 8, 1, 8)
    if (t % 40 < 20) {
      ctx.fillStyle = C.beacon
      ctx.fillRect(x + 8, ay - 11, 3, 3)
    }
  }

  /** Drapeau du Sénégal planté dans le sol */
  function flag(x) {
    const gy = Math.round(surface(x))
    ctx.fillStyle = C.silver
    ctx.fillRect(x, gy - 50, 2, 50)
    const fy = gy - 50
    const w = 9
    const h = 16
    const wave = Math.round(Math.sin(t / 10)) // léger frémissement d'un pixel
    ctx.fillStyle = C.flagGreen
    ctx.fillRect(x + 2, fy, w, h)
    ctx.fillStyle = C.flagYellow
    ctx.fillRect(x + 2 + w, fy, w, h)
    ctx.fillStyle = C.flagRed
    ctx.fillRect(x + 2 + 2 * w, fy + wave, w, h)
    // Étoile verte : une croix de pixels au centre
    ctx.fillStyle = C.flagGreen
    const sx = x + 2 + w + Math.floor(w / 2)
    const sy = fy + Math.floor(h / 2)
    ctx.fillRect(sx - 1, sy, 3, 1)
    ctx.fillRect(sx, sy - 1, 1, 3)
  }

  function paint() {
    ctx.fillStyle = C.sky
    ctx.fillRect(0, 0, L.w, L.h)
    starfield()
    badge(L.badge)
    earth(L.earth)
    ground()
    flag(L.flag)
    lander(L.lander)
  }

  function step() {
    if (!running) return
    t += 1
    if (launching) {
      launch = Math.min(1, launch + 0.012)
      if (launch >= 1) {
        launching = false
        launch = 0
      }
    }
    paint()
    frame = window.requestAnimationFrame(step)
  }

  function resize() {
    canvas.width = L.w
    canvas.height = L.h
    ctx.imageSmoothingEnabled = false
  }

  function begin() {
    resize()
    seedStars()
    if (reduced.matches) {
      paint() // une image fixe, sans boucle
      // Le sigle de l'écusson attend sa police : on repeint quand elle arrive
      document.fonts?.ready.then(() => paint()).catch(() => {})
      return
    }
    running = true
    window.cancelAnimationFrame(frame)
    step()
  }

  return {
    start() {
      if (running) return
      begin()
    },
    /** Bascule entre la composition large et la composition téléphone */
    setCompact(value) {
      const next = value ? LAYOUTS.compact : LAYOUTS.wide
      if (next === L) return
      L = next
      running = false
      window.cancelAnimationFrame(frame)
      begin()
    },
    /** Décollage de l'étage de remontée, déclenché par le visiteur */
    fire() {
      // Mouvement réduit : pas de décollage, donc pas d'annonce non plus
      if (launching || reduced.matches) return false
      launching = true
      launch = 0.001
      if (!running && !reduced.matches) begin()
      return true
    },
    /** Pause, quand le bandeau sort de l'écran ; start() reprend là où on en était */
    stop() {
      running = false
      window.cancelAnimationFrame(frame)
    },
    dispose() {
      running = false
      window.cancelAnimationFrame(frame)
    },
  }
}
