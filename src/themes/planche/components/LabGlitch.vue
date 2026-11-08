<script setup>
import { computed, inject, ref } from 'vue'
import RichText from '../../../components/RichText.vue'
import { ASM_PIPELINE, BNE_WINDOW, CALIBRATION, glitchOutcome } from '../../../core/lab-math.js'

/**
 * Planche 3.3 — Chronogramme d'injection de fautes.
 * Le rail VCC, l'horloge et la fenêtre de décodage sont superposés sur une même
 * base de temps, avec une cote de largeur d'impulsion, comme sur un relevé d'essai.
 */
const planche = inject('planche')

const offset = ref(145)
const width = ref(25)
const volt = ref(1.65)

const outcome = computed(() => glitchOutcome({ offset: offset.value, width: width.value, volt: volt.value }))

const verdict = computed(() => {
  if (outcome.value.success) {
    return {
      code: 'ESSAI CONCLUANT',
      tone: 'blue',
      text:
        String.raw`Violation du temps de setup pendant le cycle ` +
        '`FETCH/DECODE`' +
        String.raw` à $t=${offset.value}\text{ ns}$. L'instruction ` +
        '`BNE 0x08000190`' +
        ' a été corrompue en `NOP` : accès shell UART déverrouillé.',
    }
  }
  if (outcome.value.brownout) {
    return {
      code: 'REJET — BROWNOUT RESET',
      tone: 'red',
      text: String.raw`Impulsion trop profonde ($-\Delta V = ${volt.value.toFixed(2)}\text{ V}$) ou trop large ($${width.value}\text{ ns}$). Le détecteur de sous-tension a réinitialisé le microcontrôleur.`,
    }
  }
  return {
    code: 'SANS EFFET — SECURE BOOT',
    tone: 'muted',
    text: String.raw`Impulsion à $t=${offset.value}\text{ ns}$, hors de la fenêtre $[${BNE_WINDOW.start}\text{–}${BNE_WINDOW.end}\text{ ns}]$ ou d'amplitude insuffisante. La vérification de signature bloque l'exécution.`,
  }
})

const verdictClass = computed(
  () =>
    ({
      blue: 'border-pl-blue text-pl-blue',
      red: 'border-pl-red text-pl-red',
      muted: 'border-pl-rule/40 text-pl-muted',
    })[verdict.value.tone],
)

function calibrate() {
  offset.value = CALIBRATION.offset
  width.value = CALIBRATION.width
  volt.value = CALIBRATION.volt
  planche.showToast('Réglages calibrés sur la fenêtre de décodage BNE')
}

/* Base de temps commune : 0 → 340 ns */
const W = 620
const L = 52
const R = 18
const MAX_NS = 340
const plotW = W - L - R
const xOf = (ns) => L + (ns / MAX_NS) * plotW

/* Trois pistes empilées */
const CLK_Y = 26
const CLK_H = 16
const VCC_HI = 76
const VCC_LO = 148
const AXIS_Y = 186

const winX = computed(() => xOf(BNE_WINDOW.start))
const winW = computed(() => xOf(BNE_WINDOW.end) - xOf(BNE_WINDOW.start))

/** Horloge carrée : 20 ns par demi-période */
const clock = computed(() => {
  let d = `M ${L} ${CLK_Y + CLK_H}`
  let high = false
  for (let ns = 0; ns <= MAX_NS; ns += 20) {
    const x = xOf(ns)
    d += ` L ${x.toFixed(1)} ${high ? CLK_Y + CLK_H : CLK_Y}`
    high = !high
    d += ` L ${x.toFixed(1)} ${high ? CLK_Y + CLK_H : CLK_Y}`
  }
  return d
})

/** Rail VCC : plateau 3,3 V puis creux d'amplitude ΔV */
const rail = computed(() => {
  const x1 = xOf(offset.value)
  const x2 = xOf(offset.value + width.value)
  const depth = VCC_HI + (volt.value / 3.3) * (VCC_LO - VCC_HI)
  return {
    path: `M ${L} ${VCC_HI} L ${x1.toFixed(1)} ${VCC_HI} L ${(x1 + 3).toFixed(1)} ${depth.toFixed(1)} L ${(x2 - 3).toFixed(1)} ${depth.toFixed(1)} L ${x2.toFixed(1)} ${VCC_HI} L ${W - R} ${VCC_HI}`,
    x1,
    x2,
    depth,
  }
})

const traceClass = computed(() => (outcome.value.success ? 'text-pl-blue' : outcome.value.brownout ? 'text-pl-red' : 'text-pl-ink'))
</script>

<template>
  <section class="border-2 border-pl-rule bg-pl-paper/80">
    <header class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-pl-rule px-4 py-3 sm:px-6">
      <div class="min-w-0">
        <span class="pl-meta">PL-3.3 — Sécurité matérielle</span>
        <h2 class="mt-0.5 font-archivo text-lg font-bold uppercase tracking-tight text-pl-ink sm:text-xl">
          Chronogramme d'injection de fautes
        </h2>
      </div>
      <div class="shrink-0 border px-2.5 py-1 font-plexmono text-[0.66rem] uppercase tracking-wider" :class="verdictClass" role="status">
        {{ verdict.code }}
      </div>
    </header>

    <div class="grid grid-cols-1 gap-0 lg:grid-cols-12">
      <!-- Réglages du banc -->
      <div class="space-y-5 border-pl-rule/35 p-4 sm:p-6 lg:col-span-4 lg:border-r">
        <p class="font-plex text-[0.82rem] leading-relaxed text-pl-muted">
          <RichText
            text="Calez le délai ($\Delta t$) et la largeur ($\delta$) de l'impulsion pour perturber le rail $\text{V}_{\text{CC}}$ pendant le décodage de `BNE secure_lock` sur un ARM Cortex-M."
          />
        </p>

        <div>
          <div class="mb-1 flex items-baseline justify-between gap-2">
            <RichText tag="label" for="pl-offset" class="pl-meta" text="Délai $\Delta t$" />
            <span class="font-plexmono text-xs font-semibold text-pl-ink">{{ offset }} ns</span>
          </div>
          <input id="pl-offset" v-model.number="offset" type="range" min="50" max="300" step="5" />
        </div>

        <div>
          <div class="mb-1 flex items-baseline justify-between gap-2">
            <RichText tag="label" for="pl-width" class="pl-meta" text="Largeur $\delta$" />
            <span class="font-plexmono text-xs font-semibold text-pl-ink">{{ width }} ns</span>
          </div>
          <input id="pl-width" v-model.number="width" type="range" min="5" max="90" step="5" />
        </div>

        <div>
          <div class="mb-1 flex items-baseline justify-between gap-2">
            <RichText tag="label" for="pl-volt" class="pl-meta" text="Chute $\Delta V$" />
            <span class="font-plexmono text-xs font-semibold text-pl-ink">−{{ volt.toFixed(2) }} V</span>
          </div>
          <input id="pl-volt" v-model.number="volt" type="range" min="0.5" max="2.8" step="0.05" />
        </div>

        <!-- Pipeline cible -->
        <div class="border border-pl-rule/35">
          <div class="pl-meta border-b border-pl-rule/35 px-3 py-1.5">Pipeline cible</div>
          <div class="overflow-x-auto p-3 font-plexmono text-[0.66rem] leading-relaxed">
            <div
              v-for="line in ASM_PIPELINE"
              :key="line.addr"
              class="whitespace-nowrap"
              :class="line.tone === 'target' ? 'bg-pl-red/10 font-bold text-pl-red' : 'text-pl-ink/80'"
            >
              {{ line.addr }}: <span :class="line.tone === 'ok' ? 'text-pl-blue' : ''">{{ line.op }}</span> {{ line.arg }}
              <span v-if="line.note"> ← {{ line.note }}</span>
            </div>
          </div>
        </div>

        <button type="button" class="pl-btn w-full" @click="calibrate">
          Calibrer sur [{{ CALIBRATION.offset }} ns, {{ CALIBRATION.width }} ns, −{{ CALIBRATION.volt }} V]
        </button>
      </div>

      <!-- Chronogramme -->
      <div class="min-w-0 p-4 sm:p-5 lg:col-span-8">
        <svg :viewBox="`0 0 ${W} 224`" class="w-full" role="img" :aria-label="`Chronogramme : ${verdict.code}`">
          <!-- Fenêtre de décodage -->
          <rect :x="winX" y="14" :width="winW" :height="AXIS_Y - 14" class="fill-pl-red/10" />
          <line :x1="winX" y1="14" :x2="winX" :y2="AXIS_Y" stroke="currentColor" class="text-pl-red" stroke-width="1" stroke-dasharray="3 3" />
          <line :x1="winX + winW" y1="14" :x2="winX + winW" :y2="AXIS_Y" stroke="currentColor" class="text-pl-red" stroke-width="1" stroke-dasharray="3 3" />
          <text :x="winX + winW / 2" y="10" text-anchor="middle" class="fill-pl-red font-plexmono" style="font-size: 9px">
            FENÊTRE BNE {{ BNE_WINDOW.start }}–{{ BNE_WINDOW.end }} ns
          </text>

          <!-- Piste 1 : horloge -->
          <text :x="L - 8" :y="CLK_Y + 12" text-anchor="end" class="fill-pl-muted font-plexmono" style="font-size: 9px">CLK</text>
          <path :d="clock" fill="none" stroke="currentColor" class="text-pl-muted" stroke-width="1.25" />

          <!-- Piste 2 : rail VCC -->
          <text :x="L - 8" :y="VCC_HI + 3" text-anchor="end" class="fill-pl-muted font-plexmono" style="font-size: 9px">3.3 V</text>
          <text :x="L - 8" :y="VCC_LO + 3" text-anchor="end" class="fill-pl-red font-plexmono" style="font-size: 9px">BOD</text>
          <line :x1="L" :y1="VCC_HI" :x2="W - R" :y2="VCC_HI" stroke="currentColor" class="text-pl-grid" stroke-width="1" stroke-dasharray="2 3" />
          <line :x1="L" :y1="VCC_LO" :x2="W - R" :y2="VCC_LO" stroke="currentColor" class="text-pl-red" stroke-width="1" stroke-dasharray="5 4" opacity="0.6" />
          <path :d="rail.path" fill="none" stroke="currentColor" :class="traceClass" stroke-width="2.25" />

          <!-- Cote de largeur d'impulsion -->
          <g v-if="rail.x2 - rail.x1 > 18">
            <line :x1="rail.x1" :y1="rail.depth + 14" :x2="rail.x2" :y2="rail.depth + 14" stroke="currentColor" class="text-pl-blue" stroke-width="1" />
            <line :x1="rail.x1" :y1="rail.depth + 9" :x2="rail.x1" :y2="rail.depth + 19" stroke="currentColor" class="text-pl-blue" stroke-width="1" />
            <line :x1="rail.x2" :y1="rail.depth + 9" :x2="rail.x2" :y2="rail.depth + 19" stroke="currentColor" class="text-pl-blue" stroke-width="1" />
            <text :x="(rail.x1 + rail.x2) / 2" :y="rail.depth + 28" text-anchor="middle" class="fill-pl-blue font-plexmono" style="font-size: 9px">
              δ = {{ width }} ns
            </text>
          </g>

          <!-- Base de temps -->
          <line :x1="L" :y1="AXIS_Y" :x2="W - R" :y2="AXIS_Y" stroke="currentColor" class="text-pl-rule" stroke-width="2" />
          <g class="fill-pl-muted font-plexmono" style="font-size: 9px">
            <template v-for="ns in [0, 85, 170, 255, 340]" :key="ns">
              <line :x1="xOf(ns)" :y1="AXIS_Y" :x2="xOf(ns)" :y2="AXIS_Y + 5" stroke="currentColor" class="text-pl-rule" stroke-width="1" />
              <text :x="xOf(ns)" :y="AXIS_Y + 16" text-anchor="middle">{{ ns }}</text>
            </template>
            <text :x="W - R" :y="AXIS_Y + 28" text-anchor="end">nanosecondes depuis le trigger</text>
          </g>
        </svg>

        <!-- Verdict -->
        <div class="mt-3 border-l-[3px] p-3 font-plex text-[0.82rem] leading-relaxed" :class="verdictClass" aria-live="polite">
          <RichText :text="verdict.text" />
        </div>

        <p class="pl-annot pl-mark mt-2">
          ▸ La cote bleue mesure δ ; au-delà de 60 ns le BOD se déclenche avant que la faute ne soit exploitable.
        </p>
      </div>
    </div>
  </section>
</template>
