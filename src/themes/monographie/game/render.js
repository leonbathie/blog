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
    ctx.fillStyle = C.window
    for (const w of b.windows) ctx.fillRect(x + w.x, Math.round(base - b.h + w.y), 2, 3)
  }
}

/** Sol et passerelles */
function terrain(ctx, state, cam) {
  const first = Math.max(0, Math.floor(cam.x / TILE) - 1)
  const last = Math.min(LEVEL_W - 1, Math.ceil((cam.x + VIEW_W) / TILE) + 1)
  const topRow = Math.max(0, Math.floor(cam.y / TILE) - 1)
  const bottomRow = Math.min(LEVEL_H - 1, Math.ceil((cam.y + VIEW_H) / TILE) + 1)

  for (let ty = topRow; ty <= bottomRow; ty++) {
    for (let tx = first; tx <= last; tx++) {
      const t = state.tiles[ty][tx]
      if (t !== '#' && t !== '-') continue
      const x = tx * TILE
      const y = ty * TILE

      if (t === '#') {
        ctx.fillStyle = C.groundFill
        ctx.fillRect(x, y, TILE, TILE)
        // Liseré lumineux seulement sur la face exposée
        if (ty === 0 || state.tiles[ty - 1][tx] !== '#') {
          ctx.fillStyle = C.groundTop
          ctx.fillRect(x, y, TILE, 2)
        }
        // Pistes de circuit imprimé, une tuile sur quatre : répétées partout,
        // elles font vibrer le sol et fatiguent l'œil — d'autant plus depuis
        // que l'image est agrandie davantage.
        if ((tx * 2 + ty) % 4 === 0) {
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
    ctx.fillStyle = C.chipEdge
    ctx.fillRect(x + 2, y + 2, 2, 2)
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
    const runner = w.kind === 'runner'
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

/** L'ingénieur : casque à visière, plastron clair, sac dorsal */
function player(ctx, state, scale = [1, 1]) {
  const p = state.player
  const x = Math.round(p.x)
  const y = Math.round(p.y)
  const walking = p.onGround && Math.abs(p.vx) > 0.2
  const stride = walking ? Math.floor(p.anim / 7) % 2 : 0
  const flip = p.dir < 0

  ctx.save()
  if (scale[0] !== 1 || scale[1] !== 1) {
    // Tassement ou étirement autour des pieds : l'ancrage au sol ne bouge pas
    const fx = x + p.w / 2
    const fy = y + p.h
    ctx.translate(fx, fy)
    ctx.scale(scale[0], scale[1])
    ctx.translate(-fx, -fy)
  }
  if (flip) {
    ctx.translate(x + p.w, 0)
    ctx.scale(-1, 1)
    ctx.translate(-x, 0)
  }

  // Ombre de contact : ancre le personnage au sol sans l'enfermer dans un
  // rectangle sombre, comme le ferait un fond plein sur toute sa boîte.
  if (p.onGround) {
    ctx.fillStyle = 'rgba(23, 16, 41, 0.45)'
    ctx.fillRect(x + 1, y + p.h, p.w - 2, 1)
  }

  // Foulard anime et insigne du labo : une silhouette identifiable en mouvement.
  ctx.fillStyle = '#facc15'
  const scarf = p.onGround && !walking ? 0 : Math.floor(p.anim / 8) % 2
  ctx.fillRect(x - 2 - scarf, y + 7, 5, 2)
  ctx.fillRect(x - 3 - scarf, y + 8, 3, 2)

  // Sac dorsal, dessiné en premier : il passe derrière le corps
  ctx.fillStyle = C.pack
  ctx.fillRect(x - 1, y + 8, 3, 8)
  ctx.fillStyle = C.packLight
  ctx.fillRect(x - 1, y + 9, 1, 3)

  // Jambes : deux phases de marche, repliées en l'air
  ctx.fillStyle = C.suitDark
  if (!p.onGround) {
    ctx.fillRect(x + 2, y + 16, 3, 4)
    ctx.fillRect(x + 7, y + 15, 3, 4)
    ctx.fillStyle = C.boot
    ctx.fillRect(x + 2, y + 19, 4, 2)
    ctx.fillRect(x + 7, y + 18, 4, 2)
  } else if (walking) {
    ctx.fillRect(x + 1 + stride * 2, y + 17, 3, 4)
    ctx.fillRect(x + 7 - stride * 2, y + 17, 3, 4)
    ctx.fillStyle = C.boot
    ctx.fillRect(x + 1 + stride * 2, y + 20, 4, 2)
    ctx.fillRect(x + 7 - stride * 2, y + 20, 4, 2)
  } else {
    ctx.fillRect(x + 2, y + 17, 3, 4)
    ctx.fillRect(x + 7, y + 17, 3, 4)
    ctx.fillStyle = C.boot
    ctx.fillRect(x + 2, y + 20, 3, 2)
    ctx.fillRect(x + 7, y + 20, 3, 2)
  }

  // Buste
  ctx.fillStyle = C.suit
  ctx.fillRect(x + 1, y + 8, 10, 9)
  ctx.fillStyle = C.suitDark
  ctx.fillRect(x + 1, y + 15, 10, 2)
  // Plastron clair : donne un centre lisible à la silhouette
  ctx.fillStyle = C.panel
  ctx.fillRect(x + 4, y + 10, 4, 4)
  ctx.fillStyle = C.visor
  ctx.fillRect(x + 5, y + 11, 2, 1)
  ctx.fillStyle = '#facc15'
  ctx.fillRect(x + 5, y + 13, 2, 1)

  // Bras avant, qui balance avec la foulée
  ctx.fillStyle = C.suitDark
  ctx.fillRect(x + 9, y + 9 + (walking ? stride : 0), 3, 6)

  // Casque
  ctx.fillStyle = C.suitDark
  ctx.fillRect(x + 1, y, 10, 8)
  ctx.fillStyle = C.suit
  ctx.fillRect(x + 2, y + 1, 8, 6)
  // Visière large, avec un reflet
  ctx.fillStyle = C.visorDark
  ctx.fillRect(x + 4, y + 2, 7, 4)
  ctx.fillStyle = C.visor
  ctx.fillRect(x + 5, y + 3, 5, 2)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x + 8, y + 3, 1, 1)

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
  parallax(ctx, cam)
  drawExitGuide(ctx, state, cam, t)

  ctx.save()
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y))
  terrain(ctx, state, cam)
  chips(ctx, state, cam, t)
  spikes(ctx, state, cam, t)
  gates(ctx, state, cam, t)
  walkers(ctx, state, cam, t)
  exitTerminal(ctx, state, cam, t)
  if (fx) fx.drawWorld(ctx)
  player(ctx, state, fx ? fx.scale() : [1, 1])
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
        } else if (e.type === 'chip') {
          burst(e.x, e.y, 10, { angle: -Math.PI / 2, spread: Math.PI * 2, speed: 1.4, gravity: 0.04, life: 26, colors: ['#fde68a', '#fbbf24', '#ffffff'], size: 1 })
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
