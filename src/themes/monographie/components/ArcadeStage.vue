<script setup>
import { computed, inject, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { createGame, SCORE } from '../game/engine.js'
import { LEVELS } from '../game/levels.js'
import { draw, VIEW_H, VIEW_W } from '../game/render.js'
import { readPref, writePref } from '../../../core/prefs.js'

/**
 * « Arcade 221 » — le mini-jeu du labo de Dakar.
 *
 * Un vrai jeu de plateforme, jouable jusqu'au bout : quatre salles, trois vies,
 * un terminal à atteindre dans chacune. Univers propre au blog (ingénieur,
 * puces de données, surtensions), pas le décalque d'un jeu existant.
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
const view = reactive({ ...game.state })
const best = ref(Number(readPref('mono:arcade-best', '0')) || 0)
const paused = ref(false)
const focused = ref(false)

const STEP_MS = 1000 / 60
const input = { left: false, right: false, jump: false }
let raf = 0
let last = 0
let acc = 0
let frames = 0

/* ---------- Synchronisation de l'état lisible par le gabarit ---------- */
function sync() {
  view.phase = game.state.phase
  view.levelIndex = game.state.levelIndex
  view.levelName = game.state.levelName
  view.hint = game.state.hint
  view.lives = game.state.lives
  view.score = game.state.score
  view.chipsLeft = game.state.chipsLeft
  view.chipsTotal = game.state.chipsTotal
  view.message = game.state.message
  view.frames = game.state.frames
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
    ? 'Touches ◀ ▶ pour courir · SAUT pour sauter'
    : '← → ou A/D pour courir · Espace pour sauter · P pause · R recommencer',
)

const running = computed(() => view.phase === 'playing' || view.phase === 'dying')
const overlay = computed(() => (running.value ? (paused.value ? 'paused' : null) : view.phase))
const chipsTaken = computed(() => view.chipsTotal - view.chipsLeft)
const seconds = computed(() => Math.floor(view.frames / 60))

/* ---------- Sons et retours dans la page ---------- */
function handleEvents() {
  for (const e of game.drainEvents()) {
    if (e.type === 'jump') mono.sfx.jump()
    else if (e.type === 'chip') {
      mono.sfx.blip()
      mono.addScore(SCORE.chip, 1)
    } else if (e.type === 'stomp') mono.sfx.blip()
    else if (e.type === 'die') mono.sfx.whoosh()
    else if (e.type === 'cleared') {
      mono.sfx.fanfare()
      const rect = canvas.value?.getBoundingClientRect()
      if (rect) mono.coinBurst(rect.left + rect.width / 2, rect.top + 40, 4, e.perfect ? 'SALLE PARFAITE' : 'SALLE RÉTABLIE')
    } else if (e.type === 'won') mono.sfx.fanfare()
  }
}

/* ---------- Boucle ---------- */
function render() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return
  draw(ctx, game.state, game.cameraFor(VIEW_W, VIEW_H), frames)
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
      handleEvents()
      acc -= STEP_MS
      steps += 1
      frames += 1
    }
  } else {
    acc = 0
    frames += 1
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
      paused.value = !paused.value
      event.preventDefault()
    }
    return
  }
  if (event.code === 'KeyR') {
    restart()
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
  input[action] = true
  event.preventDefault() // sinon Espace et les flèches font défiler la page
}

function onKeyUp(event) {
  const action = KEYS[event.code]
  if (!action) return
  input[action] = false
  event.preventDefault()
}

/* ---------- Commandes tactiles ----------
   `padPointers` compte les doigts posés sur les commandes. Sans ce compteur,
   toucher une touche faisait perdre le focus au canevas, ce qui relâchait les
   entrées et mettait le jeu en pause : le tactile était inutilisable. */
let padPointers = 0

function press(action, event) {
  // L'entrée d'abord : elle ne doit dépendre d'aucune étape faillible.
  padPointers += 1
  input[action] = true
  // Capture du pointeur : si le doigt glisse hors du bouton, c'est quand même
  // lui qui recevra le relâchement, sinon la touche resterait enfoncée.
  // Elle échoue sur certains pointeurs (événements synthétiques, pointeur déjà
  // relâché) et lève alors : la partie ne doit pas s'arrêter pour si peu.
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId)
  } catch {
    /* capture indisponible : pointerleave et pointercancel prennent le relais */
  }
}

function release(action, event) {
  if (input[action]) padPointers = Math.max(0, padPointers - 1)
  input[action] = false
  try {
    event?.currentTarget?.releasePointerCapture?.(event.pointerId)
  } catch {
    /* rien à libérer */
  }
}

function releaseAll() {
  input.left = false
  input.right = false
  input.jump = false
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
  pointerQuery = window.matchMedia?.('(pointer: coarse)')
  if (pointerQuery) {
    touchMode.value = pointerQuery.matches
    pointerQuery.addEventListener?.('change', onPointerChange)
  }

  // Crochet de test : permet à un robot de lire la position du joueur pour
  // décider quand sauter, tout en envoyant de vraies touches. `import.meta.env.DEV`
  // est remplacé par false au build : la ligne disparaît du site publié.
  if (import.meta.env.DEV && canvas.value) canvas.value.__arcade = game
})

onBeforeUnmount(() => {
  stopLoop()
  rememberBest()
  document.removeEventListener('visibilitychange', onVisibility)
  pointerQuery?.removeEventListener?.('change', onPointerChange)
})

defineExpose({ start: restart })
</script>

<template>
  <details class="mono-arcade" :open="open" @toggle="emit('update:open', $event.target.open)">
    <summary>Une pause au laboratoire : jouer à Arcade 221</summary>

    <div ref="stage" class="relative border-t-2 border-amber-500/60 bg-[#2a1708] dark:border-amber-400/50">
      <!-- Tableau de bord -->
      <div
        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-amber-500/30 bg-zinc-900/95 px-3 py-1.5 font-pixel text-[10px] text-amber-400"
        role="status"
        aria-live="polite"
      >
        <span>SALLE {{ String(view.levelIndex + 1).padStart(2, '0') }}/{{ LEVELS.length }}</span>
        <span>VIES <span class="text-zinc-100">{{ '●'.repeat(Math.max(0, view.lives)) || '—' }}</span></span>
        <span>PUCES <span class="text-zinc-100">{{ chipsTaken }}/{{ view.chipsTotal }}</span></span>
        <span>SCORE <span class="text-zinc-100">{{ String(view.score).padStart(5, '0') }}</span></span>
        <span class="hidden sm:inline">RECORD <span class="text-zinc-100">{{ String(best).padStart(5, '0') }}</span></span>
      </div>

      <!-- Aire de jeu -->
      <div class="relative">
        <canvas
          ref="canvas"
          :width="VIEW_W"
          :height="VIEW_H"
          class="mono-arcade-canvas block w-full"
          tabindex="0"
          role="application"
          :aria-label="`Arcade 221, jeu de plateforme. Salle ${view.levelIndex + 1} sur ${LEVELS.length}. Flèches gauche et droite pour courir, Espace pour sauter, P pour mettre en pause, R pour recommencer.`"
          @keydown="onKeyDown"
          @keyup="onKeyUp"
          @blur="onBlur"
          @focus="onFocus"
          @pointerdown="onCanvasPointer"
        />

        <!-- Écrans -->
        <div
          v-if="overlay"
          class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/82 px-4 text-center"
        >
          <p class="font-pixel text-[11px] leading-relaxed text-amber-400 sm:text-[13px]">
            <template v-if="overlay === 'title'">ARCADE 221 — LABO DE DAKAR</template>
            <template v-else-if="overlay === 'paused'">PAUSE</template>
            <template v-else-if="overlay === 'cleared'">{{ view.message }}</template>
            <template v-else-if="overlay === 'won'">RÉSEAU RÉTABLI</template>
            <template v-else>RÉSEAU HORS TENSION</template>
          </p>

          <p v-if="overlay === 'title'" class="max-w-md font-mono text-[11px] leading-relaxed text-zinc-300">
            Remettez le réseau sous tension : traversez les {{ LEVELS.length }} salles jusqu'au terminal.
            Les puces de données rapportent des points, les surtensions coûtent une vie.
          </p>
          <p v-else-if="overlay === 'won'" class="font-mono text-[11px] text-zinc-300">
            {{ LEVELS.length }} salles en {{ seconds }} s · score {{ view.score }} · record {{ best }}
          </p>
          <p v-else-if="overlay === 'over'" class="font-mono text-[11px] text-zinc-300">
            Score {{ view.score }} · record {{ best }}
          </p>
          <p v-else-if="overlay === 'paused'" class="font-mono text-[11px] text-zinc-300">
            P ou Échap pour reprendre
          </p>

          <button type="button" class="mono-arcade-btn" @click="primary">{{ primaryLabel }}</button>

          <p v-if="overlay === 'title'" class="font-mono text-[10px] text-zinc-500">{{ controlsText }}</p>
        </div>

        <!-- Conseil de la salle, en jeu -->
        <p
          v-else-if="view.phase === 'playing' && view.frames < 240"
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
