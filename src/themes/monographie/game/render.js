import { LEVEL_H, LEVEL_W, TILE } from './levels.js'

/**
 * Rendu d'« Arcade 221 » sur un canevas 2D.
 *
 * Résolution logique 320 × 180, agrandie en CSS avec `image-rendering: pixelated`.
 * Le choix de 320 n'est pas esthétique mais technique : à 480, le canevas était
 * RÉDUIT sur un téléphone (480 logiques pour ~343 px réels, soit 0,71×). Un
 * rendu pixelisé qui rétrécit supprime des rangées entières de pixels, et les
 * personnages paraissaient sales. À 320, l'image est agrandie partout.
 *
 * Palette : le crépuscule sur Dakar du décor d'origine — indigo, prune, braise,
 * puces d'or et circuit cuivré.
 */

export const VIEW_W = 320
export const VIEW_H = 180

// Assets are optional: a failed or still-loading image leaves the vector world playable.
const artwork = {}
function getArtwork(name, extension) {
  if (typeof Image === 'undefined') return null
  if (!artwork[name]) {
    const img = new Image()
    img.src = `${import.meta.env.BASE_URL}arcade/${name}.${extension}`
    artwork[name] = img
  }
  const img = artwork[name]
  return img.complete && img.naturalWidth > 0 ? img : null
}

const WORLD_W = LEVEL_W * TILE
const GROUND_Y = (LEVEL_H - 3) * TILE // haut de la rangée de sol

const C = {
  skyTop: '#171029',
  skyMid: '#3a1c35',
  skyLow: '#7c3517',
  skyHorizon: '#b45309',
  star: 'rgba(255, 237, 213, 0.5)',
  // La ville est un décor : elle doit rester en retrait derrière l'action,
  // sinon le joueur et les patrouilleurs deviennent illisibles.
  city: 'rgba(26, 12, 24, 0.55)',
  window: 'rgba(253, 224, 71, 0.22)',
  groundFill: '#3b1d0c',
  groundTop: '#fbbf24',
  trace: '#b45309',
  pad: '#fde68a',
  bridge: '#92400e',
  bridgeTop: '#f59e0b',
  chipFace: '#f59e0b',
  chipEdge: '#7c2d12',
  chipPin: '#92400e',
  chipGlow: 'rgba(251, 191, 36, 0.85)',
  spike: '#f87171',
  spikeHot: '#fecaca',
  // Les dangers tirent vers le rouge, le joueur vers le clair : à cette taille,
  // c'est la seule façon de les distinguer d'un coup d'œil sur fond sombre.
  walker: '#7f1d1d',
  walkerTrim: '#f87171',
  walkerEye: '#fef08a',
  exitBody: '#4a382a',
  exitScreen: '#fde68a',
  suit: '#fb923c',
  suitDark: '#9a3412',
  panel: '#fed7aa',
  visor: '#a5f3fc',
  visorDark: '#0e7490',
  pack: '#7c2d12',
  packLight: '#fbbf24',
  boot: '#fef3c7',
}

/* Décor déterministe : il ne doit pas scintiller d'une image à l'autre */
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: (i * 137) % WORLD_W,
  y: 4 + ((i * 53) % 120),
  s: (i * 31) % 7 === 0 ? 2 : 1,
}))

const SKYLINE = (() => {
  const out = []
  for (let x = 0, i = 0; x < WORLD_W; i++) {
    const w = 22 + ((i * 17) % 22)
    const h = 12 + ((i * 29) % 20)
    const windows = []
    for (let wy = 5; wy < h - 4; wy += 8) {
      for (let wx = 5; wx < w - 5; wx += 9) if ((wx * 7 + wy * 3 + i) % 11 === 0) windows.push({ x: wx, y: wy })
    }
    out.push({ x, w, h, windows })
    x += w + 8 + ((i * 11) % 14)
  }
  return out
})()

function sky(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H)
  g.addColorStop(0, C.skyTop)
  g.addColorStop(0.55, C.skyMid)
  g.addColorStop(0.85, C.skyLow)
  g.addColorStop(1, C.skyHorizon)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)
}

/** Étoiles et ville : plans lointains, dessinés en coordonnées écran */
function parallax(ctx, cam) {
  const village = getArtwork('village', 'png')
  if (village) {
    // A slow camera drift gives the illustrated village depth without a visible
    // repeating seam. Keep the whole viewport covered even during jumps.
    const height = VIEW_H + 24
    const width = Math.max(VIEW_W + 70, height * village.naturalWidth / village.naturalHeight)
    const travel = Math.max(0, width - VIEW_W)
    const x = -Math.min(travel, cam.x / Math.max(1, WORLD_W - VIEW_W) * travel)
    ctx.save()
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(village, x, -12, width, height)
    ctx.restore()
    return
  }
  // A warm distant sun gives the little world its own horizon.
  const sunX = Math.round(225 - cam.x * 0.025)
  const sunY = Math.round(56 - cam.y * 0.12)
  ctx.fillStyle = 'rgba(251, 146, 60, 0.10)'
  ctx.beginPath()
  ctx.arc(sunX, sunY, 31, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.arc(sunX, sunY, 22, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = '#f7a65b'
  ctx.fillRect(sunX - 22, sunY - 22, 44, 44)
  ctx.fillStyle = 'rgba(124, 53, 68, 0.45)'
  for (let i = 0; i < 4; i++) ctx.fillRect(sunX - 22, sunY + 3 + i * 5, 44, 2)
  ctx.restore()
  ctx.fillStyle = C.star
  for (const s of STARS) {
    const x = s.x - cam.x * 0.15
    const y = s.y - cam.y * 0.3
    if (x < -4 || x > VIEW_W + 4 || y < -4 || y > VIEW_H) continue
    ctx.fillRect(Math.round(x), Math.round(y), s.s, s.s)
  }

  // La ville reste collée au sol : pas de parallaxe verticale, sinon elle
  // décolle de l'horizon dès que le joueur saute.
  const base = GROUND_Y - cam.y
  if (base < -40 || base > VIEW_H + 40) return
  for (const b of SKYLINE) {
    const x = Math.round(b.x - cam.x * 0.35)
    if (x + b.w < -10 || x > VIEW_W + 10) continue
    ctx.fillStyle = C.city
    ctx.fillRect(x, Math.round(base - b.h), b.w, b.h)
    ctx.fillRect(x + Math.floor(b.w / 2), Math.round(base - b.h - 4), 1, 4)
    ctx.fillStyle = C.window
    for (const w of b.windows) ctx.fillRect(x + w.x, Math.round(base - b.h + w.y), 2, 3)
  }
}

/** A separate, illustrated sky world: the existing village stays untouched. */
function paradise(ctx, state, cam, t) {
  const art = getArtwork('paradise', 'png')
  if (art) {
    // Cover the viewport at every height, with a restrained vertical drift.
    const height = VIEW_H + 60
    const width = Math.max(VIEW_W + 40, height * art.naturalWidth / art.naturalHeight)
    const progress = Math.max(0, Math.min(1, cam.y / Math.max(1, state.worldHeight - VIEW_H)))
    const travel = width - VIEW_W
    const x = -Math.max(0, Math.min(travel, travel / 2 + (cam.x - (WORLD_W - VIEW_W) / 2) * 0.08))
    ctx.save()
    ctx.imageSmoothingEnabled = true
    // The second ascent explores the same landscape from the opposite side.
    if (state.levelIndex === 7) {
      ctx.translate(VIEW_W, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(art, x, -8 - progress * 44, width, height)
    ctx.restore()
    if (state.levelIndex === 7) {
      ctx.fillStyle = 'rgba(28, 123, 157, 0.09)'
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)
    }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H)
    gradient.addColorStop(0, '#246b9c')
    gradient.addColorStop(0.55, '#7bd8d1')
    gradient.addColorStop(1, '#f9dba3')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }

  // Small drifting clouds, birds and floating petals breathe without hiding play.
  ctx.save()
  for (let i = 0; i < 5; i++) {
    const x = ((i * 83 + t * (0.035 + i * 0.006)) % 400) - 40
    const y = 14 + (i * 31) % 132 + Math.sin(t / 70 + i) * 2
    ctx.fillStyle = 'rgba(255, 252, 227, 0.18)'
    ctx.beginPath()
    ctx.ellipse(x, y, 15 + i % 3 * 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = 'rgba(41, 72, 73, 0.65)'
  ctx.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    const x = ((i * 91 + t * (0.12 + i * 0.01)) % 360) - 20
    const y = 18 + (i * 37) % 82 + Math.sin(t / 18 + i) * 2
    const wing = 1 + Math.sin(t / 6 + i) * 2
    ctx.beginPath()
    ctx.moveTo(x - 4, y - wing)
    ctx.lineTo(x, y)
    ctx.lineTo(x + 4, y - wing)
    ctx.stroke()
  }
  for (let i = 0; i < 12; i++) {
    const x = ((i * 67 + Math.sin(t / 45 + i) * 7 + 340) % 340)
    const y = ((i * 31 + t * (0.12 + (i % 3) * 0.035)) % 190) - 5
    ctx.fillStyle = i % 2 ? 'rgba(255, 236, 161, 0.7)' : 'rgba(255, 182, 182, 0.65)'
    ctx.fillRect(Math.round(x), Math.round(y), 2, 1)
  }
  ctx.restore()
}

/** Sol et passerelles */
function terrain(ctx, state, cam) {
  const first = Math.max(0, Math.floor(cam.x / TILE) - 1)
  const last = Math.min(LEVEL_W - 1, Math.ceil((cam.x + VIEW_W) / TILE) + 1)
  const topRow = Math.max(0, Math.floor(cam.y / TILE) - 1)
  const bottomRow = Math.min(state.tiles.length - 1, Math.ceil((cam.y + VIEW_H) / TILE) + 1)

  for (let ty = topRow; ty <= bottomRow; ty++) {
    for (let tx = first; tx <= last; tx++) {
      const t = state.tiles[ty][tx]
      if (t !== '#' && t !== '-') continue
      const x = tx * TILE
      const y = ty * TILE

      if (t === '#') {
        // Sun-baked stone and patterned borders echo the village illustration.
        ctx.fillStyle = (tx + ty) % 2 ? '#9a4a20' : '#ad5828'
        ctx.fillRect(x, y, TILE, TILE)
        ctx.fillStyle = '#713017'
        ctx.fillRect(x, y + 7, TILE, 1)
        ctx.fillRect(x + ((ty % 2) ? 5 : 10), y + 1, 1, 6)
        ctx.fillRect(x + ((ty % 2) ? 11 : 4), y + 8, 1, 8)
        ctx.fillStyle = '#d78132'
        ctx.fillRect(x + 1, y + 2, 3, 1)
        ctx.fillRect(x + 8, y + 10, 4, 1)
        if (ty === 0 || state.tiles[ty - 1][tx] !== '#') {
          ctx.fillStyle = '#773319'
          ctx.fillRect(x, y, TILE, 4)
          ctx.fillStyle = '#f6b33c'
          ctx.fillRect(x, y, TILE, 2)
          ctx.fillStyle = '#ffe08a'
          ctx.fillRect(x + 1, y, TILE - 2, 1)
          ctx.fillStyle = '#5e9c34'
          if (tx % 3 === 0) ctx.fillRect(x + 2, y - 1, 7, 1)
        }
        if ((tx + ty * 3) % 5 === 0) {
          ctx.fillStyle = '#f9bd4b'
          ctx.fillRect(x + 6, y + 3, 4, 4)
          ctx.fillStyle = '#8b3e20'
          ctx.fillRect(x + 7, y + 4, 2, 2)
        }
      } else {
        // Patterned, solid-edged platform remains legible against the scenery.
        ctx.fillStyle = state.adventure === 'sky' ? '#284c39' : '#773319'
        ctx.fillRect(x, y + 2, TILE, 7)
        ctx.fillStyle = state.adventure === 'sky' ? '#ecce72' : '#f7b542'
        ctx.fillRect(x, y + 2, TILE, 2)
        ctx.fillStyle = '#2d9c9d'
        ctx.fillRect(x + 1, y + 4, 3, 2)
        ctx.fillRect(x + 9, y + 4, 3, 2)
        ctx.fillStyle = '#ffe087'
        ctx.fillRect(x + 5, y + 4, 2, 2)
        ctx.fillRect(x + 13, y + 4, 2, 2)
      }
    }
  }
}

const visible = (cam, x, w) => x + w >= cam.x - 16 && x <= cam.x + VIEW_W + 16

function chips(ctx, state, cam, t) {
  for (const c of state.chips) {
    if (c.taken || !visible(cam, c.x, c.w)) continue
    const bob = Math.sin(t / 16 + c.x / 24) * 1.5
    const x = Math.round(c.x)
    const y = Math.round(c.y + bob)

    ctx.shadowColor = C.chipGlow
    ctx.shadowBlur = 8
    ctx.fillStyle = C.chipPin
    ctx.fillRect(x - 1, y + 2, 1, 2)
    ctx.fillRect(x + c.w, y + 2, 1, 2)
    ctx.fillRect(x - 1, y + 6, 1, 2)
    ctx.fillRect(x + c.w, y + 6, 1, 2)
    ctx.fillStyle = C.chipEdge
    ctx.fillRect(x, y, c.w, c.h)
    ctx.fillStyle = C.chipFace
    ctx.fillRect(x + 1, y + 1, c.w - 2, c.h - 2)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff2b3'
    ctx.fillRect(x + 2, y + 2, 4, 1)
    ctx.fillRect(x + 2, y + 3, 1, 3)
    ctx.fillStyle = C.chipEdge
    ctx.fillRect(x + 5, y + 4, 2, 2)
    // A glint makes collectibles discoverable at a glance.
    if (Math.floor(t / 12 + c.x / 16) % 4 === 0) {
      ctx.fillStyle = '#fff7d1'
      ctx.fillRect(x + c.w + 2, y - 2, 1, 5)
      ctx.fillRect(x + c.w, y, 5, 1)
    }
  }
}

/** Surtension : arc électrique au sol, qui palpite */
function spikes(ctx, state, cam, t) {
  const flicker = (Math.sin(t / 5) + 1) / 2
  for (const s of state.spikes) {
    if (!visible(cam, s.x, s.w)) continue
    const x = Math.round(s.x)
    ctx.fillStyle = C.spike
    for (let i = 0; i < s.w; i += 4) {
      ctx.fillRect(x + i, s.y + 4, 3, 4)
      ctx.fillRect(x + i + 1, s.y, 1, 4)
    }
    ctx.fillStyle = `rgba(254, 202, 202, ${(0.35 + flicker * 0.5).toFixed(2)})`
    ctx.fillRect(x, s.y - 1, s.w, 1)
    // Décharge qui monte par intermittence : le danger se signale de loin
    if (flicker > 0.75) {
      ctx.fillStyle = `rgba(254, 226, 226, ${(flicker - 0.75).toFixed(2)})`
      ctx.fillRect(x + 2, s.y - 5, 1, 4)
      ctx.fillRect(x + s.w - 4, s.y - 4, 1, 3)
    }
  }
}

// Electric barriers have a visible countdown before they turn back on.
function gates(ctx, state, cam, t) {
  for (const gate of state.gates) {
    if (!visible(cam, gate.x, gate.w)) continue
    const x = Math.round(gate.x)
    const y = Math.round(gate.y)
    const cycle = (state.frames + gate.offset) % 180
    ctx.fillStyle = '#574162'
    ctx.fillRect(x - 2, y + gate.h - 3, gate.w + 4, 3)
    if (gate.active) {
      ctx.fillStyle = 'rgba(244, 114, 182, 0.32)'
      ctx.fillRect(x - 3, y, gate.w + 6, gate.h - 3)
      ctx.fillStyle = '#f9a8d4'
      for (let i = 0; i < gate.h - 3; i += 4) {
        ctx.fillRect(x + ((i + Math.floor(t / 3)) % 5), y + i, 3, 4)
      }
      ctx.fillStyle = '#fff1f2'
      ctx.fillRect(x + 3, y, 1, gate.h - 3)
    } else {
      ctx.fillStyle = cycle > 160 && Math.floor(t / 4) % 2 ? '#fb7185' : '#a78bfa'
      ctx.fillRect(x + 2, y + gate.h - 5, 4, 2)
    }
  }
}

/**
 * Patrouilleur : petit robot de maintenance devenu hostile.
 * Châssis sombre cerclé de rouge, œil-scanner dans le sens de marche, bande
 * d'avertissement et chenilles animées — il doit se lire comme un danger
 * en un coup d'œil, et ne jamais être confondu avec le joueur.
 */
function walkers(ctx, state, cam, t) {
  const roll = Math.floor(t / 5) % 3
  for (const w of state.walkers) {
    if (!w.alive || !visible(cam, w.x, w.w)) continue
    const x = Math.round(w.x)
    const y = Math.round(w.y)
    const right = w.vx > 0
    if (w.kind === 'monkey') {
      drawMonkey(ctx, w, t, state.player)
      continue
    }
    const runner = w.kind === 'runner'
    const robot = getArtwork('robot', 'png')
    if (robot) {
      ctx.save()
      ctx.imageSmoothingEnabled = true
      ctx.translate(x + w.w / 2, y + w.h)
      if (!right) ctx.scale(-1, 1)
      const bounce = Math.sin(t / 7) * 0.5
      const height = 22
      const width = height * robot.naturalWidth / robot.naturalHeight
      ctx.drawImage(robot, -width / 2, -height + bounce, width, height)
      ctx.restore()
      continue
    }
    const trim = runner ? '#c084fc' : C.walkerTrim

    // Antenne et témoin clignotant
    const blink = Math.floor(t / 10) % 2 === 0
    ctx.fillStyle = trim
    ctx.fillRect(x + (right ? 10 : 3), y - 3, 1, 3)
    if (blink) {
      ctx.fillStyle = C.walkerEye
      ctx.fillRect(x + (right ? 9 : 2), y - 5, 3, 2)
    }

    // Châssis
    ctx.fillStyle = runner ? '#4c1d95' : C.walker
    ctx.fillRect(x, y, w.w, w.h - 3)
    // Cerclage clair sur le haut et les flancs : détache la masse du décor
    ctx.fillStyle = trim
    ctx.fillRect(x, y, w.w, 1)
    ctx.fillRect(x, y, 1, w.h - 3)
    ctx.fillRect(x + w.w - 1, y, 1, w.h - 3)

    // Bande d'avertissement
    ctx.fillStyle = C.walkerEye
    for (let i = 1; i < w.w - 1; i += 3) ctx.fillRect(x + i, y + 8, 2, 1)

    // Œil-scanner, tourné vers l'avant
    const ex = right ? w.w - 6 : 2
    ctx.fillStyle = '#450a0a'
    ctx.fillRect(x + ex - 1, y + 2, 6, 5)
    ctx.fillStyle = C.walkerEye
    ctx.fillRect(x + ex, y + 3, 4, 3)
    ctx.fillStyle = '#fff7ed'
    ctx.fillRect(x + ex + (right ? 2 : 0), y + 4, 2, 1)

    // Les robots rapides portent des oreilles et un eclair distinctifs.
    if (runner) {
      ctx.fillStyle = '#e9d5ff'
      ctx.fillRect(x + 1, y - 2, 3, 2)
      ctx.fillRect(x + w.w - 4, y - 2, 3, 2)
      ctx.fillRect(x + 6, y + 5, 2, 3)
    }

    // Chenilles : trois phases, le déplacement se voit même à l'arrêt visuel
    ctx.fillStyle = '#450a0a'
    ctx.fillRect(x, y + w.h - 3, w.w, 3)
    ctx.fillStyle = trim
    for (let i = roll; i < w.w; i += 3) ctx.fillRect(x + i, y + w.h - 2, 1, 1)
  }
}

/** Expressive monkey silhouettes sit within their physical collision box. */
function drawMonkey(ctx, w, t, player) {
  const x = Math.round(w.x + w.w / 2)
  const y = Math.round(w.y + w.h)
  const flip = w.vx < 0 ? -1 : 1
  const sway = Math.sin(t / 10 + w.home / 20)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(flip, 1)
  ctx.lineCap = 'round'
  // A curved, moving tail makes them recognisable against the foliage.
  ctx.strokeStyle = '#542637'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(-4, -5)
  ctx.bezierCurveTo(-10, -2, -12, -9 - sway, -8, -11 - sway)
  ctx.stroke()
  ctx.fillStyle = '#71333b'
  ctx.beginPath()
  ctx.ellipse(0, -5, 5.2, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#bd7652'
  ctx.beginPath()
  ctx.ellipse(1, -5, 2.6, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  // Feet and a waving arm show the attack even at the game's small scale.
  ctx.strokeStyle = '#512334'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(-2, -2); ctx.lineTo(-4 + sway, -0.5)
  ctx.moveTo(2, -2); ctx.lineTo(4 - sway, -0.5)
  ctx.moveTo(3, -7); ctx.lineTo(6, -9 + sway)
  ctx.stroke()
  ctx.fillStyle = '#71333b'
  ctx.beginPath()
  ctx.arc(-4, -12, 2.5, 0, Math.PI * 2)
  ctx.arc(4, -12, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(0, -12, 5.3, 4.8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e8ae78'
  ctx.beginPath()
  ctx.ellipse(1, -11, 3.5, 2.6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2b1e27'
  ctx.fillRect(1, -13, 1, 1)
  ctx.fillRect(4, -12, 1, 1)
  ctx.fillStyle = '#fff3d0'
  ctx.fillRect(1, -13, 1, 1)
  ctx.restore()
  if (w.throwCooldown <= 30 && Math.abs(player.x - w.x) < 190 && Math.abs(player.y - w.y) < 100) {
    // A high-contrast warning precedes the projectile for roughly half a second.
    ctx.fillStyle = '#56282a'
    ctx.fillRect(x - 3, y - 24, 7, 9)
    ctx.fillStyle = Math.floor(t / 5) % 2 ? '#fff7cb' : '#ffd143'
    ctx.fillRect(x - 2, y - 23, 5, 7)
    ctx.fillStyle = '#793327'
    ctx.fillRect(x, y - 22, 1, 3)
    ctx.fillRect(x, y - 18, 1, 1)
  }
}

function bananas(ctx, state, cam, t) {
  for (const banana of state.bananas || []) {
    if (!visible(cam, banana.x, banana.w) || banana.y + banana.h < cam.y - 10 || banana.y > cam.y + VIEW_H + 10) continue
    ctx.save()
    ctx.translate(Math.round(banana.x + banana.w / 2), Math.round(banana.y + banana.h / 2))
    ctx.rotate(Math.sin(t / 8 + banana.x / 30) * 0.25)
    // Dark outline and bright yellow shape are visible against sky and leaves.
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#623c18'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-1, 5, 4, -1)
    ctx.stroke()
    ctx.strokeStyle = '#ffe053'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#fff6ad'
    ctx.fillRect(-2, 1, 3, 1)
    ctx.restore()
  }
}

function exitTerminal(ctx, state, cam, t) {
  const e = state.exit
  if (!visible(cam, e.x, e.w)) return
  const x = Math.round(e.x)
  ctx.fillStyle = C.exitBody
  ctx.fillRect(x, e.y, e.w, e.h)
  ctx.fillStyle = C.chipEdge
  ctx.fillRect(x, e.y, e.w, 2)
  // Écran qui clignote doucement
  const on = (Math.sin(t / 14) + 1) / 2
  ctx.fillStyle = `rgba(253, 230, 138, ${(0.45 + on * 0.5).toFixed(2)})`
  ctx.fillRect(x + 2, e.y + 4, e.w - 4, 10)
  ctx.fillStyle = C.exitBody
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 3, e.y + 6 + i * 3, e.w - 6, 1)
  // Voyants
  ctx.fillStyle = C.groundTop
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 3 + i * 4, e.y + 18, 2, 2)
}

/** The little explorer: expressive helmet, scarf and lab satchel. */
function player(ctx, state, scale = [1, 1], t = 0) {
  const p = state.player
  const x = Math.round(p.x)
  const y = Math.round(p.y)
  const animatedExplorer = getArtwork('explorer-animated', 'png')
  if (animatedExplorer) {
    // Grounded distance rather than time keeps each step tied to movement.
    const walking = p.onGround && p.groundTravel > 0.001
    const frame = !p.onGround ? 7 : walking ? 1 + Math.floor(p.anim / 5) % 6 : 0
    const frameWidth = animatedExplorer.naturalWidth / 4
    const frameHeight = animatedExplorer.naturalHeight / 2
    // Match the previous illustration's visible height. Individual soles sit
    // at slightly different source rows, so align them to the ground here.
    const height = 43
    const width = height * frameWidth / frameHeight
    const soleRow = [429, 425, 424, 425, 426, 424, 426, 426][frame]
    ctx.save()
    ctx.imageSmoothingEnabled = true
    ctx.translate(x + p.w / 2, y + p.h)
    ctx.scale(scale[0] * (p.dir < 0 ? -1 : 1), scale[1])
    ctx.drawImage(animatedExplorer, (frame % 4) * frameWidth, Math.floor(frame / 4) * frameHeight, frameWidth, frameHeight, -width / 2, -height * soleRow / frameHeight, width, height)
    ctx.restore()
    return
  }
  const explorer = getArtwork('explorer', 'png')
  if (explorer) {
    const walking = p.onGround && Math.abs(p.vx) > 0.2
    const bounce = walking ? Math.abs(Math.sin(p.anim / 6)) : 0
    ctx.save()
    ctx.imageSmoothingEnabled = true
    ctx.translate(x + p.w / 2, y + p.h)
    ctx.scale(scale[0] * (p.dir < 0 ? -1 : 1), scale[1])
    // The scarf trails behind the body; align the body (not the whole PNG)
    // with the collision box and retain the illustration's aspect ratio.
    const height = 40
    const width = height * explorer.naturalWidth / explorer.naturalHeight
    const lean = walking ? Math.sin(p.anim / 6) * 0.025 : (!p.onGround ? -0.04 : 0)
    ctx.rotate(lean)
    ctx.drawImage(explorer, -width * 0.6, -height - bounce, width, height)
    ctx.restore()
    return
  }
  const walking = p.onGround && Math.abs(p.vx) > 0.2
  const stride = walking ? Math.floor(p.anim / 6) % 2 : 0
  const airborne = !p.onGround
  const blink = p.onGround && !walking && t % 180 >= 175
  const bob = walking ? stride : (p.onGround && Math.sin(t / 20) > 0.75 ? 1 : 0)

  ctx.save()
  const fx = x + p.w / 2
  const fy = y + p.h
  ctx.translate(fx, fy)
  ctx.scale(scale[0] * (p.dir < 0 ? -1 : 1), scale[1])
  ctx.translate(-fx, -fy)

  if (p.onGround) {
    ctx.fillStyle = 'rgba(18, 10, 28, 0.42)'
    ctx.fillRect(x, y + p.h, p.w, 1)
  }

  // The scarf flutters while running or jumping.
  const flutter = airborne ? Math.floor(t / 6) % 2 : walking ? stride : Math.floor(t / 25) % 2
  ctx.fillStyle = '#a74319'
  ctx.fillRect(x - 4 - flutter, y + 9 - bob, 7, 3)
  ctx.fillStyle = '#ffd653'
  ctx.fillRect(x - 4 - flutter, y + 9 - bob, 7, 2)
  ctx.fillRect(x - 5 - flutter, y + 10 - bob, 3, 2)

  ctx.fillStyle = '#582640'
  ctx.fillRect(x - 1, y + 10, 4, 7)
  ctx.fillStyle = '#df6b3b'
  ctx.fillRect(x, y + 11, 2, 4)
  // The satchel lamp shows that the mid-air boost is ready.
  ctx.fillStyle = p.airJumpAvailable ? '#70fff0' : '#84445a'
  ctx.fillRect(x, y + 12, 1, 2)
  ctx.fillStyle = '#422442'
  if (airborne) {
    ctx.fillRect(x + 2, y + 16, 3, 4)
    ctx.fillRect(x + 7, y + 15, 3, 4)
    ctx.fillStyle = '#fff0c1'
    ctx.fillRect(x + 1, y + 19, 5, 2)
    ctx.fillRect(x + 7, y + 18, 5, 2)
  } else {
    ctx.fillRect(x + 2 + stride, y + 16, 3, 5)
    ctx.fillRect(x + 7 - stride, y + 16, 3, 5)
    ctx.fillStyle = '#fff0c1'
    ctx.fillRect(x + 1 + stride, y + 20, 5, 2)
    ctx.fillRect(x + 7 - stride, y + 20, 5, 2)
  }

  // Bright coral suit, cream chest badge and gloves.
  ctx.fillStyle = '#8b3650'
  ctx.fillRect(x + 1, y + 9 - bob, 10, 8)
  ctx.fillStyle = '#ff8555'
  ctx.fillRect(x + 2, y + 9 - bob, 8, 6)
  ctx.fillStyle = '#ffe9b5'
  ctx.fillRect(x + 4, y + 10 - bob, 4, 4)
  ctx.fillStyle = '#19a4a4'
  ctx.fillRect(x + 5, y + 11 - bob, 2, 2)
  ctx.fillStyle = '#ca4e4e'
  ctx.fillRect(x + 9, y + 10 - bob + (walking ? stride : 0), 3, 5)
  ctx.fillStyle = '#ffe9b5'
  ctx.fillRect(x + 10, y + 14 - bob + (walking ? stride : 0), 2, 2)

  // Oversized helmet and expressive face: eyes blink when resting.
  ctx.fillStyle = '#542744'
  ctx.fillRect(x + 1, y - bob, 10, 9)
  ctx.fillRect(x, y + 2 - bob, 12, 5)
  ctx.fillStyle = '#ffd579'
  ctx.fillRect(x + 2, y + 1 - bob, 8, 7)
  ctx.fillStyle = '#fff2ce'
  ctx.fillRect(x + 2, y + 1 - bob, 7, 1)
  ctx.fillStyle = '#593148'
  ctx.fillRect(x + 3, y + 3 - bob, 7, 4)
  ctx.fillStyle = '#f6b776'
  ctx.fillRect(x + 4, y + 3 - bob, 6, 3)
  ctx.fillStyle = '#30223c'
  ctx.fillRect(x + 5, y + (blink ? 5 : 4) - bob, 1, 1)
  ctx.fillRect(x + 8, y + (blink ? 5 : 4) - bob, 1, 1)
  ctx.fillStyle = '#fff4d6'
  ctx.fillRect(x + 6, y + 6 - bob, 2, 1)
  ctx.fillStyle = '#ff8c82'
  ctx.fillRect(x + 9, y + 5 - bob, 1, 1)
  ctx.fillStyle = '#61eee3'
  ctx.fillRect(x + 4, y - bob, 3, 1)
  ctx.restore()
}

/**
 * Dessine une image complète.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state  état du moteur
 * @param {{x: number, y: number}} cam  caméra, en pixels monde
 * @param {number} t      compteur d'images, pour les animations
 */
export function draw(ctx, state, cam, t, fx = null) {
  ctx.imageSmoothingEnabled = false
  sky(ctx)
  // Par précaution : sans grille chargée, on s'arrête au ciel plutôt que de jeter
  if (!state.tiles?.length) return
  const [sx, sy] = fx ? fx.offset(t) : [0, 0]
  ctx.save()
  ctx.translate(sx, sy)
  if (state.adventure === 'sky') paradise(ctx, state, cam, t)
  else parallax(ctx, cam)
  drawExitGuide(ctx, state, cam, t)

  ctx.save()
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y))
  terrain(ctx, state, cam)
  chips(ctx, state, cam, t)
  spikes(ctx, state, cam, t)
  gates(ctx, state, cam, t)
  walkers(ctx, state, cam, t)
  bananas(ctx, state, cam, t)
  exitTerminal(ctx, state, cam, t)
  if (fx) fx.drawWorld(ctx)
  player(ctx, state, fx ? fx.scale() : [1, 1], t)
  ctx.restore()
  ctx.restore()

  // Voile rouge au moment de la perte
  if (state.phase === 'dying') {
    ctx.fillStyle = 'rgba(127, 29, 29, 0.35)'
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
}

/* =====================================================================
   Effets visuels : particules, secousse et tassement du personnage.
   Pur affichage : rien ici ne touche au moteur ni au déroulement du jeu.
   ===================================================================== */

/** Pseudo-aléa déterministe pour les effets, afin que deux parties se ressemblent */
function noise(seed) {
  let s = seed | 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

export function createEffects() {
  const parts = []
  const rnd = noise(221)
  let shake = 0
  let squash = 0 // > 0 tassé (atterrissage), < 0 étiré (saut) ; revient vers 0

  function burst(x, y, count, spec) {
    for (let i = 0; i < count; i++) {
      const a = spec.angle + (rnd() - 0.5) * spec.spread
      const v = spec.speed * (0.5 + rnd())
      parts.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: spec.gravity ?? 0.12,
        life: spec.life,
        max: spec.life,
        color: spec.colors[Math.floor(rnd() * spec.colors.length)],
        size: spec.size ?? 1,
      })
    }
  }

  return {
    /** Lit les événements du pas courant (après le son, dans ArcadeStage) */
    push(events) {
      for (const e of events) {
        if (e.type === 'land') {
          const k = Math.min(1, (e.speed ?? 0) / 9)
          squash = 4 + k * 5
          burst(e.x, e.y, 4 + Math.round(k * 5), { angle: -Math.PI / 2, spread: Math.PI, speed: 0.9 + k, gravity: 0.08, life: 18, colors: ['#fde68a', '#d6b370', '#9a6b3a'] })
        } else if (e.type === 'jump') {
          squash = -6
          burst(e.x, e.y, 3, { angle: Math.PI / 2, spread: 2.4, speed: 0.6, gravity: 0.05, life: 12, colors: ['#d6b370', '#9a6b3a'] })
        } else if (e.type === 'airJump') {
          squash = -5
          burst(e.x, e.y, 9, { angle: Math.PI / 2, spread: Math.PI, speed: 1.3, gravity: 0.02, life: 20, colors: ['#61eee3', '#c4fff6', '#ffffff'] })
        } else if (e.type === 'chip') {
          burst(e.x, e.y, 10, { angle: -Math.PI / 2, spread: Math.PI * 2, speed: 1.4, gravity: 0.04, life: 26, colors: ['#fde68a', '#fbbf24', '#ffffff'], size: 1 })
        } else if (e.type === 'combo') {
          burst(e.x, e.y, 7, { angle: -Math.PI / 2, spread: Math.PI * 2, speed: 1.7, gravity: 0.025, life: 24, colors: ['#70fff0', '#ffe68a', '#ffffff'] })
        } else if (e.type === 'stomp') {
          shake = Math.max(shake, 3)
          burst(e.x, e.y, 10, { angle: -Math.PI / 2, spread: Math.PI, speed: 1.8, gravity: 0.15, life: 24, colors: ['#f87171', '#7f1d1d', '#fef08a'], size: 2 })
        } else if (e.type === 'die') {
          shake = Math.max(shake, 9)
          burst(e.x, e.y, 16, { angle: -Math.PI / 2, spread: Math.PI * 2, speed: 2.2, gravity: 0.14, life: 34, colors: ['#fb923c', '#fed7aa', '#a5f3fc', '#7c2d12'], size: 2 })
        } else if (e.type === 'cleared') {
          burst(VIEW_W / 2, 20, 0, { angle: 0, spread: 0, speed: 0, life: 1, colors: ['#fff'] })
        }
      }
    },
    /** Un pas d'animation (appelé à chaque image) */
    update() {
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i]
        q.x += q.vx
        q.y += q.vy
        q.vy += q.g
        q.vx *= 0.96
        q.life -= 1
        if (q.life <= 0) parts.splice(i, 1)
      }
      shake *= 0.82
      if (shake < 0.3) shake = 0
      squash *= 0.78
      if (Math.abs(squash) < 0.3) squash = 0
    },
    /** Décalage de secousse pour cette image, en pixels */
    offset(t) {
      if (!shake) return [0, 0]
      return [Math.round(Math.sin(t * 2.7) * shake), Math.round(Math.cos(t * 3.1) * shake * 0.6)]
    },
    /** Facteurs d'échelle du personnage : [largeur, hauteur], autour de ses pieds */
    scale() {
      const k = squash / 9
      return [1 + k * 0.22, 1 - k * 0.3]
    },
    drawWorld(ctx) {
      for (const q of parts) {
        ctx.globalAlpha = Math.min(1, q.life / (q.max * 0.5))
        ctx.fillStyle = q.color
        ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size)
      }
      ctx.globalAlpha = 1
    },
  }
}

/** Faisceau au-dessus du terminal, et flèche au bord quand il est hors champ */
export function drawExitGuide(ctx, state, cam, t) {
  const e = state.exit
  if (state.adventure === 'sky' && e.y + e.h < cam.y) {
    // Point towards the summit even when the exit is far above the camera.
    const x = Math.round(Math.max(14, Math.min(VIEW_W - 14, e.x + e.w / 2 - cam.x)))
    ctx.fillStyle = 'rgba(38, 52, 45, 0.72)'
    ctx.fillRect(x - 10, 5, 20, 17)
    ctx.fillStyle = '#fff2aa'
    for (let i = 0; i < 5; i++) ctx.fillRect(x - i, 8 + i, i * 2 + 1, 1)
    ctx.fillRect(x - 1, 12, 3, 6)
    return
  }
  const beamX = Math.round(e.x + e.w / 2 - cam.x)
  if (beamX > -8 && beamX < VIEW_W + 8) {
    const top = Math.round(e.y - cam.y)
    const g = ctx.createLinearGradient(0, 0, 0, top)
    g.addColorStop(0, 'rgba(253, 230, 138, 0)')
    g.addColorStop(1, `rgba(253, 230, 138, ${(0.18 + 0.08 * Math.sin(t / 9)).toFixed(2)})`)
    ctx.fillStyle = g
    ctx.fillRect(beamX - 4, 0, 8, Math.max(0, top))
    return
  }
  if (state.phase !== 'playing' || e.x < cam.x) return
  if (Math.floor(t / 20) % 2) return
  const y = Math.round(Math.max(12, Math.min(VIEW_H - 12, e.y + e.h / 2 - cam.y)))
  ctx.fillStyle = '#fde68a'
  for (let i = 0; i < 5; i++) ctx.fillRect(VIEW_W - 12 + i, y - (4 - i), 1, (4 - i) * 2 + 1)
  ctx.fillRect(VIEW_W - 16, y - 1, 4, 3)
}
