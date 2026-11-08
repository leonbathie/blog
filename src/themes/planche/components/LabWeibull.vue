<script setup>
import { computed, ref } from 'vue'
import RichText from '../../../components/RichText.vue'
import { availability, survival, weibullRegime, WEIBULL_PRESETS } from '../../../core/lab-math.js'

/**
 * Planche 3.1 — Abaque de survie.
 * La courbe est tracée sur le carroyage de la planche, et l'horizon de mission
 * est relevé par une cote (ligne de rappel + flèches), comme sur un plan.
 */
const eta = ref(140)
const beta = ref(1.0)
const mttr = ref(4.5)
const mission = ref(72)

const regime = computed(() => weibullRegime(beta.value))
const dispo = computed(() => availability(eta.value, mttr.value))
const survie = computed(() => survival(mission.value, eta.value, beta.value) * 100)

function applyPreset(p) {
  eta.value = p.eta
  mttr.value = p.mttr
  mission.value = p.mission
  beta.value = p.beta
}

/* Repère : 240 h en abscisse, 0–100 % en ordonnée */
const W = 620
const H = 260
const L = 46
const R = 18
const T = 16
const B = 34
const MAX_T = 240
const plotW = W - L - R
const plotH = H - T - B

const xOf = (t) => L + (t / MAX_T) * plotW
const yOf = (r) => T + (1 - r) * plotH

const xTicks = [0, 60, 120, 180, 240]
const yTicks = [0, 25, 50, 75, 100]

const curve = computed(() => {
  let d = ''
  for (let t = 0; t <= MAX_T; t += 3) {
    const x = xOf(t)
    const y = yOf(survival(t, eta.value, beta.value))
    d += t === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
})

const marker = computed(() => ({
  x: xOf(mission.value),
  y: yOf(survie.value / 100),
}))

/** Vie caractéristique η : repère vertical de construction */
const etaX = computed(() => xOf(Math.min(eta.value, MAX_T)))
</script>

<template>
  <section class="border-2 border-pl-rule bg-pl-paper/80">
    <!-- Bandeau de planche -->
    <header class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-pl-rule px-4 py-3 sm:px-6">
      <div class="min-w-0">
        <span class="pl-meta">PL-3.1 — Fiabilité industrielle</span>
        <h2 class="mt-0.5 font-archivo text-lg font-bold uppercase tracking-tight text-pl-ink sm:text-xl">
          Abaque de survie &amp; disponibilité opérationnelle
        </h2>
      </div>
      <RichText class="pl-meta shrink-0" text="$R(t) = \exp(-(t/\eta)^\beta)$" />
    </header>

    <div class="grid grid-cols-1 gap-0 lg:grid-cols-12">
      <!-- Colonne de réglages -->
      <div class="space-y-5 border-pl-rule/35 p-4 sm:p-6 lg:col-span-4 lg:border-r">
        <p class="font-plex text-[0.82rem] leading-relaxed text-pl-muted">
          <RichText
            text="Relevé appliqué aux lignes d'embouteillage (IBS) et aux équipements électromécaniques (H&amp;D Madar). Le paramètre de forme $\beta$ décrit le régime : rodage ($\beta<1$), aléatoire ($\beta=1$), usure ($\beta>1$)."
          />
        </p>

        <div>
          <div class="mb-1 flex items-baseline justify-between gap-2">
            <RichText tag="label" for="pl-eta" class="pl-meta" text="Échelle $\eta$" />
            <span class="font-plexmono text-xs font-semibold text-pl-ink">{{ eta }} h</span>
          </div>
          <input id="pl-eta" v-model.number="eta" type="range" min="30" max="400" />
        </div>

        <div>
          <div class="mb-1 flex items-baseline justify-between gap-2">
            <RichText tag="label" for="pl-beta" class="pl-meta" text="Forme $\beta$" />
            <span class="font-plexmono text-xs font-semibold text-pl-blue">{{ beta.toFixed(1) }}</span>
          </div>
          <input id="pl-beta" v-model.number="beta" type="range" min="0.5" max="3.5" step="0.1" />
          <div class="mt-1 font-plexmono text-[0.62rem] uppercase tracking-wider text-pl-muted">
            Régime : <span class="text-pl-ink">{{ regime }}</span>
          </div>
        </div>

        <div>
          <div class="mb-1 flex items-baseline justify-between gap-2">
            <label for="pl-mttr" class="pl-meta">MTTR</label>
            <span class="font-plexmono text-xs font-semibold text-pl-ink">{{ mttr.toFixed(1) }} h</span>
          </div>
          <input id="pl-mttr" v-model.number="mttr" type="range" min="0.5" max="24" step="0.5" />
        </div>

        <div>
          <div class="mb-1 flex items-baseline justify-between gap-2">
            <RichText tag="label" for="pl-mission" class="pl-meta" text="Horizon $t$" />
            <span class="font-plexmono text-xs font-semibold text-pl-ink">{{ mission }} h</span>
          </div>
          <input id="pl-mission" v-model.number="mission" type="range" min="12" max="240" step="6" />
        </div>

        <div class="pl-rule-thin pt-3">
          <div class="pl-meta mb-2">Préréglages GMAO</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in WEIBULL_PRESETS"
              :key="p.label"
              type="button"
              class="pl-btn"
              :class="p.primary ? 'border-pl-blue text-pl-blue' : ''"
              @click="applyPreset(p)"
            >
              <RichText :text="p.label" />
            </button>
          </div>
        </div>
      </div>

      <!-- Colonne de tracé -->
      <div class="min-w-0 lg:col-span-8">
        <!-- Cotes relevées -->
        <div class="grid grid-cols-3 border-b border-pl-rule/35">
          <div class="border-r border-pl-rule/35 px-4 py-3">
            <RichText tag="div" class="pl-meta" text="Disponibilité $A$" />
            <div class="mt-0.5 font-plexmono text-lg font-semibold text-pl-ink sm:text-xl">{{ dispo.toFixed(2) }}<span class="text-sm">%</span></div>
          </div>
          <div class="border-r border-pl-rule/35 px-4 py-3">
            <RichText tag="div" class="pl-meta" text="Survie $R(t)$" />
            <div class="mt-0.5 font-plexmono text-lg font-semibold text-pl-blue sm:text-xl">{{ survie.toFixed(2) }}<span class="text-sm">%</span></div>
          </div>
          <div class="px-4 py-3">
            <div class="pl-meta">Régime</div>
            <div class="mt-0.5 font-plexmono text-xs font-semibold text-pl-ink sm:text-sm">{{ regime }}</div>
          </div>
        </div>

        <div class="p-4 sm:p-5">
          <svg
            :viewBox="`0 0 ${W} ${H}`"
            class="w-full"
            role="img"
            :aria-label="`Abaque de survie de Weibull : ${survie.toFixed(1)} % de survie à ${mission} heures`"
          >
            <!-- Carroyage de la planche -->
            <g stroke="currentColor" class="text-pl-grid">
              <line v-for="t in xTicks" :key="`gx${t}`" :x1="xOf(t)" :y1="T" :x2="xOf(t)" :y2="T + plotH" stroke-width="1" opacity="0.55" />
              <line v-for="r in yTicks" :key="`gy${r}`" :x1="L" :y1="yOf(r / 100)" :x2="L + plotW" :y2="yOf(r / 100)" stroke-width="1" opacity="0.55" />
            </g>

            <!-- Axes -->
            <g stroke="currentColor" class="text-pl-rule" stroke-width="2">
              <line :x1="L" :y1="T" :x2="L" :y2="T + plotH" />
              <line :x1="L" :y1="T + plotH" :x2="L + plotW" :y2="T + plotH" />
            </g>

            <!-- Graduations -->
            <g class="fill-pl-muted font-plexmono" style="font-size: 10px">
              <text v-for="r in yTicks" :key="`ly${r}`" :x="L - 8" :y="yOf(r / 100) + 3" text-anchor="end">{{ r }}</text>
              <text v-for="t in xTicks" :key="`lx${t}`" :x="xOf(t)" :y="T + plotH + 16" text-anchor="middle">{{ t }}</text>
              <text :x="L - 8" :y="T - 4" text-anchor="end">%</text>
              <text :x="L + plotW" :y="T + plotH + 30" text-anchor="end">heures de production continue</text>
            </g>

            <!-- Repère de construction : vie caractéristique η -->
            <g v-if="eta <= MAX_T">
              <line :x1="etaX" :y1="T" :x2="etaX" :y2="T + plotH" stroke="currentColor" class="text-pl-red" stroke-width="1" stroke-dasharray="2 4" opacity="0.8" />
              <text :x="etaX + 4" :y="T + 10" class="fill-pl-red font-plexmono" style="font-size: 9px">η</text>
            </g>

            <!-- Courbe de survie -->
            <path :d="curve" fill="none" stroke="currentColor" class="text-pl-ink" stroke-width="2.25" />

            <!-- Cote de relevé à l'horizon de mission -->
            <g>
              <line :x1="marker.x" :y1="marker.y" :x2="marker.x" :y2="T + plotH" stroke="currentColor" class="text-pl-blue" stroke-width="1" stroke-dasharray="3 3" />
              <line :x1="L" :y1="marker.y" :x2="marker.x" :y2="marker.y" stroke="currentColor" class="text-pl-blue" stroke-width="1" stroke-dasharray="3 3" />
              <rect :x="marker.x - 3.5" :y="marker.y - 3.5" width="7" height="7" class="fill-pl-blue" />
              <text
                :x="Math.min(marker.x + 8, W - 120)"
                :y="Math.max(marker.y - 8, T + 12)"
                class="fill-pl-blue font-plexmono"
                style="font-size: 10px; font-weight: 600"
              >
                t={{ mission }} h · {{ survie.toFixed(1) }} %
              </text>
            </g>
          </svg>

          <!-- Annotation révélée par le calque -->
          <p class="pl-annot pl-mark mt-2">
            ▸ Repère rouge : vie caractéristique η — 63,2 % des équipements ont défailli à cet instant.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
