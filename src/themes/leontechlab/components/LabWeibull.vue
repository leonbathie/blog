<script setup>
import { computed, inject, onBeforeUnmount, reactive, ref, watch } from 'vue'
import RichText from '../../../components/RichText.vue'
import { availability, survival, WEIBULL_PRESETS, weibullRegime } from '../../../core/lab-math.js'
import { t } from '../i18n.js'

/**
 * Module 3 : loi de Weibull et disponibilité.
 * Le graphique se lit comme un oscilloscope : courbes à lueur de phosphore, balayage,
 * déformation progressive quand un réglage change, et réticule qui suit le doigt.
 */
const leon = inject('leon')
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const eta = ref(150)
const beta = ref(1.2)
const mttr = ref(4.5)
const mission = ref(72)

const dispo = computed(() => availability(eta.value, mttr.value))
const survie = computed(() => survival(mission.value, eta.value, beta.value) * 100)
// lab-math renvoie le régime en français : on le traduit par sa clé
const REGIMES = { 'Jeunesse / Rodage': 'infant', 'Aléatoire (Constant)': 'random', 'Usure Mécanique': 'wear' }
const regime = computed(() => t(`lab.weibull.regimes.${REGIMES[weibullRegime(beta.value)] ?? 'random'}`))

function preset(p) {
  eta.value = p.eta
  beta.value = p.beta
  mttr.value = p.mttr
  mission.value = p.mission
  leon.toast(t('lab.weibull.presetDone'))
}

/* ---------- Déformation progressive ---------- */
// Les valeurs tracées rejoignent les réglages en quelques images : la courbe se
// déforme sous les yeux au lieu de sauter d'une forme à l'autre.
const shown = reactive({ eta: eta.value, beta: beta.value })
let tween = 0
watch([eta, beta], () => {
  window.cancelAnimationFrame(tween)
  if (reduced) {
    shown.eta = eta.value
    shown.beta = beta.value
    return
  }
  const step = () => {
    shown.eta += (eta.value - shown.eta) * 0.24
    shown.beta += (beta.value - shown.beta) * 0.24
    if (Math.abs(eta.value - shown.eta) < 0.05 && Math.abs(beta.value - shown.beta) < 0.001) {
      shown.eta = eta.value
      shown.beta = beta.value
      return
    }
    tween = window.requestAnimationFrame(step)
  }
  tween = window.requestAnimationFrame(step)
})
onBeforeUnmount(() => window.cancelAnimationFrame(tween))

/* ---------- Graphique ---------- */
const W = 600
const H = 250
const PL = 58
const PR = 16
const PT = 14
const PB = 38
const MAX_T = 300
const plotW = W - PL - PR
const plotH = H - PT - PB
const xOf = (time) => PL + (time / MAX_T) * plotW
const yOf = (v) => PT + (1 - v) * plotH
/** Taux de défaillance λ(t) = (β/η)(t/η)^(β−1) ; en t = 0, on évite la division par zéro */
const hazard = (time, e, b) => (b / e) * Math.pow(Math.max(time, 1.5) / e, b - 1)

const GRID_Y = [0, 0.25, 0.5, 0.75, 1]
const GRID_X = [0, 50, 100, 150, 200, 250, 300]

const curves = computed(() => {
  const e = shown.eta
  const b = shown.beta
  const times = []
  for (let time = 0; time <= MAX_T; time += 3) times.push(time)
  const hs = times.map((time) => hazard(time, e, b))
  const hMax = Math.max(...hs) || 1
  let r = ''
  let h = ''
  times.forEach((time, i) => {
    const x = xOf(time).toFixed(1)
    r += `${i ? ' L' : 'M'} ${x} ${yOf(survival(time, e, b)).toFixed(1)}`
    h += `${i ? ' L' : 'M'} ${x} ${yOf(hs[i] / hMax).toFixed(1)}`
  })
  const area = `${r} L ${xOf(MAX_T)} ${yOf(0)} L ${xOf(0)} ${yOf(0)} Z`
  return { r, h, area, hMax }
})

const missionPoint = computed(() => ({
  x: xOf(Math.min(mission.value, MAX_T)),
  y: yOf(survival(mission.value, shown.eta, shown.beta)),
}))

/* ---------- Réticule ---------- */
const cursor = ref(null) // temps lu, en heures
function onPointer(event) {
  const box = event.currentTarget.getBoundingClientRect()
  const x = ((event.clientX - box.left) / box.width) * W
  cursor.value = Math.round(Math.min(MAX_T, Math.max(0, ((x - PL) / plotW) * MAX_T)))
}
const reading = computed(() => {
  if (cursor.value === null) return null
  const time = cursor.value
  const r = survival(time, shown.eta, shown.beta)
  const l = hazard(time, shown.eta, shown.beta) / curves.value.hMax
  return {
    x: xOf(time),
    yr: yOf(r),
    yh: yOf(l),
    text: t('lab.weibull.cursor', { t: time, r: (r * 100).toFixed(1), l: Math.round(l * 100) }),
  }
})
</script>

<template>
  <section class="leon-panel leon-panel-pad">
    <h3 class="leon-panel-head leon-panel-head-wrap">{{ t('lab.weibull.title') }}</h3>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div class="space-y-3 text-[1.05rem] lg:col-span-5">
        <div>
          <div class="flex justify-between text-leon-dim">
            <RichText tag="span" :text="t('lab.weibull.eta')" />
            <span class="text-leon-green">{{ eta }} {{ t('lab.weibull.hours') }}</span>
          </div>
          <input v-model.number="eta" type="range" min="30" max="400" :aria-label="t('lab.weibull.eta').replace(/\$[^$]*\$/g, '')" />
        </div>
        <div>
          <div class="flex justify-between text-leon-dim">
            <RichText tag="span" :text="t('lab.weibull.beta')" />
            <span class="text-leon-green">{{ beta.toFixed(1) }}</span>
          </div>
          <input v-model.number="beta" type="range" min="0.5" max="3.5" step="0.1" :aria-label="t('lab.weibull.beta').replace(/\$[^$]*\$/g, '')" />
        </div>
        <div>
          <div class="flex justify-between text-leon-dim">
            <span>{{ t('lab.weibull.mttr') }}</span>
            <span class="text-leon-green">{{ mttr.toFixed(1) }} {{ t('lab.weibull.hours') }}</span>
          </div>
          <input v-model.number="mttr" type="range" min="0.5" max="24" step="0.5" :aria-label="t('lab.weibull.mttr')" />
        </div>
        <div>
          <div class="flex justify-between text-leon-dim">
            <span>{{ t('lab.weibull.mission') }}</span>
            <span class="text-leon-green">{{ mission }} {{ t('lab.weibull.hours') }}</span>
          </div>
          <input v-model.number="mission" type="range" min="4" max="300" step="4" :aria-label="t('lab.weibull.mission')" />
        </div>
        <div class="leon-cmdbox text-[1.02rem]">
          <div>{{ t('lab.weibull.availability') }} : <span class="text-leon-green">{{ dispo.toFixed(1) }} %</span></div>
          <div>{{ t('lab.weibull.survival', { h: mission }) }} : <span class="text-leon-gold">{{ survie.toFixed(1) }} %</span></div>
          <div>{{ t('lab.weibull.regime') }} : <span class="text-leon-ink">{{ regime }}</span></div>
        </div>
        <div class="flex flex-wrap gap-x-1 gap-y-0.5">
          <button v-for="(p, i) in WEIBULL_PRESETS" :key="p.label" type="button" class="leon-btn leon-btn-wrap" @click="preset(p)">
            <RichText :text="t('lab.weibull.presets')[i] ?? p.label" />
          </button>
        </div>
      </div>

      <figure class="lg:col-span-7">
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          class="leon-scope block w-full"
          role="img"
          :aria-label="t('lab.weibull.chart', { p: survie.toFixed(0), h: mission })"
          @pointerdown="onPointer"
          @pointermove="onPointer"
          @pointerleave="cursor = null"
        >
          <defs>
            <filter id="leon-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="leon-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color: rgb(var(--leon-green)); stop-opacity: 0.32" />
              <stop offset="1" style="stop-color: rgb(var(--leon-green)); stop-opacity: 0" />
            </linearGradient>
            <linearGradient id="leon-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" style="stop-color: rgb(var(--leon-green)); stop-opacity: 0" />
              <stop offset="1" style="stop-color: rgb(var(--leon-green)); stop-opacity: 0.22" />
            </linearGradient>
            <clipPath id="leon-plot">
              <rect :x="PL" :y="PT" :width="plotW" :height="plotH" />
            </clipPath>
          </defs>

          <!-- Graticule -->
          <g class="text-leon-dark" stroke="currentColor" stroke-dasharray="2 4">
            <line v-for="v in GRID_Y" :key="`gy${v}`" :x1="PL" :x2="W - PR" :y1="yOf(v)" :y2="yOf(v)" />
            <line v-for="time in GRID_X" :key="`gx${time}`" :x1="xOf(time)" :x2="xOf(time)" :y1="PT" :y2="PT + plotH" />
          </g>
          <!-- Étiquettes à 22 unités : environ 13 px sur téléphone, 17 px sur ordinateur -->
          <g class="fill-leon-dim" style="font-size: 22px">
            <text v-for="v in [0, 0.5, 1]" :key="`ly${v}`" :x="PL - 8" :y="yOf(v) + 7" text-anchor="end">{{ v * 100 }}%</text>
            <text
              v-for="(time, i) in [0, 100, 200, 300]"
              :key="`lx${time}`"
              :x="xOf(time)"
              :y="H - 9"
              :text-anchor="i === 0 ? 'start' : i === 3 ? 'end' : 'middle'"
            >
              {{ time }} {{ t('lab.weibull.hours') }}
            </text>
          </g>

          <g clip-path="url(#leon-plot)">
            <!-- Balayage d'oscilloscope -->
            <rect v-if="!reduced" :x="PL - 60" :y="PT" width="60" :height="plotH" fill="url(#leon-sweep)">
              <animate attributeName="x" :from="PL - 60" :to="PL + plotW" dur="3.6s" repeatCount="indefinite" />
            </rect>
            <!-- Aire sous R(t), puis les deux courbes -->
            <path :d="curves.area" fill="url(#leon-area)" />
            <path :d="curves.h" fill="none" stroke="currentColor" class="text-leon-gold" stroke-width="1.6" stroke-dasharray="5 4" filter="url(#leon-glow)" />
            <path :d="curves.r" fill="none" stroke="currentColor" class="leon-draw text-leon-green" stroke-width="2.6" pathLength="1" filter="url(#leon-glow)" />
          </g>

          <!-- Temps de mission -->
          <line :x1="missionPoint.x" :x2="missionPoint.x" :y1="PT" :y2="PT + plotH" stroke="currentColor" class="text-leon-gold" stroke-dasharray="3 3" />
          <circle v-if="!reduced" :cx="missionPoint.x" :cy="missionPoint.y" r="4" fill="none" stroke="currentColor" class="text-leon-gold">
            <animate attributeName="r" values="3;10;3" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <rect :x="missionPoint.x - 3.5" :y="missionPoint.y - 3.5" width="7" height="7" class="fill-leon-gold" />

          <!-- Réticule -->
          <g v-if="reading">
            <line :x1="reading.x" :x2="reading.x" :y1="PT" :y2="PT + plotH" stroke="currentColor" class="text-leon-bright" />
            <rect :x="reading.x - 3" :y="reading.yr - 3" width="6" height="6" class="fill-leon-bright" />
            <rect :x="reading.x - 3" :y="reading.yh - 3" width="6" height="6" class="fill-leon-gold" />
            <rect :x="PL + 4" :y="PT + 4" :width="Math.min(plotW - 8, reading.text.length * 9.6 + 16)" height="28" class="fill-leon-bg" stroke="currentColor" />
            <text :x="PL + 11" :y="PT + 25" class="fill-leon-bright" style="font-size: 20px">{{ reading.text }}</text>
          </g>
        </svg>
        <figcaption class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[0.98rem]">
          <span class="text-leon-green"><span aria-hidden="true">━━ </span>{{ t('lab.weibull.legendR') }}</span>
          <span class="text-leon-gold"><span aria-hidden="true">╍╍ </span>{{ t('lab.weibull.legendH') }}</span>
          <span class="text-leon-dim">{{ t('lab.weibull.hint') }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>
