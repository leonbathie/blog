<script setup>
import { computed, inject, ref } from 'vue'
import RichText from '../../../components/RichText.vue'

/** Simulateur 02 — réseau euclidien Kyber-1024 : dimension n et bruit gaussien σ. */
const deck = inject('deck')

const n = ref(1024)
const sigma = ref(3.2)
const secret = ref('8f94e2c01b7a44d9e301a7f8c21094b76e20c4f8a19d3e5b77c0912a4f6e8d10')

// Distribution d'erreur gaussienne
const curve = computed(() => {
  let d = 'M 30 155'
  for (let x = 0; x <= 540; x += 8) {
    const y = 155 - Math.exp(-Math.pow((x - 270) / (sigma.value * 36), 2)) * 125
    d += ` L ${30 + x} ${y.toFixed(1)}`
  }
  return d
})

function encapsulate() {
  deck.synth(1080, 0.1)
  deck.cameraSpin()
  secret.value = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  deck.toast('Échange de clés post-quantique Kyber-1024 simulé')
}
</script>

<template>
  <div class="spatial-panel grid grid-cols-1 gap-8 rounded-3xl border border-cyan-500/40 p-7 lg:grid-cols-12">
    <div class="space-y-5 font-mono text-xs lg:col-span-5">
      <div class="font-bold text-cyan-300">MODULE ML-KEM (KYBER-1024) // LATTICE 3D</div>
      <RichText
        tag="p"
        class="font-sans text-sm text-slate-300"
        text="Modifiez la dimension du réseau euclidien $n$ et l'écart-type du bruit gaussien $\sigma$ : le cristal 3D en arrière-plan et la distribution d'erreur s'ajustent en temps réel."
      />
      <div>
        <div class="mb-1 flex justify-between">
          <RichText tag="span" text="Dimension Polynomiale $n$ :" />
          <span class="font-bold text-cyan-300">{{ n }}</span>
        </div>
        <input v-model.number="n" type="range" min="512" max="2048" step="256" class="w-full accent-cyan-400" />
      </div>
      <div>
        <div class="mb-1 flex justify-between">
          <RichText tag="span" text="Dispersion d'Erreur $\sigma$ :" />
          <span class="font-bold text-violet-300">{{ sigma.toFixed(2) }}</span>
        </div>
        <input v-model.number="sigma" type="range" min="1.2" max="5.8" step="0.2" class="w-full accent-violet-400" />
      </div>
      <button type="button" class="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 py-3 font-bold text-slate-950 transition hover:brightness-110" @click="encapsulate">
        🔑 GÉNÉRER UN ÉCHANGE DE CLÉS
      </button>
    </div>
    <div class="space-y-4 lg:col-span-7">
      <div class="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4">
        <svg viewBox="0 0 600 180" class="h-44 w-full" role="img" aria-label="Distribution d'erreur gaussienne">
          <line x1="30" y1="155" x2="570" y2="155" stroke="#334155" />
          <path :d="curve" fill="rgba(0, 240, 255, 0.12)" stroke="#00f0ff" stroke-width="2.5" />
        </svg>
      </div>
      <div class="break-all rounded-2xl border border-white/10 bg-slate-950/90 p-4 font-mono text-xs text-emerald-300">
        SHARED_SECRET_SHA3_512: {{ secret }}
      </div>
    </div>
  </div>
</template>
