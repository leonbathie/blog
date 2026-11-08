<script setup>
import { computed, inject, ref } from 'vue'
import RichText from '../../../components/RichText.vue'
import { BNE_WINDOW, CALIBRATION, glitchOutcome } from '../../../core/lab-math.js'

/**
 * Module 1 du laboratoire, déplacé tel quel depuis LabView.vue.
 * Ses textes restent en français, quelle que soit la langue de l'interface.
 */
const leon = inject('leon')

/* ---------- 1. Banc d'injection de fautes ---------- */
const offset = ref(145)
const width = ref(25)
const volt = ref(1.65)
const outcome = computed(() => glitchOutcome({ offset: offset.value, width: width.value, volt: volt.value }))
const verdict = computed(() => {
  if (outcome.value.success) return { code: 'INSTRUCTION SAUTÉE — BOOTLOADER OUVERT', tone: 'text-leon-green' }
  if (outcome.value.brownout) return { code: 'BROWNOUT RESET — CIBLE REDÉMARRÉE', tone: 'text-leon-red' }
  return { code: 'SECURE BOOT VERROUILLÉ — AUCUNE FAUTE', tone: 'text-leon-dim' }
})
function calibrate() {
  offset.value = CALIBRATION.offset
  width.value = CALIBRATION.width
  volt.value = CALIBRATION.volt
  leon.toast('Paramètres calibrés sur la fenêtre BNE')
}
</script>

<template>
<section class="leon-panel leon-panel-pad scroll-mt-14">
  <h3 class="leon-panel-head leon-panel-head-wrap">
    1. Banc d'injection de fautes « Faulty Cat » (bootloader ARM Cortex-M)
  </h3>
  <RichText
    tag="p"
    class="text-[1.08rem] leading-tight text-leon-ink/85"
    :text="`Perturbez le rail d'alimentation pendant le décodage de \`BNE secure_lock\` sans déclencher de Brownout Reset. Fenêtre exploitable : $[${BNE_WINDOW.start}\\text{–}${BNE_WINDOW.end}\\text{ ns}]$.`"
  />

  <div class="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
    <div class="space-y-3 text-[1.05rem]">
      <div>
        <div class="flex justify-between text-leon-dim">
          <RichText tag="span" text="Délai glitch ($\Delta t$) :" />
          <span class="text-leon-green">{{ offset }} ns</span>
        </div>
        <input id="leon-offset" v-model.number="offset" type="range" min="50" max="300" step="5" aria-label="Délai du glitch" />
      </div>
      <div>
        <div class="flex justify-between text-leon-dim">
          <RichText tag="span" text="Largeur ($\delta$) :" />
          <span class="text-leon-green">{{ width }} ns</span>
        </div>
        <input id="leon-width" v-model.number="width" type="range" min="5" max="90" step="5" aria-label="Largeur du glitch" />
      </div>
      <div>
        <div class="flex justify-between text-leon-dim">
          <RichText tag="span" text="Chute tension ($\Delta V$) :" />
          <span class="text-leon-green">−{{ volt.toFixed(2) }} V</span>
        </div>
        <input id="leon-volt" v-model.number="volt" type="range" min="0.5" max="2.8" step="0.05" aria-label="Chute de tension" />
      </div>
      <button type="button" class="leon-btn leon-btn-gold w-full" @click="calibrate">
        Calibrer auto ({{ CALIBRATION.offset }} ns)
      </button>
    </div>

    <div class="space-y-2">
      <div class="leon-cmdbox text-[1.02rem] leading-tight">
        <div class="text-leon-dim">0x08000144: CMP R0, #0x00</div>
        <div class="bg-leon-gold/15 px-1 text-leon-gold">0x08000146: BNE 0x08000190 ← cible</div>
        <div class="text-leon-dim">0x08000148: BL unlock_debug_uart</div>
      </div>
      <div class="border p-2 text-center text-[1.02rem]" :class="verdict.tone" role="status">
        {{ verdict.code }}
      </div>
    </div>
  </div>
</section>
</template>
