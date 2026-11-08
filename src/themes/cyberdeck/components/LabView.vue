<script setup>
import { useRouter } from 'vue-router'
import LabGlitchDeck from './LabGlitchDeck.vue'
import LabPqcDeck from './LabPqcDeck.vue'
import LabWeibullDeck from './LabWeibullDeck.vue'

/** Espace 04 — Cyber-Lab : 3 simulateurs temps réel couplés au moteur 3D. */
defineProps({ tab: { type: String, default: 'glitch' } })
const router = useRouter()

const tabs = [
  { id: 'glitch', label: '⚡ 01. FAULTY CAT GLITCHER', active: 'bg-rose-500 text-slate-950', hover: 'hover:text-rose-300' },
  { id: 'pqc', label: '🔐 02. KYBER-1024 LATTICE', active: 'bg-cyan-400 text-slate-950', hover: 'hover:text-cyan-300' },
  { id: 'weibull', label: '⚙️ 03. FIABILITÉ GMAO WEIBULL', active: 'bg-emerald-400 text-slate-950', hover: 'hover:text-emerald-300' },
]

function go(id) {
  router.push({ name: 'lab', params: { module: id } })
}
</script>

<template>
  <section class="space-y-6">
    <div class="spatial-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-cyan-500/30 p-5">
      <div>
        <div class="font-mono text-xs text-rose-400">// BANC D'ESSAI INTERACTIF COUPLÉ AU MOTEUR 3D</div>
        <h2 class="font-syne text-2xl font-extrabold text-white">Simulateurs Temps Réel : Hardware Glitch, PQC &amp; Weibull</h2>
      </div>
      <div class="flex flex-wrap gap-2 font-mono text-xs">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="rounded-xl px-4 py-2 transition"
          :class="tab === t.id ? `${t.active} font-bold` : `bg-white/5 text-slate-300 ${t.hover}`"
          @click="go(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <LabGlitchDeck v-show="tab === 'glitch'" />
    <LabPqcDeck v-show="tab === 'pqc'" />
    <LabWeibullDeck v-show="tab === 'weibull'" />
  </section>
</template>
