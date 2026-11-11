import { LEVELS, LEVEL_H, LEVEL_W, TILE } from './levels.js'

/**
 * Moteur d'« Arcade 221 » — logique pure, sans DOM ni canvas.
 *
 * Tout est déterministe : à entrées égales, la partie se déroule toujours de la
 * même façon. C'est ce qui permet de la jouer automatiquement dans un test et de
 * prouver qu'elle est finissable.
 *
 * Usage :
 *   const game = createGame()
 *   game.start()
 *   game.step({ left, right, jump })   // un pas = 1/60 s
 *   game.state                          // lecture seule pour le rendu
 */

/* ---------- Réglages de jeu ---------- */
export const STEP_HZ = 60
const GRAVITY = 0.5
const MAX_FALL = 9
// Portée du saut : 2·|JUMP_V|/GRAVITY pas en l'air, soit ~32 pas, donc ~67 px
// parcourus et ~64 px de hauteur. De quoi franchir 3 tuiles de vide ou 2 de
// surtension avec de la marge — sans marge, la salle devient injouable.
const SPEED = 2.1
const ACCEL_GROUND = 0.45
const ACCEL_AIR = 0.3
const JUMP_V = -8
const JUMP_CUT = 0.4 // relâcher tôt coupe l'élan
const COYOTE = 6 // on peut encore sauter 6 pas après avoir quitté le sol
const BUFFER = 6 // un saut demandé 6 pas trop tôt est mémorisé
const STOMP_BOUNCE = -5.6
const AIR_JUMP_V = -7.2
const COMBO_DURATION = 4 * STEP_HZ
const MAX_COMBO = 5
const WALKER_SPEED = 0.7
/** Un patrouilleur garde son poste : il ne s'éloigne pas de plus de 3 tuiles */
const WALKER_RANGE = 3 * 16
const START_LIVES = 3

const PLAYER_W = 12
const PLAYER_H = 22
const WALKER_W = 14
const WALKER_H = 14
const CHIP_SIZE = 10
const SPIKE_H = 8
const EXIT_W = 14
const EXIT_H = 30

export const SCORE = { chip: 100, stomp: 200, level: 500, allChips: 400 }
export const WORLD = { w: LEVEL_W * TILE, h: LEVEL_H * TILE, tile: TILE }

const SOLID = '#'
const BRIDGE = '-'

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

/** Lit la grille d'un niveau et en tire les décors et les entités */
function parseLevel(level) {
  const tiles = level.grid.map((row) => row.split(''))
  const chips = []
  const spikes = []
  const walkers = []
  const gates = []
  let spawn = { x: 2 * TILE, y: 12 * TILE }
  let exit = { x: (LEVEL_W - 4) * TILE, y: 11 * TILE }

  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < LEVEL_W; x++) {
      const t = tiles[y][x]
      const px = x * TILE
      const py = y * TILE
      if (t === 'o') chips.push({ x: px + (TILE - CHIP_SIZE) / 2, y: py + (TILE - CHIP_SIZE) / 2, w: CHIP_SIZE, h: CHIP_SIZE, taken: false })
      else if (t === '^') spikes.push({ x: px + 2, y: py + TILE - SPIKE_H, w: TILE - 4, h: SPIKE_H })
      else if (t === 'w' || t === 'r' || t === 'm')
        walkers.push({ x: px + 1, y: py + TILE - WALKER_H, w: WALKER_W, h: WALKER_H, vx: -(t === 'r' ? 1.15 : t === 'm' ? 0.4 : WALKER_SPEED), kind: t === 'r' ? 'runner' : t === 'm' ? 'monkey' : 'guard', alive: true, home: px + 1, throwCooldown: 105 + x * 3 })
      else if (t === 'g') gates.push({ x: px + 4, y: py + TILE - 24, w: 8, h: 24, offset: x * 11, active: (x * 11) % 180 < 90 })
      else if (t === 'S') spawn = { x: px, y: py + TILE - PLAYER_H }
      else if (t === 'E') exit = { x: px + 1, y: py + TILE - EXIT_H, w: EXIT_W, h: EXIT_H }
    }
  }
  return { tiles, chips, spikes, walkers, gates, spawn, exit }
}

/** Nature de la tuile à ces coordonnées monde */
function tileAt(tiles, px, py) {
  const x = Math.floor(px / TILE)
  const y = Math.floor(py / TILE)
  if (x < 0 || x >= LEVEL_W || y < 0 || y >= tiles.length) return x < 0 || x >= LEVEL_W ? SOLID : '.'
  return tiles[y][x]
}

/** Un bloc plein recouvre-t-il cette boîte ? (les passerelles sont ignorées ici) */
function hitsSolid(tiles, box) {
  const x0 = Math.floor(box.x / TILE)
  const x1 = Math.floor((box.x + box.w - 1) / TILE)
  const y0 = Math.floor(box.y / TILE)
  const y1 = Math.floor((box.y + box.h - 1) / TILE)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || x >= LEVEL_W) return true // les bords du niveau font mur
      if (y < 0 || y >= tiles.length) continue
      if (tiles[y][x] === SOLID) return true
    }
  }
  return false
}

export function createGame() {
  const state = {
    phase: 'title', // title | playing | dying | cleared | won | over
    levelIndex: 0,
    levelName: '',
    adventure: null,
    worldHeight: WORLD.h,
    hint: '',
    lives: START_LIVES,
    score: 0,
    frames: 0,
    levelFrames: 0,
    chipsLeft: 0,
    chipsTotal: 0,
    combo: 0,
    comboTimer: 0,
    camera: 0,
    message: '',
    player: { x: 0, y: 0, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, dir: 1, onGround: false, anim: 0, groundTravel: 0, airJumpAvailable: false },
    tiles: [],
    chips: [],
    spikes: [],
    walkers: [],
    bananas: [],
    gates: [],
    exit: { x: 0, y: 0, w: EXIT_W, h: EXIT_H },
    /** Événements du pas courant, lus puis vidés par la couche d'affichage (sons, confettis) */
    events: [],
  }

  let coyote = 0
  let buffer = 0
  let wasJump = false
  let holdTimer = 0
  let dyingTimer = 0

  function loadLevel(index) {
    const level = LEVELS[index]
    const { tiles, chips, spikes, walkers, gates, spawn, exit } = parseLevel(level)
    state.levelIndex = index
    state.levelFrames = 0
    state.levelName = level.name
    state.adventure = level.adventure ?? null
    state.worldHeight = level.grid.length * TILE
    state.hint = level.hint
    state.tiles = tiles
    state.chips = chips
    state.spikes = spikes
    state.walkers = walkers
    state.bananas = []
    state.gates = gates
    state.exit = exit
    state.chipsTotal = chips.length
    state.chipsLeft = chips.length
    state.combo = 0
    state.comboTimer = 0
    state.camera = 0
    camera.x = 0
    camera.y = Math.max(0, state.worldHeight - 180)
    Object.assign(state.player, { x: spawn.x, y: spawn.y, vx: 0, vy: 0, dir: 1, onGround: false, anim: 0, groundTravel: 0, airJumpAvailable: false })
    coyote = 0
    buffer = 0
    holdTimer = 0
    wasJump = false
  }

  function start(index = 0) {
    state.phase = 'playing'
    state.lives = START_LIVES
    state.score = 0
    state.frames = 0
    state.message = ''
    const selected = Number.isInteger(index) && index >= 0 && index < LEVELS.length ? index : 0
    loadLevel(selected)
    state.events.push({ type: 'start' })
  }

  function die() {
    state.lives -= 1
    const p = state.player
    state.events.push({ type: 'die', x: p.x + p.w / 2, y: p.y + p.h / 2 })
    if (state.lives <= 0) {
      state.phase = 'over'
      state.message = 'Réseau hors tension'
      return
    }
    state.phase = 'dying'
    dyingTimer = 45 // trois quarts de seconde, le temps que la perte se voie
    state.message = `Vie perdue — ${state.lives} restante${state.lives > 1 ? 's' : ''}`
  }

  /** Reprise après une mort : on rejoue la salle en cours */
  function retry() {
    if (state.phase !== 'dying') return
    loadLevel(state.levelIndex)
    state.phase = 'playing'
    state.message = ''
  }

  function nextLevel() {
    if (state.phase !== 'cleared') return
    if (state.levelIndex + 1 >= LEVELS.length) {
      state.phase = 'won'
      state.message = 'Réseau du labo entièrement rétabli'
      state.events.push({ type: 'won' })
      return
    }
    loadLevel(state.levelIndex + 1)
    state.phase = 'playing'
    state.message = ''
  }

  function clearLevel() {
    state.score += SCORE.level
    // Les puces ne barrent pas la route : elles valent des points, et tout
    // ramasser vaut un bonus. Un visiteur peut donc toujours finir la salle.
    const perfect = state.chipsLeft === 0
    if (perfect) state.score += SCORE.allChips
    state.phase = 'cleared'
    state.message = perfect
      ? `${state.levelName} — salle rétablie, toutes les puces !`
      : `${state.levelName} — salle rétablie`
    state.events.push({ type: 'cleared', perfect })
  }

  /** Déplace la boîte sur un axe en s'arrêtant au premier bloc plein */
  function moveAxis(box, dx, dy) {
    let hit = false
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)))
    const sx = dx / (steps || 1)
    const sy = dy / (steps || 1)
    for (let i = 0; i < steps; i++) {
      const next = { x: box.x + sx, y: box.y + sy, w: box.w, h: box.h }
      if (hitsSolid(state.tiles, next)) {
        hit = true
        break
      }
      box.x = next.x
      box.y = next.y
    }
    return hit
  }

  /** Passerelle traversable : on ne s'y pose qu'en descendant, et seulement par le dessus */
  function landOnBridge(p, previousBottom) {
    if (p.vy <= 0) return false
    const bottom = p.y + p.h
    const y0 = Math.floor(previousBottom / TILE)
    const y1 = Math.floor(bottom / TILE)
    for (let ty = y0; ty <= y1; ty++) {
      const top = ty * TILE
      if (previousBottom > top || bottom < top) continue
      for (let tx = Math.floor(p.x / TILE); tx <= Math.floor((p.x + p.w - 1) / TILE); tx++) {
        if (tx < 0 || tx >= LEVEL_W || ty < 0 || ty >= state.tiles.length) continue
        if (state.tiles[ty][tx] === BRIDGE) {
          p.y = top - p.h
          return true
        }
      }
    }
    return false
  }

  function step(input = {}) {
    const { left = false, right = false, jump = false } = input

    if (state.phase === 'dying') {
      state.frames += 1
      dyingTimer -= 1
      if (dyingTimer <= 0) retry()
      return state
    }
    if (state.phase !== 'playing') return state

    state.frames += 1
    state.levelFrames += 1
    if (state.comboTimer > 0 && --state.comboTimer === 0) state.combo = 0
    const p = state.player

    /* ---- Déplacement horizontal ---- */
    const dir = (right ? 1 : 0) - (left ? 1 : 0)
    const accel = p.onGround ? ACCEL_GROUND : ACCEL_AIR
    const target = dir * SPEED
    if (p.vx < target) p.vx = Math.min(target, p.vx + accel)
    else if (p.vx > target) p.vx = Math.max(target, p.vx - accel)
    if (dir !== 0) p.dir = dir

    /* ---- Saut : indulgence au décollage et à l'atterrissage ---- */
    if (jump && !wasJump) buffer = BUFFER
    wasJump = jump
    if (buffer > 0) buffer -= 1
    if (coyote > 0) coyote -= 1

    if (buffer > 0 && (p.onGround || coyote > 0)) {
      p.vy = JUMP_V
      p.onGround = false
      buffer = 0
      coyote = 0
      holdTimer = 12
      state.events.push({ type: 'jump', x: p.x + p.w / 2, y: p.y + p.h })
    } else if (buffer > 0 && p.airJumpAvailable) {
      // Press again in the air for a second jump; works with touch or keyboard.
      p.vy = AIR_JUMP_V
      p.airJumpAvailable = false
      buffer = 0
      holdTimer = 12
      state.events.push({ type: 'airJump', x: p.x + p.w / 2, y: p.y + p.h })
    }
    // Relâcher tôt écourte le saut
    if (holdTimer > 0) {
      holdTimer -= 1
      if (!jump && p.vy < 0) {
        p.vy *= JUMP_CUT
        holdTimer = 0
      }
    }

    /* ---- Gravité ---- */
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY)

    /* ---- Collisions, axe par axe ---- */
    const previousX = p.x
    if (moveAxis(p, p.vx, 0)) p.vx = 0
    const movedX = p.x - previousX
    // Face the direction of actual motion during acceleration and braking.
    if (Math.abs(movedX) > 0.001) p.dir = Math.sign(movedX)

    const previousBottom = p.y + p.h
    const wasOnGround = p.onGround
    const fallSpeed = p.vy
    p.onGround = false
    if (moveAxis(p, 0, p.vy)) {
      if (p.vy > 0) p.onGround = true
      p.vy = 0
    } else if (landOnBridge(p, previousBottom)) {
      p.vy = 0
      p.onGround = true
    }
    if (p.onGround) p.airJumpAvailable = true
    if (wasOnGround && !p.onGround && p.vy >= 0) coyote = COYOTE
    // Atterrissage : poussière et tassement, proportionnels à la vitesse de chute
    if (!wasOnGround && p.onGround) state.events.push({ type: 'land', x: p.x + p.w / 2, y: p.y + p.h, speed: fallSpeed })

    // Only grounded distance advances the gait, including a partial move
    // before hitting a wall. Jumps and stationary frames keep their phase.
    p.groundTravel = wasOnGround && p.onGround ? Math.abs(movedX) : 0
    p.anim += p.groundTravel

    /* ---- Chute hors du niveau ---- */
    if (p.y > state.worldHeight + 40) {
      die()
      return state
    }

    /* ---- Puces ---- */
    for (const chip of state.chips) {
      if (chip.taken || !overlap(p, chip)) continue
      chip.taken = true
      state.chipsLeft -= 1
      // Collect chips within four seconds to increase their value.
      state.combo = Math.min(MAX_COMBO, state.combo + 1)
      state.comboTimer = COMBO_DURATION
      const points = SCORE.chip * state.combo
      state.score += points
      state.events.push({ type: 'chip', x: chip.x + chip.w / 2, y: chip.y + chip.h / 2, combo: state.combo, points })
      if (state.combo > 1) state.events.push({ type: 'combo', x: chip.x + chip.w / 2, y: chip.y, combo: state.combo, points })
    }

    /* ---- Surtensions ---- */
    for (const spike of state.spikes) {
      if (overlap(p, spike)) {
        die()
        return state
      }
    }

    // Barriers pulse for 90 frames, then rest for 90 frames.
    for (const gate of state.gates) {
      gate.active = (state.frames + gate.offset) % 180 < 90
      if (gate.active && overlap(p, gate)) {
        die()
        return state
      }
    }

    /* ---- Patrouilleurs ---- */
    for (const w of state.walkers) {
      if (!w.alive) continue
      if (w.kind === 'monkey' && --w.throwCooldown <= 0) {
        // A slow, visible arc gives the player time to dodge or jump.
        const dx = p.x - w.x
        const dy = p.y - w.y
        if (Math.abs(dx) < 190 && Math.abs(dy) < 100) {
          const direction = dx < 0 ? -1 : 1
          state.bananas.push({ x: w.x + w.w / 2, y: w.y - 4, w: 10, h: 8, vx: direction * 1.25, vy: -2.5, age: 0 })
          state.events.push({ type: 'banana', x: w.x, y: w.y })
          w.throwCooldown = 160
        } else w.throwCooldown = 25
      }
      const next = { ...w, x: w.x + w.vx }
      const aheadX = w.vx > 0 ? next.x + w.w + 1 : next.x - 1
      const under = tileAt(state.tiles, aheadX, w.y + w.h + 2)
      // Demi-tour contre un mur, au bord du vide, ou en bout de poste
      if (hitsSolid(state.tiles, next)) w.vx = -w.vx
      else if (under !== SOLID && under !== BRIDGE) w.vx = -w.vx
      else if (Math.abs(next.x - w.home) > WALKER_RANGE) w.vx = -w.vx
      else w.x = next.x

      if (!overlap(p, w)) continue
      const falling = p.vy > 0
      const fromAbove = previousBottom <= w.y + w.h / 2
      if (falling && fromAbove) {
        w.alive = false
        p.vy = STOMP_BOUNCE
        p.onGround = false
        state.score += SCORE.stomp
        state.events.push({ type: 'stomp', x: w.x + w.w / 2, y: w.y + w.h / 2 })
      } else {
        die()
        return state
      }
    }

    for (const banana of state.bananas) {
      banana.age += 1
      banana.x += banana.vx
      banana.y += banana.vy
      banana.vy = Math.min(3, banana.vy + 0.05)
      if (overlap(p, banana)) {
        die()
        return state
      }
    }
    state.bananas = state.bananas.filter((banana) => banana.age < 150 && !hitsSolid(state.tiles, banana) && banana.y < state.worldHeight)

    /* ---- Terminal de sortie ---- */
    if (overlap(p, state.exit)) clearLevel()

    /* ---- Caméra ---- */
    return state
  }

  /**
   * Caméra pour une fenêtre de viewW × viewH pixels.
   *
   * Horizontalement elle colle au joueur ; verticalement elle le suit avec une
   * zone morte, sans quoi elle tressauterait à chaque petit saut. Elle est
   * bornée au niveau : on ne voit jamais au-delà du décor.
   */
  const camera = { x: 0, y: 0 }
  function cameraFor(viewW, viewH) {
    const p = state.player
    camera.x = Math.max(0, Math.min(WORLD.w - viewW, p.x + p.w / 2 - viewW / 2))

    const maxY = Math.max(0, state.worldHeight - viewH)
    const focus = p.y + p.h / 2
    const dead = viewH * 0.18
    let top = camera.y
    if (focus < top + viewH / 2 - dead) top = focus - viewH / 2 + dead
    else if (focus > top + viewH / 2 + dead) top = focus - viewH / 2 - dead
    top = Math.max(0, Math.min(maxY, top))
    // Lissage : la caméra rattrape le joueur au lieu de le coller
    camera.y += (top - camera.y) * 0.18
    if (Math.abs(top - camera.y) < 0.5) camera.y = top

    state.camera = camera.x
    return camera
  }

  function drainEvents() {
    const out = state.events.slice()
    state.events.length = 0
    return out
  }

  // La première salle est chargée dès la construction : l'écran titre se dessine
  // alors sur un vrai décor, et le rendu n'a jamais à composer avec une grille vide.
  loadLevel(0)
  state.events.length = 0

  return { state, start, step, retry, nextLevel, cameraFor, drainEvents, loadLevel }
}
