/**
 * Bandeau de la forme « Évolution », en pixel art à facteur entier (voir
 * leontechlab/hero.js pour le principe) : à gauche une salle de contrôle,
 * à droite la Terre et un satellite ; le titre HTML occupe le centre.
 */
import { clamp, hash, mapAt, paintEarth, painter, rgb, shade } from '../leontechlab/pixel.js'

export const LAYOUTS = {
  wide: { w: 480, h: 80, artW: 480, room: 150, earth: { x: 0.745, y: 0.56, r: 0.4 }, sat: { x: 0.845, y: 0.26 } },
  compact: { w: 240, h: 56, artW: 240, room: 80, earth: { x: 0.84, y: 0.55, r: 0.36 }, sat: { x: 0.64, y: 0.3 } },
}

const C = {
  sky: rgb('#000000'),
  wall: rgb('#0b0f14'),
  wallLight: rgb('#131a22'),
  desk: rgb('#2a2622'),
  deskTop: rgb('#4a433b'),
  caseDark: rgb('#3a3a3a'),
  caseMid: rgb('#5a5a5a'),
  caseLight: rgb('#8a8a8a'),
  screenOff: rgb('#061008'),
  screen: rgb('#0a2a14'),
  green: rgb('#33ff33'),
  greenDim: rgb('#1a7a2a'),
  amber: rgb('#ffb347'),
  amberDim: rgb('#8a5a14'),
  red: rgb('#ff4040'),
  white: rgb('#eafff0'),
  gold: rgb('#e0a82a'),
  goldDark: rgb('#8a6510'),
  cell: rgb('#1b4a8f'),
  cellLight: rgb('#3a7bd5'),
  steel: rgb('#b2b2b2'),
  steelDark: rgb('#6a6a6a'),
}
const STARS = [rgb('#3b4a3f'), rgb('#9fb3a6'), rgb('#eafff0')]

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

  /** Salle de contrôle : grand écran-planisphère, deux rangées de consoles, pupitre */
  function room(p) {
    const w = Math.round((L.room / L.w) * AW)
    p.grad(0, 0, w, AH - 1, [C.wall, C.wallLight], (x, y) => 0.5 - (y / AH) * 0.4 + hash(x >> 3, y >> 3) * 0.15)
    // Grand écran : planisphère en points, l'Afrique au centre
    const sx = Math.round(w * 0.08)
    const sy = Math.round(AH * 0.08)
    const sw = Math.round(w * 0.5)
    const sh = Math.round(AH * 0.36)
    p.rect(sx - 1, sy - 1, sx + sw, sy + sh, C.caseDark)
    p.rect(sx, sy, sx + sw - 1, sy + sh - 1, C.screenOff)
    for (let y = 0; y < sh; y += 1) {
      for (let x = 0; x < sw; x += 1) {
        if ((x + y) % 2) continue
        const lon = -180 + ((x + 0.5) / sw) * 360 + 20
        const lat = 90 - ((y + 0.5) / sh) * 180
        const kind = mapAt(lon, lat)
        if (kind) p.put(sx + x, sy + y, kind === 3 ? C.white : lon > -25 && lon < 60 && lat > -40 && lat < 40 ? C.green : C.greenDim)
      }
    }
    // Point qui clignote sur Dakar (17° O, 15° N)
    if (t % 40 < 20) {
      const dx = Math.round(((-17 + 180 - 20) / 360) * sw)
      const dy = Math.round(((90 - 15) / 180) * sh)
      p.put(sx + dx, sy + dy, C.red)
      p.put(sx + dx + 1, sy + dy, C.red)
    }
    // Consoles : deux rangées
    const rows = [Math.round(AH * 0.5), Math.round(AH * 0.7)]
    const mw = Math.max(8, Math.round(w / 7))
    const mh = Math.max(6, Math.round(AH * 0.14))
    rows.forEach((ry, r) => {
      for (let i = 0; i < 5; i++) {
        const mx = Math.round(w * 0.04 + i * (mw + 2) + (r ? mw / 2 : 0))
        if (mx + mw > w) continue
        p.rect(mx, ry, mx + mw - 1, ry + mh - 1, C.caseMid)
        p.hline(mx, mx + mw - 1, ry, C.caseLight)
        p.rect(mx + 1, ry + 1, mx + mw - 2, ry + mh - 2, C.screen)
        // Courbe ou colonnes, selon la console
        const amber = (i + r) % 3 === 0
        for (let x = 1; x < mw - 1; x++) {
          const k = hash(x + i * 31 + r * 7, Math.floor(t / 6) + i)
          const h = 1 + Math.floor(k * (mh - 3))
          if (amber) p.vline(mx + x, ry + mh - 1 - h, ry + mh - 2, k > 0.5 ? C.amber : C.amberDim)
          else p.put(mx + x, ry + 1 + Math.floor((Math.sin(x / 2 + t / 5 + i) + 1) * 0.5 * (mh - 3)), C.green)
        }
        // Voyant
        p.put(mx + mw - 2, ry + mh, (t + i * 7) % 30 < 15 ? C.green : C.red)
      }
    })
    // Pupitre
    const dy = Math.round(AH * 0.86)
    p.rect(0, dy, w, AH - 1, C.desk)
    p.hline(0, w, dy, C.deskTop)
    // Bord lumineux vers le centre
    p.vline(w, 0, AH - 1, C.wallLight)
  }

  function satellite(p, cx, cy) {
    // Panneaux
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? cx - 14 : cx + 5
      p.rect(x0, cy - 2, x0 + 9, cy + 1, C.cell)
      for (let x = x0; x <= x0 + 9; x += 3) p.vline(x, cy - 2, cy + 1, C.cellLight)
      p.hline(x0, x0 + 9, cy - 2, C.steel)
    }
    p.hline(cx - 5, cx + 5, cy, C.steel) // bras
    // Corps
    p.grad(cx - 3, cy - 3, cx + 3, cy + 3, [C.goldDark, C.gold], (x, y) => 0.4 + hash(x, y) * 0.6)
    p.put(cx - 3, cy - 3, C.white)
    // Antenne
    p.vline(cx, cy - 7, cy - 4, C.steelDark)
    p.hline(cx - 2, cx + 2, cy - 7, C.steel)
    p.put(cx, cy - 8, t % 30 < 15 ? C.red : C.steelDark)
  }

  function render() {
    if (!px) return
    px.fill(C.sky)
    const p = painter(px, AW, AH)
    p.stars(Math.round((AW * AH) / 90), C.sky, STARS, 5)
    // Étoiles qui scintillent : quelques-unes repassées plus claires
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(hash(i, 101) * AW)
      const y = Math.floor(hash(i, 103) * AH)
      if (p.get(x, y) !== C.sky || x < (L.room / L.w) * AW) continue
      if ((t + i * 9) % 60 < 20) p.put(x, y, C.white)
    }
    room(p)
    const e = L.earth
    const r = Math.max(8, Math.round(e.r * AH))
    paintEarth(p.put, { cx: Math.round(e.x * AW), cy: Math.round(e.y * AH), r, spin: reduced.matches ? 20 : t * 0.3, drift: reduced.matches ? 0 : t })
    satellite(p, Math.round(L.sat.x * AW), Math.round(L.sat.y * AH))
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

