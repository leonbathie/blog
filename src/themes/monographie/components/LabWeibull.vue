<script setup>
import { computed, ref } from 'vue'
import RichText from '../../../components/RichText.vue'

/** Module 3.1 — Loi de Weibull, disponibilité et survie à l'horizon de mission. */
const eta = ref(140)
const beta = ref(1.0)
const mttr = ref(4.5)
const mission = ref(72)

const regime = computed(() => {
  if (beta.value < 0.95) return 'Jeunesse / Rodage'
  if (beta.value > 1.15) return 'Usure Mécanique'
  return 'Aléatoire (Constant)'
})
const availability = computed(() => (eta.value / (eta.value + mttr.value)) * 100)
const reliability = computed(() => Math.exp(-Math.pow(mission.value / eta.value, beta.value)) * 100)

function preset(scale, repair, horizon, shape) {
  eta.value = scale
  mttr.value = repair
  mission.value = horizon
  beta.value = shape
}

// Courbe R(t) sur 240 h
const W = 600
const H = 165
const PAD = 36
const MAX_T = 240
const plotW = W - PAD - 15

const chart = computed(() => {
  let line = ''
  let area = `M ${PAD} ${H}`
  for (let t = 0; t <= MAX_T; t += 4) {
    const r = Math.exp(-Math.pow(t / eta.value, beta.value))
    const x = PAD + (t / MAX_T) * plotW
    const y = H - r * (H - 15)
    line += t === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    area += ` L ${x} ${y}`
  }
  area += ` L ${W - 15} ${H} Z`
  const mx = PAD + (mission.value / MAX_T) * plotW
  const my = H - (reliability.value / 100) * (H - 15)
  return { line, area, mx, my }
})
</script>

<template>
  <div class="rounded-lg border border-mono-line bg-mono-panel/80 p-5 sm:p-8">
    <div class="flex flex-col justify-between gap-4 border-b border-mono-line pb-6 md:flex-row md:items-center">
      <div class="min-w-0">
        <span class="font-mono text-xs uppercase text-mono-accent">// MODULE 3.1 : INDUSTRIAL RELIABILITY TELEMETRY</span>
        <RichText tag="h2" class="mt-1 font-serif text-2xl text-mono-ink sm:text-3xl" text="Loi de Weibull $R(t) = e^{-(t/\eta)^\beta}$ &amp; Disponibilité Opérationnelle" />
        <RichText
          tag="p"
          class="mt-1 text-sm text-mono-muted"
          text="Modélisation appliquée aux lignes d'embouteillage (IBS) et équipements électromécaniques (H&amp;D Madar). Faites varier le paramètre de forme $\beta$ pour simuler la mortalité infantile ($\beta < 1$), l'aléatoire pur ($\beta = 1$) ou l'usure mécanique ($\beta > 1$)."
        />
      </div>
      <div class="shrink-0 rounded border border-mono-line bg-mono-surface p-3 font-mono text-xs">
        <div>Loi de Survie de Weibull :</div>
        <RichText tag="div" class="mt-1 font-semibold text-mono-accent" text="$$R(t) = \exp\left(-\left(\frac{t}{\eta}\right)^\beta\right)$$" />
        <RichText tag="div" class="mt-1" text="$$A = \frac{\text{MTBF}}{\text{MTBF} + \text{MTTR}}$$" />
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- Réglages -->
      <div class="space-y-5 font-mono text-xs">
        <div>
          <div class="mb-1.5 flex justify-between gap-2">
            <RichText tag="label" for="mono-eta" class="text-mono-muted" text="Échelle $\eta$ (Vie caractéristique) :" />
            <span class="shrink-0 font-bold text-mono-ink">{{ eta }} heures</span>
          </div>
          <input id="mono-eta" v-model.number="eta" type="range" min="30" max="400" class="w-full cursor-pointer accent-mono-accent" />
        </div>
        <div>
          <div class="mb-1.5 flex justify-between gap-2">
            <RichText tag="label" for="mono-beta" class="text-mono-muted" text="Forme de Weibull ($\beta$) :" />
            <span class="shrink-0 font-bold text-mono-accent">{{ beta.toFixed(1) }} ({{ regime }})</span>
          </div>
          <input id="mono-beta" v-model.number="beta" type="range" min="0.5" max="3.5" step="0.1" class="w-full cursor-pointer accent-mono-accent" />
        </div>
        <div>
          <div class="mb-1.5 flex justify-between gap-2">
            <label for="mono-mttr" class="text-mono-muted">MTTR (Temps Moyen Réparation) :</label>
            <span class="shrink-0 font-bold text-mono-ink">{{ mttr.toFixed(1) }} heures</span>
          </div>
          <input id="mono-mttr" v-model.number="mttr" type="range" min="0.5" max="24" step="0.5" class="w-full cursor-pointer accent-mono-accent" />
        </div>
        <div>
          <div class="mb-1.5 flex justify-between gap-2">
            <RichText tag="label" for="mono-mission" class="text-mono-muted" text="Horizon de Mission ($t$) :" />
            <span class="shrink-0 font-bold text-mono-ink">{{ mission }} heures</span>
          </div>
          <input id="mono-mission" v-model.number="mission" type="range" min="12" max="240" step="6" class="w-full cursor-pointer accent-mono-accent" />
        </div>
        <div class="space-y-2 border-t border-mono-line pt-3">
          <div class="text-[11px] uppercase text-mono-muted">Préréglages GMAO (DimoMaint / Coswin) :</div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="rounded border border-mono-line px-2.5 py-1 hover:border-mono-accent" @click="preset(95, 6.5, 72, 2.2)">
              <RichText text="Usure Mécanique ($\beta=2.2$)" />
            </button>
            <button type="button" class="rounded border border-mono-accent bg-mono-accent/10 px-2.5 py-1 text-mono-accent" @click="preset(190, 3.0, 72, 1.1)">
              Plan Préventif IBS (-25% Arrêts)
            </button>
          </div>
        </div>
      </div>

      <!-- Indicateurs & courbe -->
      <div class="flex min-w-0 flex-col justify-between space-y-6 lg:col-span-2">
        <div class="grid grid-cols-2 gap-3 font-mono sm:grid-cols-3 sm:gap-4">
          <div class="rounded border border-mono-line bg-mono-surface p-3 sm:p-4">
            <RichText tag="div" class="text-[11px] text-mono-muted" text="DISPONIBILITÉ ($A$)" />
            <div class="mt-1 text-xl font-bold text-emerald-500 sm:text-2xl">{{ availability.toFixed(2) }}%</div>
          </div>
          <div class="rounded border border-mono-line bg-mono-surface p-3 sm:p-4">
            <RichText tag="div" class="text-[11px] text-mono-muted" text="SURVIE À $t$ ($R(t)$)" />
            <div class="mt-1 text-xl font-bold text-mono-accent sm:text-2xl">{{ reliability.toFixed(2) }}%</div>
          </div>
          <div class="col-span-2 rounded border border-mono-line bg-mono-surface p-3 sm:col-span-1 sm:p-4">
            <div class="text-[11px] text-mono-muted">RÉGIME DE DÉFAILLANCE</div>
            <div class="mt-2 text-sm font-bold text-sky-500 sm:text-base">{{ regime }}</div>
          </div>
        </div>

        <div class="rounded border border-mono-line bg-mono-surface p-4">
          <div class="mb-2 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-mono-muted">
            <RichText text="COURBE DE SURVIE WEIBULL $R(t) = \exp(-(t/\eta)^\beta)$" />
            <span>AXE X : HEURES DE PRODUCTION CONTINUE</span>
          </div>
          <svg viewBox="0 0 600 190" class="h-44 w-full overflow-visible" role="img" aria-label="Courbe de survie de Weibull">
            <line :x1="PAD" y1="15" :x2="W - 15" y2="15" class="stroke-mono-line" stroke-dasharray="3,3" />
            <line :x1="PAD" :y1="H / 2" :x2="W - 15" :y2="H / 2" class="stroke-mono-line" stroke-dasharray="3,3" />
            <line :x1="PAD" :y1="H" :x2="W - 15" :y2="H" class="stroke-mono-muted/50" />
            <text x="4" y="20" class="fill-mono-muted font-mono text-[10px]">100%</text>
            <text x="8" :y="H / 2 + 3" class="fill-mono-muted font-mono text-[10px]">50%</text>
            <text x="14" :y="H" class="fill-mono-muted font-mono text-[10px]">0%</text>
            <text :x="PAD" :y="H + 16" class="fill-mono-muted font-mono text-[10px]">0h</text>
            <text :x="PAD + plotW / 2" :y="H + 16" class="fill-mono-muted font-mono text-[10px]">120h</text>
            <text :x="W - 35" :y="H + 16" class="fill-mono-muted font-mono text-[10px]">240h</text>
            <path :d="chart.area" class="fill-mono-accent/[0.12]" />
            <path :d="chart.line" fill="none" class="stroke-mono-accent" stroke-width="2.5" />
            <line :x1="chart.mx" y1="15" :x2="chart.mx" :y2="H" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="4,4" />
            <circle :cx="chart.mx" :cy="chart.my" r="5" class="fill-mono-accent" stroke="#ffffff" stroke-width="1.5" />
            <text :x="Math.min(chart.mx + 8, W - 125)" :y="Math.max(chart.my - 8, 25)" class="fill-sky-500 font-mono text-[11px] font-semibold">
              t={{ mission }}h ({{ reliability.toFixed(1) }}%)
            </text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
