import { LEVEL_H, LEVEL_W, TILE } from './levels.js'

/**
 * Rendu d'« Arcade 221 » sur un canevas 2D.
 *
 * Résolution logique volontairement basse (480 × 272) et agrandie en CSS avec
 * `image-rendering: pixelated` : les pixels restent francs à toute taille et le
 * dessin coûte peu, même sur un téléphone.
 *
 * Palette : le crépuscule sur Dakar du décor d'origine — indigo, prune, braise,
 * puces d'or et circuit cuivré.
 */

export const VIEW_W = 480
export const VIEW_H = 272

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
  suitDark: '#c2410c',
  visor: '#a5f3fc',
  skin: '#92400e',
  boot: '#fde68a',
}

/* Décor déterministe : il ne doit pas scintiller d'une image à l'autre */
const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 137) % (LEVEL_W * TILE),
  y: 4 + ((i * 53) % 90),
  s: (i * 31) % 7 === 0 ? 2 : 1,
}))

const SKYLINE = (() => {
  const out = []
  for (let x = 0, i = 0; x < LEVEL_W * TILE; i++) {
    const w = 22 + ((i * 17) % 22)
    // Volontairement basses : au-dessus de ~30 px, elles empiètent sur la
    // hauteur de saut du joueur et brouillent la lecture.
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

function stars(ctx, cam) {
  ctx.fillStyle = C.star
  for (const s of STARS) {
    const x = s.x - cam * 0.15
    if (x < -4 || x > VIEW_W + 4) continue
    ctx.fillRect(Math.round(x), s.y, s.s, s.s)
  }
}

function city(ctx, cam) {
  const base = VIEW_H - 40
  for (const b of SKYLINE) {
    const x = Math.round(b.x - cam * 0.35)
    if (x + b.w < -10 || x > VIEW_W + 10) continue
    ctx.fillStyle = C.city
    ctx.fillRect(x, base - b.h, b.w, b.h)
    ctx.fillStyle = C.window
    for (const w of b.windows) ctx.fillRect(x + w.x, base - b.h + w.y, 2, 3)
  }
}

/** Sol et passerelles */
function terrain(ctx, state, cam) {
  const first = Math.max(0, Math.floor(cam / TILE) - 1)
  const last = Math.min(LEVEL_W - 1, Math.ceil((cam + VIEW_W) / TILE) + 1)

  for (let ty = 0; ty < LEVEL_H; ty++) {
    for (let tx = first; tx <= last; tx++) {
      const t = state.tiles[ty][tx]
      if (t !== '#' && t !== '-') continue
      const x = Math.round(tx * TILE - cam)
      const y = ty * TILE

      if (t === '#') {
        ctx.fillStyle = C.groundFill
        ctx.fillRect(x, y, TILE, TILE)
        // Liseré lumineux seulement sur la face exposée
        if (ty === 0 || state.tiles[ty - 1][tx] !== '#') {
          ctx.fillStyle = C.groundTop
          ctx.fillRect(x, y, TILE, 2)
        }
        // Pistes de circuit imprimé, une tuile sur trois : répétées partout,
        // elles font vibrer le sol et fatiguent l'œil.
        if ((tx + ty) % 3 === 0) {
          ctx.fillStyle = C.trace
          ctx.fillRect(x + 3, y + 6, TILE - 6, 1)
          ctx.fillRect(x + 7, y + 6, 1, 5)
          ctx.fillStyle = C.pad
          ctx.fillRect(x + 6, y + 11, 3, 2)
        }
      } else {
        ctx.fillStyle = C.bridge
        ctx.fillRect(x, y + 3, TILE, 5)
        ctx.fillStyle = C.bridgeTop
        ctx.fillRect(x, y + 2, TILE, 2)
      }
    }
  }
}

function chips(ctx, state, cam, t) {
  for (const c of state.chips) {
    if (c.taken) continue
    const x = Math.round(c.x - cam)
    if (x < -20 || x > VIEW_W + 20) continue
    const bob = Math.sin(t / 16 + c.x / 24) * 1.5
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
    ctx.fillStyle = C.chipEdge
    ctx.fillRect(x + 2, y + 2, 2, 2)
  }
}

function spikes(ctx, state, cam, t) {
  const flicker = (Math.sin(t / 5) + 1) / 2
  for (const s of state.spikes) {
    const x = Math.round(s.x - cam)
    if (x < -20 || x > VIEW_W + 20) continue
    ctx.fillStyle = C.spike
    for (let i = 0; i < s.w; i += 4) {
      ctx.fillRect(x + i, s.y + 4, 3, 4)
      ctx.fillRect(x + i + 1, s.y, 1, 4)
    }
    ctx.fillStyle = `rgba(254, 202, 202, ${(0.35 + flicker * 0.5).toFixed(2)})`
    ctx.fillRect(x, s.y - 1, s.w, 1)
  }
}

function walkers(ctx, state, cam, t) {
  for (const w of state.walkers) {
    if (!w.alive) continue
    const x = Math.round(w.x - cam)
    if (x < -20 || x > VIEW_W + 20) continue
    const y = Math.round(w.y)
    ctx.fillStyle = C.walker
    ctx.fillRect(x, y + 2, w.w, w.h - 2)
    ctx.fillStyle = C.walkerTrim
    ctx.fillRect(x + 1, y, w.w - 2, 3)
    // Œil balayant, orienté dans le sens de marche
    const eye = w.vx > 0 ? w.w - 5 : 2
    ctx.fillStyle = C.walkerEye
    ctx.fillRect(x + eye, y + 5, 3, 3)
    // Chenilles
    ctx.fillStyle = C.walkerTrim
    const roll = Math.floor(t / 6) % 2
    ctx.fillRect(x + 1 + roll, y + w.h - 2, 3, 2)
    ctx.fillRect(x + w.w - 5 + roll, y + w.h - 2, 3, 2)
  }
}

function exitTerminal(ctx, state, cam, t) {
  const e = state.exit
  const x = Math.round(e.x - cam)
  if (x < -40 || x > VIEW_W + 40) return
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

function player(ctx, state, cam) {
  const p = state.player
  const x = Math.round(p.x - cam)
  const y = Math.round(p.y)
  const walking = p.onGround && Math.abs(p.vx) > 0.2
  const stride = walking ? Math.floor(p.anim / 7) % 2 : 0
  const flip = p.dir < 0

  ctx.save()
  if (flip) {
    ctx.translate(x + p.w, 0)
    ctx.scale(-1, 1)
    ctx.translate(-x, 0)
  }

  // Liseré sombre : détache la silhouette de la ville en contre-jour
  ctx.fillStyle = 'rgba(23, 16, 41, 0.75)'
  ctx.fillRect(x, y - 1, p.w, p.h + 2)

  // Jambes
  ctx.fillStyle = C.boot
  if (p.onGround) {
    ctx.fillRect(x + 1 + stride, y + 18, 4, 4)
    ctx.fillRect(x + 7 - stride, y + 18, 4, 4)
  } else {
    ctx.fillRect(x + 2, y + 18, 4, 4)
    ctx.fillRect(x + 7, y + 17, 4, 4)
  }
  // Combinaison
  ctx.fillStyle = C.suit
  ctx.fillRect(x + 1, y + 8, p.w - 2, 10)
  ctx.fillStyle = C.suitDark
  ctx.fillRect(x + 1, y + 15, p.w - 2, 3)
  // Bras
  ctx.fillRect(x + (p.onGround ? 10 : 9), y + 9, 3, 6)
  // Casque et visière
  ctx.fillStyle = C.skin
  ctx.fillRect(x + 2, y + 1, 9, 7)
  ctx.fillStyle = C.suit
  ctx.fillRect(x + 1, y, 11, 3)
  ctx.fillStyle = C.visor
  ctx.fillRect(x + 6, y + 3, 5, 3)

  ctx.restore()
}

/**
 * Dessine une image complète.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state  état du moteur
 * @param {number} cam    décalage caméra en pixels monde
 * @param {number} t      compteur d'images, pour les animations
 */
export function draw(ctx, state, cam, t) {
  ctx.imageSmoothingEnabled = false
  sky(ctx)
  stars(ctx, cam)
  city(ctx, cam)
  // Par précaution : sans grille chargée, on s'arrête au décor plutôt que de jeter
  if (!state.tiles?.length) return
  terrain(ctx, state, cam)
  chips(ctx, state, cam, t)
  spikes(ctx, state, cam, t)
  walkers(ctx, state, cam, t)
  exitTerminal(ctx, state, cam, t)
  player(ctx, state, cam)

  // Voile rouge au moment de la perte
  if (state.phase === 'dying') {
    ctx.fillStyle = 'rgba(127, 29, 29, 0.35)'
    ctx.fillRect(0, 0, VIEW_W, VIEW_H)
  }
}
