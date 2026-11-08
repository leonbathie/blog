<script setup>
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import { infrastructure, profile, repos } from '../../../content/index.js'

/**
 * Lab 3.3 — Scanner de télémétrie orbitale.
 * La maquette se contentait d'un bouton qui affichait une notification ; le scan
 * produit ici un relevé, construit à partir des nœuds et dépôts réels.
 */
const mission = inject('mission')

const scanning = ref(false)
const sweep = ref(0)
const reading = ref(null)
let timer = 0

/** Dimensions du tenseur, dérivées du contenu réel plutôt qu'écrites en dur */
const tensor = computed(() => [1024, repos.length * 48, 64, infrastructure.length + 1])

function scan() {
  if (scanning.value) return
  scanning.value = true
  mission.beep(1500, 0.12)
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    sweep.value += 1
    reading.value = {
      noeuds: infrastructure.length,
      modules: repos.length,
      latence: (11 + Math.random() * 3).toFixed(1),
      derive: (Math.random() * 0.4).toFixed(2),
    }
    scanning.value = false
    mission.beep(1800, 0.1)
    mission.showToast(`Balayage ${String(sweep.value).padStart(2, '0')} terminé`)
  }, 1100)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <section class="ms-card space-y-6 p-6 sm:p-8">
    <h3 class="font-orbitron text-xl font-bold text-white sm:text-2xl">Télémétrie orbitale 4D</h3>

    <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
      <div class="space-y-5 lg:col-span-7">
        <p class="font-grotesk text-sm leading-relaxed text-slate-300">
          Cartographie vectorielle des embeddings vocaux et des flux transcontinentaux
          ({{ profile.city }} — cloud global).
        </p>

        <div class="space-y-2 border border-orange-500/30 bg-black p-5 font-techmono text-xs">
          <div class="font-bold text-orange-400">&gt; TENSOR_STATE: [{{ tensor.join(', ') }}]</div>
          <div class="text-slate-400">&gt; Statut radar : {{ scanning ? 'balayage en cours…' : 'veille active' }}</div>
          <template v-if="reading">
            <div class="text-amber-300">&gt; Nœuds acquis : {{ reading.noeuds }} · modules suivis : {{ reading.modules }}</div>
            <div class="text-amber-300">&gt; Latence moyenne : {{ reading.latence }} ms · dérive : {{ reading.derive }} °</div>
            <div class="text-emerald-400">&gt; Balayage {{ String(sweep).padStart(2, '0') }} : verrouillage nominal.</div>
          </template>
          <div v-else class="text-slate-500">&gt; Aucun relevé — lancez un balayage.</div>
        </div>

        <button type="button" class="ms-btn ms-btn-on w-full py-3" :disabled="scanning" @click="scan">
          {{ scanning ? '⟳ Balayage en cours…' : '✨ Activer le scanner orbital' }}
        </button>
      </div>

      <!-- Anneaux -->
      <div class="flex justify-center lg:col-span-5">
        <div
          class="relative flex h-52 w-52 items-center justify-center border-2"
          :class="scanning ? 'border-amber-400/70' : 'border-orange-500/40'"
        >
          <div
            class="absolute h-40 w-40 border border-amber-500/40"
            :style="{ animation: `ms-spin ${scanning ? 2.5 : 10}s linear infinite` }"
          />
          <div
            class="absolute h-28 w-28 border border-sky-400/40"
            :style="{ animation: `ms-spin ${scanning ? 1.5 : 6}s linear infinite reverse` }"
          />
          <span class="font-orbitron text-sm font-bold tracking-widest text-orange-300">ORBIT_V9</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
@keyframes ms-spin {
  to { transform: rotate(360deg); }
}
</style>
