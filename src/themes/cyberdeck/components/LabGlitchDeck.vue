<script setup>
import { computed, inject, ref } from 'vue'
import RichText from '../../../components/RichText.vue'

/** Simulateur 01 — calibrage d'une impulsion pour fauter un saut conditionnel BNE (Faulty Cat). */
const deck = inject('deck')

const delay = ref(142)
const drop = ref(18) // dixièmes de volt
const width = ref(24)
const badge = ref({ text: 'LOCKED', class: 'text-amber-400' })
const log = ref([
  { tone: 'cyan', text: '[FAULTY_CAT_V3] Sonde MOSFET armée sur rail VDD_CORE...' },
  { tone: 'slate', text: 'Fenêtre optimale estimée : Δt ∈ [154ns, 168ns], V_drop ∈ [-2.0V, -2.3V], W ∈ [18ns, 28ns].' },
])

const dropV = computed(() => drop.value / 10)
const vMin = computed(() => (3.3 - dropV.value).toFixed(2))

// Tracé de l'oscilloscope
const scope = computed(() => {
  const startX = 40 + (delay.value - 80) * 3.2
  const endX = startX + width.value * 2.4
  const dropY = 35 + dropV.value * 45
  return `M 20 35 L ${startX} 35 L ${startX + 6} ${dropY} L ${endX - 6} ${dropY} L ${endX} 35 L 580 35`
})

function push(text, tone) {
  log.value.push({ text, tone })
  if (log.value.length > 40) log.value.shift()
}

function pulse() {
  deck.cameraSpin()
  if (dropV.value > 2.4) {
    deck.synth(220, 0.18)
    badge.value = { text: 'BROWNOUT_RESET', class: 'text-rose-400 font-bold' }
    push(`[RESET] Chute -${dropV.value.toFixed(2)}V trop profonde : réinitialisation de sous-tension.`, 'rose')
  } else if (delay.value >= 154 && delay.value <= 168 && dropV.value >= 2.0 && dropV.value <= 2.3 && width.value >= 18 && width.value <= 28) {
    deck.synth(1240, 0.18)
    badge.value = { text: 'TARGET_WINDOW_HIT', class: 'text-emerald-400 font-bold' }
    push(`[SUCCÈS] Impulsion alignée sur la fenêtre de décodage à Δt=${delay.value}ns.`, 'emerald')
    deck.toast('Faulty Cat : fenêtre d\'instruction atteinte !')
  } else {
    deck.synth(440, 0.08)
    badge.value = { text: 'NORMAL_EXEC', class: 'text-amber-400' }
    push('[MISS] Impulsion hors fenêtre. Ajustez Δt vers 160ns et V_drop vers -2.1V.', 'slate')
  }
}

function autoSolve() {
  delay.value = 160
  drop.value = 21
  width.value = 22
  pulse()
}

const TONES = { cyan: 'text-cyan-400', slate: 'text-slate-400', emerald: 'text-emerald-400', rose: 'text-rose-400' }
</script>

<template>
  <div class="spatial-panel grid grid-cols-1 gap-8 rounded-3xl border border-rose-500/40 p-7 lg:grid-cols-12">
    <div class="space-y-5 font-mono text-xs lg:col-span-5">
      <div class="flex items-center justify-between">
        <span class="rounded border border-rose-500/40 bg-rose-500/20 px-2.5 py-1 font-bold text-rose-300">TARGET: ARM CORTEX-M4 BOOTLOADER</span>
        <span :class="badge.class">{{ badge.text }}</span>
      </div>
      <RichText
        tag="p"
        class="font-sans text-sm text-slate-300"
        text="Calibrez le délai d'impulsion ($\Delta t$) et la chute de tension ($\Delta V$) de **Faulty Cat** pour cibler la fenêtre de décodage de l'instruction `BNE` sans franchir le seuil de réinitialisation de sous-tension."
      />
      <div class="space-y-4 pt-2">
        <div>
          <div class="mb-1 flex justify-between">
            <RichText tag="span" class="text-slate-400" text="Délai post-trigger ($\Delta t$) :" />
            <span class="font-bold text-rose-300">{{ delay }} ns</span>
          </div>
          <input v-model.number="delay" type="range" min="80" max="220" class="w-full cursor-pointer accent-rose-500" />
        </div>
        <div>
          <div class="mb-1 flex justify-between">
            <RichText tag="span" class="text-slate-400" text="Chute de tension ($V_{\text{drop}}$) :" />
            <span class="font-bold text-cyan-300">-{{ dropV.toFixed(2) }} V</span>
          </div>
          <input v-model.number="drop" type="range" min="10" max="28" class="w-full cursor-pointer accent-cyan-400" />
        </div>
        <div>
          <div class="mb-1 flex justify-between">
            <RichText tag="span" class="text-slate-400" text="Largeur d'impulsion ($W_{\text{pulse}}$) :" />
            <span class="font-bold text-violet-300">{{ width }} ns</span>
          </div>
          <input v-model.number="width" type="range" min="8" max="60" class="w-full cursor-pointer accent-violet-400" />
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="button" class="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-3 font-bold text-slate-950 shadow-lg shadow-rose-500/25 transition hover:brightness-110" @click="pulse">
          ⚡ INJECTER L'IMPULSION
        </button>
        <button type="button" class="rounded-xl bg-white/10 px-4 py-3 font-bold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950" @click="autoSolve">
          AUTO-SOLVE
        </button>
      </div>
    </div>

    <div class="space-y-4 lg:col-span-7">
      <div class="rounded-2xl border border-rose-500/30 bg-slate-950/90 p-4">
        <div class="mb-2 flex justify-between font-mono text-[11px] text-slate-400">
          <span>OSCILLOSCOPE : RAIL VDD_CORE (3.30V NOMINAL)</span>
          <span class="text-rose-400">V_MIN: {{ vMin }}V</span>
        </div>
        <svg viewBox="0 0 600 180" class="h-44 w-full overflow-visible" role="img" aria-label="Oscilloscope du rail VDD">
          <rect x="275" y="15" width="75" height="150" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.35)" stroke-dasharray="4,4" />
          <text x="282" y="28" fill="#10b981" font-size="9" font-family="monospace">FENÊTRE DE DÉCODAGE</text>
          <line x1="20" y1="145" x2="580" y2="145" stroke="#f43f5e" stroke-dasharray="3,3" />
          <text x="25" y="158" fill="#f43f5e" font-size="9" font-family="monospace">SEUIL DE SOUS-TENSION (0.85V)</text>
          <path :d="scope" fill="none" stroke="#00f0ff" stroke-width="3" />
        </svg>
      </div>
      <div class="h-36 space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/90 p-4 font-mono text-xs" aria-live="polite">
        <div v-for="(line, i) in log" :key="i" :class="TONES[line.tone]">&gt; {{ line.text }}</div>
      </div>
    </div>
  </div>
</template>
