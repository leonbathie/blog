<script setup>
import { computed, inject, ref } from 'vue'
import RichText from '../../../components/RichText.vue'

/** Module 3.3 — Banc d'injection de fautes Faulty Cat (saut d'instruction BNE). */
const mono = inject('mono')

const offset = ref(145)
const width = ref(25)
const volt = ref(1.65)

const inWindow = computed(() => offset.value >= 175 && offset.value <= 205 && width.value >= 15 && width.value <= 40)
const brownout = computed(() => volt.value > 2.35 || width.value > 60)
const success = computed(() => inWindow.value && volt.value >= 1.75 && !brownout.value)

const status = computed(() => {
  if (success.value) {
    return {
      badge: 'STATUS : INSTRUCTION SKIPPED (BOOTLOADER UNLOCKED)',
      badgeClass: 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-600 dark:text-emerald-400',
      label: '[SUCCÈS EMFI]',
      labelClass: 'text-emerald-600 dark:text-emerald-400',
      text: String.raw`Violation du temps de setup pendant le cycle ` + '`FETCH/DECODE`' + String.raw` à $t=${offset.value}\text{ ns}$. L'instruction ` + '`BNE 0x08000190`' + ' a été corrompue en `NOP`. Accès shell UART déverrouillé.',
    }
  }
  if (brownout.value) {
    return {
      badge: 'STATUS : MCU BROWNOUT RESET (CRASH)',
      badgeClass: 'border-rose-500 bg-rose-500/15 font-bold text-rose-500',
      label: '[CRASH SILICIUM]',
      labelClass: 'text-rose-500',
      text: String.raw`Impulsion trop profonde ($-\Delta V = ${volt.value.toFixed(2)}\text{ V}$) ou trop large ($${width.value}\text{ ns}$). Le détecteur de sous-tension (BOD) a réinitialisé le microcontrôleur.`,
    }
  }
  return {
    badge: 'STATUS : SECURE BOOT LOCKED (NO FAULT)',
    badgeClass: 'border-zinc-500/30 bg-zinc-500/10 text-mono-muted',
    label: '[MANQUÉ]',
    labelClass: 'text-amber-500',
    text: String.raw`Le glitch à $t=${offset.value}\text{ ns}$ est hors de la fenêtre critique de décodage $[175\text{–}205\text{ ns}]$ ou d'amplitude insuffisante. La signature RSA bloque l'exécution.`,
  }
})

function calibrate() {
  offset.value = 190
  width.value = 25
  volt.value = 1.95
  mono.showToast("Paramètres Faulty Cat calibrés sur la fenêtre d'instruction BNE")
}

// Oscilloscope : rail VCC 3.3 V et fenêtre de décodage
const W = 600
const H = 165
const PAD = 40
const MAX_NS = 340
const span = W - PAD - 20
const Y_NOMINAL = 40

const scope = computed(() => {
  const xStart = PAD + (offset.value / MAX_NS) * span
  const xEnd = PAD + ((offset.value + width.value) / MAX_NS) * span
  const yDrop = Y_NOMINAL + (volt.value / 3.3) * 110
  return {
    path: `M ${PAD} ${Y_NOMINAL} L ${xStart} ${Y_NOMINAL} L ${xStart + 4} ${yDrop} L ${xEnd - 4} ${yDrop} L ${xEnd} ${Y_NOMINAL} L ${W - 15} ${Y_NOMINAL}`,
    color: success.value ? '#10B981' : brownout.value ? '#F43F5E' : '#38BDF8',
    winStart: PAD + (175 / MAX_NS) * span,
    winWidth: (35 / MAX_NS) * span,
  }
})
</script>

<template>
  <div class="space-y-6 rounded-lg border border-mono-line bg-mono-panel/80 p-5 sm:p-8">
    <div class="flex flex-col justify-between gap-4 border-b border-mono-line pb-6 md:flex-row md:items-center">
      <div class="min-w-0">
        <span class="font-mono text-xs uppercase text-mono-accent">// MODULE 3.3 : HARDWARE FAULT INJECTION BENCH</span>
        <h2 class="mt-1 font-serif text-2xl text-mono-ink sm:text-3xl">Banc d'Injection de Fautes <em>Faulty Cat</em> (Instruction Skip Simulator)</h2>
        <RichText
          tag="p"
          class="mt-1 text-sm text-mono-muted"
          text="Calibrez le délai d'impulsion ($\Delta t$) et la largeur du glitch ($\delta$) pour perturber le rail d'alimentation $\text{V}_{\text{CC}}$ pile pendant le cycle de décodage de l'instruction critique `BNE secure_lock` d'un microcontrôleur cible."
        />
      </div>
      <div class="shrink-0 rounded border px-3 py-2 font-mono text-xs" :class="status.badgeClass" role="status">{{ status.badge }}</div>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="space-y-5 font-mono text-xs">
        <div>
          <div class="mb-1.5 flex justify-between gap-2">
            <RichText tag="label" for="mono-offset" class="text-mono-muted" text="Délai d'impulsion ($\Delta t$ après Trigger) :" />
            <span class="shrink-0 font-bold text-mono-ink">{{ offset }} ns</span>
          </div>
          <input id="mono-offset" v-model.number="offset" type="range" min="50" max="300" step="5" class="w-full cursor-pointer accent-mono-accent" />
        </div>
        <div>
          <div class="mb-1.5 flex justify-between gap-2">
            <RichText tag="label" for="mono-width" class="text-mono-muted" text="Largeur d'impulsion ($\delta$) :" />
            <span class="shrink-0 font-bold text-mono-ink">{{ width }} ns</span>
          </div>
          <input id="mono-width" v-model.number="width" type="range" min="5" max="90" step="5" class="w-full cursor-pointer accent-mono-accent" />
        </div>
        <div>
          <div class="mb-1.5 flex justify-between gap-2">
            <RichText tag="label" for="mono-volt" class="text-mono-muted" text="Chute de Tension ($\Delta V_{\text{glitch}}$) :" />
            <span class="shrink-0 font-bold text-mono-ink">-{{ volt.toFixed(2) }} V</span>
          </div>
          <input id="mono-volt" v-model.number="volt" type="range" min="0.5" max="2.8" step="0.05" class="w-full cursor-pointer accent-mono-accent" />
        </div>

        <div class="space-y-1 overflow-x-auto rounded border border-zinc-800 bg-zinc-900 p-3 text-[11px] text-zinc-200">
          <div class="text-zinc-500">// Pipeline ASM Cible (ARM Cortex-M)</div>
          <div class="whitespace-nowrap">0x08000140: <span class="text-sky-400">BL</span> verify_rsa_sig</div>
          <div class="whitespace-nowrap">0x08000144: <span class="text-sky-400">CMP</span> R0, #0x00</div>
          <div class="whitespace-nowrap rounded bg-orange-400/20 px-1 font-bold text-orange-300">0x08000146: BNE 0x08000190 &lt;-- CIBLE (175-205ns)</div>
          <div class="whitespace-nowrap">0x08000148: <span class="text-emerald-400">BL</span> unlock_debug_uart</div>
        </div>

        <button type="button" class="w-full rounded border border-mono-accent px-3 py-2 text-mono-accent transition hover:bg-mono-accent/10" @click="calibrate">
          Calibrer automatiquement sur la fenêtre [190ns, 25ns, -1.95V]
        </button>
      </div>

      <div class="flex min-w-0 flex-col justify-between space-y-4 lg:col-span-2">
        <div class="rounded border border-zinc-800 bg-zinc-950 p-4">
          <div class="mb-2 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-zinc-400">
            <span>OSCILLOSCOPE : TRACE VCC (3.3V) &amp; FENÊTRE D'INSTRUCTION</span>
            <span class="text-sky-400">TRIGGER: HIGH</span>
          </div>
          <svg viewBox="0 0 600 185" class="h-44 w-full overflow-visible" role="img" aria-label="Oscilloscope du rail d'alimentation">
            <rect :x="scope.winStart" y="15" :width="scope.winWidth" :height="H - 25" fill="rgba(217, 93, 57, 0.16)" stroke="#D95D39" stroke-dasharray="3,3" />
            <text :x="scope.winStart - 10" y="12" class="fill-orange-300 font-mono text-[9px]">FENÊTRE BNE (175-210ns)</text>
            <line :x1="PAD" :y1="Y_NOMINAL" :x2="W - 15" :y2="Y_NOMINAL" stroke="#27272a" stroke-dasharray="2,2" />
            <line :x1="PAD" y1="125" :x2="W - 15" y2="125" stroke="#7f1d1d" stroke-dasharray="4,4" />
            <text x="4" :y="Y_NOMINAL + 3" class="fill-zinc-400 font-mono text-[10px]">3.3V</text>
            <text x="4" y="128" class="fill-rose-500 font-mono text-[9px]">BOD</text>
            <path :d="scope.path" fill="none" :stroke="scope.color" stroke-width="2.5" />
            <line :x1="PAD" :y1="H - 10" :x2="W - 15" :y2="H - 10" stroke="#3f3f46" />
            <text :x="PAD" :y="H + 5" class="fill-zinc-500 font-mono text-[10px]">0 ns (Trigger)</text>
            <text :x="W - 65" :y="H + 5" class="fill-zinc-500 font-mono text-[10px]">340 ns</text>
          </svg>
        </div>

        <div class="rounded border border-mono-line bg-mono-surface p-4 font-mono text-xs leading-relaxed text-mono-ink/85" aria-live="polite">
          <span class="font-bold" :class="status.labelClass">{{ status.label }}</span>
          {{ ' ' }}
          <RichText :text="status.text" />
        </div>
      </div>
    </div>
  </div>
</template>
