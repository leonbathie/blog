<script setup>
import { computed, inject, ref } from 'vue'
import { tone } from '../../../core/audio.js'
import {
  compressionRate,
  IMPLOSIVE_RE,
  IMPLOSIVES,
  morphTokens,
  PULAAR_SAMPLES,
  splitWords,
  standardTokens,
} from '../../../core/lab-math.js'
import { t } from '../i18n.js'

/** Module 2 : combien de tokens un même texte coûte-t-il à chaque tokenizer ? */
const leon = inject('leon')

const text = ref(PULAAR_SAMPLES[0].text)
const input = ref(null)
const words = computed(() => splitWords(text.value))
const std = computed(() => standardTokens(words.value))
const morph = computed(() => morphTokens(words.value))
const gain = computed(() => compressionRate(std.value, morph.value))

/** Barres de console : 24 cases, pleines au prorata du plus grand des deux comptes */
const CELLS = 24
const bar = (n) => {
  const max = Math.max(std.value.length, morph.value.length, 1)
  const full = Math.round((n / max) * CELLS)
  return '█'.repeat(full) + '░'.repeat(CELLS - full)
}

function insert(char) {
  text.value += char
  input.value?.focus()
}
function synth() {
  const value = text.value || 'Pulaar'
  for (let i = 0; i < Math.min(value.length, 14); i++) {
    const code = value.charCodeAt(i)
    const implosive = IMPLOSIVE_RE.test(value[i])
    tone({
      freq: 190 + (code % 18) * 22 + (implosive ? 160 : 0),
      type: implosive ? 'square' : 'triangle',
      duration: 0.06,
      gain: 0.1,
      attack: 0.012,
      at: i * 0.065,
    })
  }
  leon.toast(t('lab.tokens.synthDone'))
}
</script>

<template>
  <section class="leon-panel leon-panel-pad">
    <h3 class="leon-panel-head leon-panel-head-wrap">{{ t('lab.tokens.title') }}</h3>

    <div class="mb-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[1.02rem]">
      <span class="text-leon-dim">{{ t('lab.tokens.samples') }}</span>
      <button
        v-for="(s, i) in PULAAR_SAMPLES"
        :key="s.label"
        type="button"
        class="leon-btn"
        :class="text === s.text ? 'leon-btn-on' : ''"
        @click="text = s.text"
      >
        {{ t('lab.tokens.sampleNames')[i] ?? s.label }}
      </button>
    </div>

    <label for="leon-pulaar" class="mb-1 block text-[1.02rem] text-leon-dim">{{ t('lab.tokens.measured') }}</label>
    <input id="leon-pulaar" ref="input" v-model="text" type="text" class="leon-field" lang="ff" spellcheck="false" />

    <div class="mt-2 flex flex-wrap items-center gap-1.5 text-[1.05rem]">
      <span class="text-leon-dim">{{ t('lab.tokens.insert') }}</span>
      <button
        v-for="char in IMPLOSIVES"
        :key="char"
        type="button"
        class="leon-btn leon-btn-char"
        :aria-label="t('lab.tokens.insertChar', { c: char })"
        @click="insert(char)"
      >
        {{ char }}
      </button>
      <button type="button" class="leon-btn ml-auto" @click="synth">{{ t('lab.tokens.synth') }}</button>
    </div>

    <!-- Comparaison en barres de console -->
    <div class="leon-cmdbox mt-3 text-[1.02rem] leading-tight" aria-hidden="true">
      <div class="flex flex-wrap gap-x-3">
        <span class="w-40 shrink-0 text-leon-red">{{ t('lab.tokens.standard') }}</span>
        <span class="leon-bar text-leon-red">{{ bar(std.length) }}</span>
        <span class="text-leon-red">{{ std.length }}</span>
      </div>
      <div class="flex flex-wrap gap-x-3">
        <span class="w-40 shrink-0 text-leon-green">{{ t('lab.tokens.morph') }}</span>
        <span class="leon-bar text-leon-green">{{ bar(morph.length) }}</span>
        <span class="text-leon-green">{{ morph.length }}</span>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div class="border border-leon-red/50 p-2.5">
        <div class="mb-1.5 flex justify-between text-[0.98rem]">
          <span class="text-leon-dim">{{ t('lab.tokens.standard') }}</span>
          <span class="font-bold text-leon-red">{{ t('lab.tokens.count', { n: std.length }) }}</span>
        </div>
        <div class="flex flex-wrap gap-1 text-[1rem]" lang="ff">
          <span v-for="(tk, i) in std" :key="`s${i}`" class="leon-chip border border-leon-red/50 px-1 text-leon-red" :style="{ animationDelay: `${i * 18}ms` }">{{ tk }}</span>
        </div>
      </div>
      <div class="border border-leon-green/40 p-2.5">
        <div class="mb-1.5 flex justify-between text-[0.98rem]">
          <span class="text-leon-dim">{{ t('lab.tokens.morph') }}</span>
          <span class="font-bold text-leon-green">{{ t('lab.tokens.count', { n: morph.length }) }}</span>
        </div>
        <div class="flex flex-wrap gap-1 text-[1rem]" lang="ff">
          <span v-for="(tk, i) in morph" :key="`m${i}`" class="leon-chip border border-leon-green/40 px-1 text-leon-green" :style="{ animationDelay: `${i * 18}ms` }">{{ tk }}</span>
        </div>
      </div>
    </div>
    <p class="mt-2 text-[1rem] text-leon-gold">{{ t('lab.tokens.gain', { n: gain }) }}</p>
  </section>
</template>
