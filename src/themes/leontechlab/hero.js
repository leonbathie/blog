/**
 * Bandeau d'accueil de « LeonTechLab » : champ d'étoiles, écusson de mission,
 * fusée et terminal à tube cathodique, dessinés en pixel art sur un canevas.
 *
 * L'écusson est un dessin original — hexagone, horizon vert, orbite dorée —
 * et non l'emblème d'une agence spatiale réelle : afficher le sceau d'une
 * organisation existante sur un site personnel laisserait entendre une
 * affiliation qui n'existe pas.
 */

export const HERO_W = 960
export const HERO_H = 260

const C = {
  sky: '#030905',
  star: '#eafff0',
  badgeField: '#0d2b4f',
  badgeEdge: '#f5b841',
  badgeRim: '#fff3d1',
  earth: '#22ff55',
  earthDark: '#0b3b17',
  orbit: '#ffd466',
  rocket: '#ddd0b8',
  rocketShade: '#b5a48b',
  rocketTip: '#f5b841',
  window: '#22ff55',
  flame: '#f5b841',
  flameHot: '#fff3d1',
  caseLight: '#ddd0b8',
  caseMid: '#b5a48b',
  caseDark: '#6e6049',
  screen: '#061109',
  screenGlow: '#22ff55',
}

export function createHero(canvas) {
  const ctx = canvas.getContext('2d')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  let frame = 0
  let running = false
  let t = 0
  /** Progression du décollage : 0 au sol, 1 hors champ */
  let launch = 0
  let launching = false

  const stars = Array.from({ length: 150 }, (_, i) => ({
    x: (i * 61) % HERO_W,
    y: (i * 37) % HERO_H,
    s: i % 11 === 0 ? 2 : 1,
    tw: (i * 13) % 60,
  }))

  function starfield() {
    for (const s of stars) {
      const on = (t + s.tw) % 70 > 22
      ctx.fillStyle = on ? C.star : 'rgba(234, 255, 240, 0.28)'
      ctx.fillRect(s.x, s.y, s.s, s.s)
    }
  }

  /** Écusson de mission hexagonal, original */
  function badge(cx, cy, r) {
    // Corps hexagonal
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2
      const px = cx + Math.cos(a) * r
      const py = cy + Math.sin(a) * r
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fillStyle = C.badgeField
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = C.badgeEdge
    ctx.stroke()

    // Horizon : la Terre vue d'orbite
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy + r * 0.72, r * 0.95, Math.PI, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.fillStyle = C.earthDark
    ctx.fillRect(cx - r, cy, r * 2, r)
    ctx.fillStyle = C.earth
    ctx.fillRect(cx - r, cy + r * 0.2, r * 2, 2)
    ctx.restore()

    // Orbite et satellite
    ctx.save()
    ctx.translate(cx, cy - r * 0.05)
    ctx.rotate(-0.42)
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.82, r * 0.3, 0, 0, Math.PI * 2)
    ctx.lineWidth = 2
    ctx.strokeStyle = C.orbit
    ctx.stroke()
    const a = t / 42
    ctx.fillStyle = C.badgeRim
    ctx.fillRect(Math.cos(a) * r * 0.82 - 2, Math.sin(a) * r * 0.3 - 2, 4, 4)
    ctx.restore()

    // Étoiles du champ
    ctx.fillStyle = C.badgeRim
    for (const [sx, sy] of [
      [-0.5, -0.52],
      [0.42, -0.58],
      [0.6, -0.2],
    ]) {
      ctx.fillRect(cx + sx * r, cy + sy * r, 2, 2)
    }

    // Sigle
    ctx.fillStyle = C.badgeEdge
    ctx.font = 'bold 20px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('LTL', cx, cy - r * 0.12)
  }

  /** Fusée : dessin générique, pas un véhicule existant */
  function rocket(x, baseY) {
    const rise = launch * (HERO_H + 120)
    const y = baseY - rise
    const sway = Math.sin(t / 9) * (launching ? 1 : 0.4)

    ctx.save()
    ctx.translate(x + sway, y)

    // Flamme
    if (launching || launch > 0) {
      const len = 14 + Math.abs(Math.sin(t / 3)) * 18
      ctx.fillStyle = C.flame
      ctx.beginPath()
      ctx.moveTo(-7, 46)
      ctx.lineTo(0, 46 + len)
      ctx.lineTo(7, 46)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = C.flameHot
      ctx.beginPath()
      ctx.moveTo(-3, 46)
      ctx.lineTo(0, 46 + len * 0.55)
      ctx.lineTo(3, 46)
      ctx.closePath()
      ctx.fill()
    }

    // Ailerons
    ctx.fillStyle = C.rocketShade
    ctx.fillRect(-14, 32, 6, 14)
    ctx.fillRect(8, 32, 6, 14)
    // Fuselage
    ctx.fillStyle = C.rocket
    ctx.fillRect(-8, -14, 16, 60)
    ctx.fillStyle = C.rocketShade
    ctx.fillRect(2, -14, 6, 60)
    // Nez
    ctx.fillStyle = C.rocketTip
    ctx.beginPath()
    ctx.moveTo(-8, -14)
    ctx.lineTo(0, -34)
    ctx.lineTo(8, -14)
    ctx.closePath()
    ctx.fill()
    // Hublot
    ctx.fillStyle = C.window
    ctx.fillRect(-4, 2, 8, 8)
    ctx.fillStyle = C.screen
    ctx.fillRect(-2, 4, 4, 4)

    ctx.restore()
  }

  /** Terminal à tube cathodique */
  function terminal(x, y) {
    // Boîtier
    ctx.fillStyle = C.caseLight
    ctx.fillRect(x, y, 150, 112)
    ctx.fillStyle = C.caseMid
    ctx.fillRect(x + 140, y, 10, 112)
    ctx.fillStyle = C.caseDark
    ctx.fillRect(x, y + 104, 150, 8)
    // Socle
    ctx.fillStyle = C.caseMid
    ctx.fillRect(x + 42, y + 112, 66, 10)
    ctx.fillStyle = C.caseDark
    ctx.fillRect(x + 28, y + 122, 94, 7)

    // Écran
    ctx.fillStyle = C.screen
    ctx.fillRect(x + 12, y + 12, 118, 82)
    // Globe filaire qui tourne
    const cx = x + 71
    const cy = y + 53
    ctx.strokeStyle = C.screenGlow
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, 26, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, Math.abs(Math.cos((t / 60 + i * 0.6) % Math.PI)) * 26, 26, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(cx - 26, cy)
    ctx.lineTo(cx + 26, cy)
    ctx.stroke()
    // Lignes de balayage sur l'écran
    ctx.fillStyle = 'rgba(3, 9, 5, 0.35)'
    for (let sy = y + 12; sy < y + 94; sy += 3) ctx.fillRect(x + 12, sy, 118, 1)
    // Curseur clignotant
    if (t % 60 < 32) {
      ctx.fillStyle = C.screenGlow
      ctx.fillRect(x + 18, y + 84, 6, 2)
    }
  }

  function paint() {
    ctx.fillStyle = C.sky
    ctx.fillRect(0, 0, HERO_W, HERO_H)
    starfield()
    badge(118, HERO_H / 2, 74)
    rocket(566, 196)
    // Le terminal reste à l'écart du bord droit : la devise « Dream it… » est
    // posée par-dessus en HTML, et les deux se chevauchaient.
    terminal(690, 66)
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
    canvas.width = HERO_W
    canvas.height = HERO_H
    ctx.imageSmoothingEnabled = false
  }

  return {
    start() {
      if (running) return
      resize()
      if (reduced.matches) {
        paint() // une image fixe, sans boucle
        return
      }
      running = true
      step()
    },
    stop() {
      running = false
      window.cancelAnimationFrame(frame)
    },
    /** Décollage, déclenché par le visiteur */
    fire() {
      if (launching) return false
      launching = true
      launch = 0.001
      return true
    },
    dispose() {
      running = false
      window.cancelAnimationFrame(frame)
    },
  }
}
