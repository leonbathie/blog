<script setup>
import { computed, ref } from 'vue'
import RichText from '../../../components/RichText.vue'

/** Simulateur 03 — fiabilité GMAO : courbe de survie de Weibull R(t). */
const beta = ref(2.4)
const eta = ref(420)

const tOpt = computed(() => Math.round(eta.value * Math.pow(0.8, 1 / beta.value)))
const avail = computed(() => ((eta.value / (eta.value + 6.5)) * 100).toFixed(2))

const curve = computed(() => {
  let d = 'M 35 25'
  for (let t = 0; t <= 520; t += 10) {
    const r = Math.exp(-Math.pow(t / eta.value, beta.value))
    d += ` L ${35 + t} ${(165 - r * 140).toFixed(1)}`
  }
  return d
})
</script>

<template>
  <div class="spatial-panel grid grid-cols-1 gap-8 rounded-3xl border border-emerald-500/40 p-7 lg:grid-cols-12">
    <div class="space-y-5 font-mono text-xs lg:col-span-5">
      <RichText tag="div" class="font-bold text-emerald-300" text="LOI DE WEIBULL $R(t) = e^{-(t/\eta)^\beta}$ // GMAO" />
      <RichText
        tag="p"
        class="font-sans text-sm text-slate-300"
        text="Simulateur de planification préventive utilisé pour optimiser la disponibilité des équipements industriels chez **H&amp;D Madar Industrie** et **IBS**."
      />
      <div>
        <div class="mb-1 flex justify-between">
          <RichText tag="span" text="Paramètre de forme $\beta$ (Usure) :" />
          <span class="font-bold text-emerald-300">{{ beta.toFixed(1) }}</span>
        </div>
        <input v-model.number="beta" type="range" min="0.6" max="4.0" step="0.2" class="w-full accent-emerald-400" />
      </div>
      <div>
        <div class="mb-1 flex justify-between">
          <RichText tag="span" text="Vie caractéristique $\eta$ (heures) :" />
          <span class="font-bold text-cyan-300">{{ eta }} h</span>
        </div>
        <input v-model.number="eta" type="range" min="150" max="800" step="10" class="w-full accent-cyan-400" />
      </div>
      <div class="grid grid-cols-2 gap-3 pt-2">
        <div class="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-3">
          <RichText tag="div" class="text-[10px] text-slate-400" text="DISPONIBILITÉ $A$" />
          <div class="text-lg font-bold text-emerald-400">{{ avail }}%</div>
        </div>
        <div class="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-3">
          <RichText tag="div" class="text-[10px] text-slate-400" text="SEUIL PRÉVENTIF $T_{opt}$" />
          <div class="text-lg font-bold text-cyan-300">{{ tOpt }} h</div>
        </div>
      </div>
    </div>
    <div class="lg:col-span-7">
      <div class="rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-4">
        <RichText tag="div" class="mb-2 font-mono text-[11px] text-slate-400" text="COURBE DE SURVIE $R(t)$ SUR 700 HEURES DE PRODUCTION" />
        <svg viewBox="0 0 600 190" class="h-48 w-full" role="img" aria-label="Courbe de survie de Weibull">
          <line x1="35" y1="165" x2="560" y2="165" stroke="#334155" />
          <path :d="curve" fill="none" stroke="#10b981" stroke-width="3" />
        </svg>
      </div>
    </div>
  </div>
</template>
