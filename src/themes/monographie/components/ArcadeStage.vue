<script setup>
import { computed, inject, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { createGame, SCORE } from '../game/engine.js'
import { LEVELS } from '../game/levels.js'
import { createEffects, draw, VIEW_H, VIEW_W } from '../game/render.js'
import { readPref, writePref } from '../../../core/prefs.js'

/**
 * « Arcade 221 » — le mini-jeu du labo de Dakar.
 *
 * Un vrai jeu de plateforme, jouable jusqu'au bout : six salles, trois vies,
 * un terminal à atteindre dans chacune. Univers propre au blog (ingénieur,
 * puces de données, surtensions), pas le décalque d'un jeu existant.
 *
 * Au doigt, tout se joue sur l'écran : la moitié gauche fait courir (vers le
 * côté où l'on appuie, et l'on change de sens en glissant), la moitié droite
 * fait sauter. Les touches ◀ ▶ SAUT restent disponibles sous l'image, un
 * bouton de pause et un plein écran complètent le tableau de bord.
 *
 * La logique est dans game/engine.js, sans DOM : elle est jouée automatiquement
 * par un test pour vérifier que la partie reste finissable.
 */
const props = defineProps({ open: { type: Boolean, default: true } })
const emit = defineEmits(['update:open'])
const mono = inject('mono')

const canvas = ref(null)
const stage = ref(null)
const game = createGame()
const fx = createEffects()
const view = reactive({ ...game.state, progress: 0 })
const best = ref(Number(readPref('mono:arcade-best', '0')) || 0)
const paused = ref(false)
const focused = ref(false)
const fullscreen = ref(false)
const canFullscreen = typeof document !== 'undefined' && Boolean(document.fullscreenEnabled)

const STEP_MS = 1000 / 60
const input = { left: false, right: false, jump: false }
/* Un appui de saut, même plus bref qu'une image, doit donner un vrai saut : la
   demande reste levée au moins JUMP_MIN pas (un petit bond), puis suit le doigt
   — maintenir saute plus haut, comme au clavier. */
const JUMP_MIN = 7
let jumpHeld = false
let jumpMin = 0
let queuedJump = false
let jumpGap = false
function jumpPress() {
  if (jumpHeld) return // les répétitions clavier ne sont pas de nouveaux sauts
  jumpHeld = true
  // Deux tapotements très rapides doivent tout de même produire deux fronts.
  if (input.jump || jumpGap) {
    queuedJump = true
    return
  }
  jumpMin = JUMP_MIN
  input.jump = true
}
function jumpRelease() {
  jumpHeld = false
}
let raf = 0
let last = 0
let acc = 0
let frames = 0

/* ---------- Synchronisation de l'état lisible par le gabarit ---------- */
function sync() {
  const s = game.state
  view.phase = s.phase
  view.levelIndex = s.levelIndex
  view.levelName = s.levelName
  view.hint = s.hint
  view.lives = s.lives
  view.score = s.score
  view.chipsLeft = s.chipsLeft
  view.chipsTotal = s.chipsTotal
  view.message = s.message
  view.frames = s.frames
  view.levelFrames = s.levelFrames
  view.combo = s.combo || 0
  view.progress = s.exit.x > 0 ? Math.max(0, Math.min(1, s.player.x / s.exit.x)) : 0
}

/* Les consignes doivent parler des commandes dont le visiteur dispose :
   « Espace » sur un téléphone n'aide personne. */
const touchMode = ref(false)
const hintText = computed(() => {
  const level = LEVELS[view.levelIndex]
  if (!level) return view.hint
  return touchMode.value ? level.hintTouch : level.hint
})
const controlsText = computed(() =>
  touchMode.value
    ? 'À gauche : courir · à droite : sauter · touchez encore en l’air pour un double saut'
    : '← → ou A/D pour courir · Espace pour sauter, puis encore en l’air · P pause',
)

const running = computed(() => view.phase === 'playing' || view.phase === 'dying')
const overlay = computed(() => (running.value ? (paused.value ? 'paused' : null) : view.phase))
const chipsTaken = computed(() => view.chipsTotal - view.chipsLeft)
const seconds = computed(() => Math.floor(view.frames / 60))
const showZoneHint = computed(() => touchMode.value && view.phase === 'playing' && view.frames < 300)

/* ---------- Vibrations : courtes, et seulement au doigt ---------- */
function buzz(pattern) {
  if (!touchMode.value || !navigator.vibrate) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* appareil sans vibreur */
  }
}

/* ---------- Sons, effets et retours dans la page ---------- */
function handleEvents() {
  const events = game.drainEvents()
  fx.push(events)
  for (const e of events) {
    if (e.type === 'jump') {
      mono.sfx.jump()
      buzz(8)
    } else if (e.type === 'airJump') {
      mono.sfx.jump()
      buzz(12)
    } else if (e.type === 'combo') {
      mono.sfx.blip()
      buzz(8)
    } else if (e.type === 'land') {
      if ((e.speed ?? 0) > 6) buzz(10)
    } else if (e.type === 'chip') {
      mono.sfx.blip()
      mono.addScore(e.points ?? SCORE.chip, 1)
      buzz(12)
    } else if (e.type === 'stomp') {
      mono.sfx.blip()
      buzz([20, 30, 20])
    } else if (e.type === 'die') {
      mono.sfx.whoosh()
      buzz([60, 40, 60])
    } else if (e.type === 'cleared') {
      mono.sfx.fanfare()
      buzz([30, 40, 30, 40, 60])
      const rect = canvas.value?.getBoundingClientRect()
      if (rect) mono.coinBurst(rect.left + rect.width / 2, rect.top + 40, 4, e.perfect ? 'SALLE PARFAITE' : 'SALLE RÉTABLIE')
    } else if (e.type === 'won') {
      mono.sfx.fanfare()
      buzz([40, 40, 40, 40, 120])
    }
  }
}

/* ---------- Boucle ---------- */
function render() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return
  draw(ctx, game.state, game.cameraFor(VIEW_W, VIEW_H), frames, fx)
}

function frame(now) {
  raf = requestAnimationFrame(frame)
  if (!last) last = now
  let dt = now - last
  last = now
  if (dt > 250) dt = STEP_MS // onglet revenu au premier plan : on ne rattrape pas

  if (running.value && !paused.value) {
    acc += dt
    let steps = 0
    while (acc >= STEP_MS && steps < 5) {
      game.step(input)
      if (jumpGap) {
        jumpGap = false
        if (queuedJump) {
          queuedJump = false
          jumpMin = JUMP_MIN
          input.jump = true
        }
      } else {
        if (jumpMin > 0) jumpMin -= 1
        if (jumpMin <= 0 && (!jumpHeld || queuedJump)) {
          input.jump = false
          if (queuedJump) jumpGap = true
        }
      }
      handleEvents()
      fx.update()
      acc -= STEP_MS
      steps += 1
      frames += 1
    }
  } else {
    acc = 0
    frames += 1
    fx.update()
    handleEvents()
  }
  sync()
  render()
}

function startLoop() {
  if (raf || !props.open) return
  last = 0
  raf = requestAnimationFrame(frame)
}
function stopLoop() {
  cancelAnimationFrame(raf)
  raf = 0
}

/* ---------- Actions ---------- */
function rememberBest() {
  if (game.state.score > best.value) {
    best.value = game.state.score
    writePref('mono:arcade-best', String(best.value))
  }
}

/** Le bouton principal de l'écran affiché */
function primary() {
  const phase = game.state.phase
  if (paused.value) {
    paused.value = false
    return
  }
  if (phase === 'cleared') game.nextLevel()
  else if (phase === 'title' || phase === 'over' || phase === 'won') {
    rememberBest()
    game.start()
  }
  sync()
  focusCanvas()
}

const primaryLabel = computed(() => {
  if (paused.value) return 'Reprendre'
  return { title: 'Démarrer', cleared: 'Salle suivante', over: 'Rejouer', won: 'Rejouer' }[view.phase] ?? 'Reprendre'
})

function restart() {
  rememberBest()
  game.start()
  sync()
  focusCanvas()
}

/** Un appui n'importe où sur un écran (titre, pause, fin) vaut le bouton principal,
 *  texte compris ; le bouton lui-même a déjà son gestionnaire. */
function onOverlayTap(event) {
  if (event.target.closest('button')) return
  primary()
}

function togglePause() {
  if (!running.value) return
  paused.value = !paused.value
  if (paused.value) releaseAll()
}

/* ---------- Plein écran (téléphone en paysage) ---------- */
async function toggleFullscreen() {
  const el = stage.value
  if (!el || !canFullscreen) return
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await el.requestFullscreen({ navigationUI: 'hide' })
      // Un jeu de plateforme se joue en paysage ; sans ce droit, on reste en portrait
      await screen.orientation?.lock?.('landscape').catch(() => {})
    }
  } catch {
    /* plein écran refusé : le jeu reste jouable dans la page */
  }
}
function onFullscreenChange() {
  fullscreen.value = document.fullscreenElement === stage.value
  if (!fullscreen.value) screen.orientation?.unlock?.()
}

/* ---------- Clavier ---------- */
const KEYS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyA: 'left',
  KeyQ: 'left', // clavier AZERTY
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  KeyZ: 'jump',
  Space: 'jump',
}

function onKeyDown(event) {
  if (event.code === 'KeyP' || event.code === 'Escape') {
    if (running.value) {
      togglePause()
      event.preventDefault()
    }
    return
  }
  if (event.code === 'KeyR') {
    restart()
    event.preventDefault()
    return
  }
  if (event.code === 'KeyF' && canFullscreen) {
    toggleFullscreen()
    event.preventDefault()
    return
  }
  if (event.code === 'Enter' || (event.code === 'Space' && overlay.value)) {
    primary()
    event.preventDefault()
    return
  }
  const action = KEYS[event.code]
  if (!action) return
  if (action === 'jump') jumpPress()
  else input[action] = true
  event.preventDefault() // sinon Espace et les flèches font défiler la page
}

function onKeyUp(event) {
  const action = KEYS[event.code]
  if (!action) return
  if (action === 'jump') jumpRelease()
  else input[action] = false
  event.preventDefault()
}

/* ---------- Commandes tactiles ----------
   `padPointers` compte les doigts posés sur les commandes. Sans ce compteur,
   toucher une touche faisait perdre le focus au canevas, ce qui relâchait les
   entrées et mettait le jeu en pause : le tactile était inutilisable. */
let padPointers = 0

function capture(event) {
  // Capture du pointeur : si le doigt glisse hors de la zone, c'est quand même
  // elle qui recevra le relâchement, sinon la touche resterait enfoncée.
  // Elle échoue sur certains pointeurs (événements synthétiques, pointeur déjà
  // relâché) et lève alors : la partie ne doit pas s'arrêter pour si peu.
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId)
  } catch {
    /* capture indisponible : pointerleave et pointercancel prennent le relais */
  }
}

function press(action, event) {
  // L'entrée d'abord : elle ne doit dépendre d'aucune étape faillible.
  padPointers += 1
  if (action === 'jump') jumpPress()
  else input[action] = true
  capture(event)
}

function release(action, event) {
  const held = action === 'jump' ? jumpHeld : input[action]
  if (held) padPointers = Math.max(0, padPointers - 1)
  if (action === 'jump') jumpRelease()
  else input[action] = false
  try {
    event?.currentTarget?.releasePointerCapture?.(event.pointerId)
  } catch {
    /* rien à libérer */
  }
}

/* Zone de course, sur la moitié gauche de l'image : on part du côté où le doigt
   se pose, puis glisser de l'autre côté du point d'appui fait demi-tour. */
const run = { id: null, anchor: 0, dir: 0 }
const DEAD = 12 // pixels de glissement avant un demi-tour

function setRun(dir) {
  run.dir = dir
  input.left = dir < 0
  input.right = dir > 0
}
function runDown(event) {
  if (run.id !== null) return
  run.id = event.pointerId
  padPointers += 1
  const box = event.currentTarget.getBoundingClientRect()
  run.anchor = event.clientX
  setRun(event.clientX < box.left + box.width / 2 ? -1 : 1)
  capture(event)
}
function runMove(event) {
  if (event.pointerId !== run.id) return
  const dx = event.clientX - run.anchor
  if (dx < -DEAD && run.dir !== -1) {
    setRun(-1)
    run.anchor = event.clientX + DEAD
  } else if (dx > DEAD && run.dir !== 1) {
    setRun(1)
    run.anchor = event.clientX - DEAD
  }
}
function runUp(event) {
  if (event.pointerId !== run.id) return
  run.id = null
  padPointers = Math.max(0, padPointers - 1)
  setRun(0)
  try {
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  } catch {
    /* rien à libérer */
  }
}

/* Zone de saut, sur la moitié droite : appuyer saute, maintenir saute plus haut */
const jumpZone = { id: null }
function jumpDown(event) {
  if (jumpZone.id !== null) return
  jumpZone.id = event.pointerId
  press('jump', event)
}
function jumpUp(event) {
  if (event.pointerId !== jumpZone.id) return
  jumpZone.id = null
  release('jump', event)
}

function releaseAll() {
  input.left = false
  input.right = false
  input.jump = false
  jumpHeld = false
  jumpMin = 0
  queuedJump = false
  jumpGap = false
  run.id = null
  run.dir = 0
  jumpZone.id = null
  padPointers = 0
}

/* ---------- Cycle de vie ---------- */
function onBlur(event) {
  // Un doigt posé sur les commandes, ou un focus qui reste dans le jeu, n'est
  // pas une sortie : ni relâchement des touches, ni pause.
  if (padPointers > 0) return
  if (event?.relatedTarget && stage.value?.contains(event.relatedTarget)) return
  releaseAll()
  focused.value = false
  if (running.value) paused.value = true
}
function onFocus() {
  focused.value = true
}

/** Le focus clavier n'a de sens qu'au pointeur fin : au doigt, il ferait
 *  remonter la page vers le canevas et ouvrirait parfois le clavier virtuel. */
const coarse = () => window.matchMedia?.('(pointer: coarse)').matches
function focusCanvas() {
  if (!coarse()) canvas.value?.focus()
}
function onCanvasPointer(event) {
  if (event.pointerType === 'mouse' || event.pointerType === 'pen') canvas.value?.focus()
}
function onVisibility() {
  if (document.hidden) {
    releaseAll()
    if (running.value) paused.value = true
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) startLoop()
    else {
      releaseAll()
      if (running.value) paused.value = true
      stopLoop()
    }
  },
)

watch(
  () => view.phase,
  (phase) => {
    if (phase === 'over' || phase === 'won') {
      rememberBest()
      mono.showToast(phase === 'won' ? 'Réseau du labo rétabli — bravo !' : 'Partie terminée')
    }
  },
)

let pointerQuery = null
function onPointerChange(event) {
  touchMode.value = event.matches
}

onMounted(() => {
  sync()
  startLoop()
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  pointerQuery = window.matchMedia?.('(pointer: coarse)')
  if (pointerQuery) {
    touchMode.value = pointerQuery.matches
    pointerQuery.addEventListener?.('change', onPointerChange)
  }

  // Crochet de test : permet à un robot de lire la position du joueur pour
  // décider quand sauter, tout en envoyant de vraies touches. `import.meta.env.DEV`
  // est remplacé par false au build : la ligne disparaît du site publié.
  if (import.meta.env.DEV && canvas.value) Object.assign(canvas.value, { __arcade: game, __input: input })
})

onBeforeUnmount(() => {
  stopLoop()
  rememberBest()
  document.removeEventListener('visibilitychange', onVisibility)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  pointerQuery?.removeEventListener?.('change', onPointerChange)
  if (document.fullscreenElement === stage.value) document.exitFullscreen?.().catch?.(() => {})
})

defineExpose({ start: restart })
</script>

<template>
  <details class="mono-arcade" :open="open" @toggle="emit('update:open', $event.target.open)">
    <summary>
      <span class="mono-arcade-summary-title"><span class="mono-arcade-summary-icon" aria-hidden="true">✦</span> Une pause au laboratoire <strong>ARCADE 221</strong></span>
      <span class="mono-arcade-summary-action">{{ open ? 'FERMER' : 'JOUER' }}</span>
    </summary>

    <div ref="stage" class="mono-arcade-stage relative border-t-2 border-amber-500/60 bg-[#2a1708] dark:border-amber-400/50" :class="fullscreen ? 'mono-arcade-full' : ''">
      <!-- Tableau de bord -->
      <div
        class="mono-arcade-hud flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-amber-500/30 bg-zinc-900/95 px-3 py-1.5 font-pixel text-[10px] text-amber-400"
        role="status"
        aria-live="polite"
      >
        <span class="mono-arcade-stat"><small>SALLE</small><b>{{ String(view.levelIndex + 1).padStart(2, '0') }}<i>/{{ LEVELS.length }}</i></b></span>
        <span class="mono-arcade-stat"><small>VIES</small><b class="mono-arcade-hearts" :aria-label="`${view.lives} vies`">{{ '♥'.repeat(Math.max(0, view.lives)) || '—' }}</b></span>
        <span class="mono-arcade-stat"><small>PUCES</small><b>{{ chipsTaken }}<i>/{{ view.chipsTotal }}</i></b></span>
        <span class="mono-arcade-stat"><small>SCORE</small><b>{{ String(view.score).padStart(5, '0') }}</b></span>
        <span class="mono-arcade-stat mono-arcade-record"><small>RECORD</small><b>{{ String(best).padStart(5, '0') }}</b></span>
        <span v-if="view.combo > 1" class="mono-arcade-combo">COMBO ×{{ view.combo }}</span>
        <span class="ml-auto flex items-center gap-1">
          <button
            v-if="running"
            type="button"
            class="mono-arcade-hud-btn"
            :aria-label="paused ? 'Reprendre' : 'Pause'"
            :aria-pressed="paused"
            @click="togglePause"
          >
            {{ paused ? '▶' : '❚❚' }}
          </button>
          <button
            v-if="canFullscreen"
            type="button"
            class="mono-arcade-hud-btn"
            :aria-label="fullscreen ? 'Quitter le plein écran' : 'Plein écran'"
            :aria-pressed="fullscreen"
            @click="toggleFullscreen"
          >
            {{ fullscreen ? '⤡' : '⛶' }}
          </button>
        </span>
        <!-- Progression vers le terminal -->
        <span class="mono-arcade-progress" aria-hidden="true">
          <span class="mono-arcade-progress-bar" :style="{ width: `${Math.round(view.progress * 100)}%` }" />
        </span>
      </div>

      <!-- Aire de jeu -->
      <div class="mono-arcade-view relative">
        <canvas
          ref="canvas"
          :width="VIEW_W"
          :height="VIEW_H"
          class="mono-arcade-canvas block w-full"
          tabindex="0"
          role="application"
          :aria-label="`Arcade 221, jeu de plateforme. Salle ${view.levelIndex + 1} sur ${LEVELS.length}. ${touchMode ? 'Moitié gauche de l’écran pour courir, moitié droite pour sauter. Touchez encore en l’air pour un double saut.' : 'Flèches gauche et droite pour courir, Espace pour sauter et une seconde fois en l’air pour un double saut, P pour mettre en pause, R pour recommencer.'}`"
          @keydown="onKeyDown"
          @keyup="onKeyUp"
          @blur="onBlur"
          @focus="onFocus"
          @pointerdown="onCanvasPointer"
        />

        <!-- Zones tactiles : courir à gauche, sauter à droite -->
        <div v-if="touchMode && running && !paused" class="mono-arcade-zones" aria-hidden="true">
          <div
            class="mono-arcade-zone"
            :class="run.dir ? 'mono-arcade-zone-on' : ''"
            @pointerdown.prevent="runDown"
            @pointermove="runMove"
            @pointerup="runUp"
            @pointercancel="runUp"
            @lostpointercapture="runUp"
          >
            <span v-if="showZoneHint" class="mono-arcade-zone-hint">◀ COURIR ▶</span>
          </div>
          <div
            class="mono-arcade-zone"
            @pointerdown.prevent="jumpDown"
            @pointerup="jumpUp"
            @pointercancel="jumpUp"
            @lostpointercapture="jumpUp"
          >
            <span v-if="showZoneHint" class="mono-arcade-zone-hint">▲ SAUTER</span>
          </div>
        </div>

        <!-- Écrans : un appui n'importe où vaut le bouton principal -->
        <div v-if="overlay" class="mono-arcade-overlay" :class="`mono-arcade-overlay-${overlay}`" @click="onOverlayTap">
          <div class="mono-arcade-overlay-content">
            <p class="mono-arcade-eyebrow"><span aria-hidden="true">✦</span> LABO DE DAKAR <span aria-hidden="true">✦</span></p>
            <h3 class="mono-arcade-heading">
              <template v-if="overlay === 'title'">ARCADE <em>221</em></template>
              <template v-else-if="overlay === 'paused'">PETITE PAUSE</template>
              <template v-else-if="overlay === 'cleared'">SALLE <em>RÉTABLIE !</em></template>
              <template v-else-if="overlay === 'won'">MISSION <em>ACCOMPLIE !</em></template>
              <template v-else>À TOI DE <em>REJOUER !</em></template>
            </h3>
            <p v-if="overlay === 'title'" class="mono-arcade-description">
              Six salles, des robots et un réseau à sauver. Prêt pour l'aventure ?
            </p>
            <p v-else-if="overlay === 'cleared'" class="mono-arcade-description">{{ view.message }}</p>
            <p v-else-if="overlay === 'won'" class="mono-arcade-description">
              Bravo, le labo est sauvé ! {{ LEVELS.length }} salles en {{ seconds }} s · {{ view.score }} points
            </p>
            <p v-else-if="overlay === 'over'" class="mono-arcade-description">
              Bien joué ! {{ view.score }} points · record {{ best }}. Une autre partie ?
            </p>
            <p v-else class="mono-arcade-description">{{ touchMode ? 'Touchez pour reprendre' : 'P ou Échap pour reprendre' }}</p>
            <button type="button" class="mono-arcade-btn" @click="primary"><span aria-hidden="true">▶</span> {{ primaryLabel }}</button>
            <p v-if="overlay === 'title'" class="mono-arcade-controls">{{ controlsText }}</p>
          </div>
        </div>

        <!-- Conseil de la salle, en jeu -->
        <p
          v-else-if="view.phase === 'playing' && view.levelFrames < 240"
          class="pointer-events-none absolute inset-x-0 top-2 text-center font-mono text-[10px] text-amber-200/80"
        >
          {{ hintText }}
        </p>
      </div>

      <!-- Commandes tactiles : seulement sur écran tactile (cf. theme.css) -->
      <div class="mono-arcade-pad">
        <button
          type="button"
          class="mono-arcade-key"
          aria-label="Aller à gauche"
          @pointerdown.prevent="press('left', $event)"
          @pointerup="release('left', $event)"
          @pointerleave="release('left', $event)"
          @pointercancel="release('left', $event)"
        >
          ◀
        </button>
        <button
          type="button"
          class="mono-arcade-key"
          aria-label="Aller à droite"
          @pointerdown.prevent="press('right', $event)"
          @pointerup="release('right', $event)"
          @pointerleave="release('right', $event)"
          @pointercancel="release('right', $event)"
        >
          ▶
        </button>
        <button
          type="button"
          class="mono-arcade-key mono-arcade-key-jump"
          aria-label="Sauter"
          @pointerdown.prevent="press('jump', $event)"
          @pointerup="release('jump', $event)"
          @pointerleave="release('jump', $event)"
          @pointercancel="release('jump', $event)"
        >
          SAUT
        </button>
      </div>
    </div>
  </details>
</template>
