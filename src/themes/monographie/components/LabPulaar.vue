<script setup>
import { computed, inject, onMounted, ref, watch } from 'vue'
import RichText from '../../../components/RichText.vue'
import { tone } from '../../../core/audio.js'

/** Module 3.2 — Tokenisation Pulaar/Wolof (BPE standard vs tokenizer morphologique) et spectrogramme. */
const mono = inject('mono')

const SAMPLES = [
  { label: 'Exemple Pulaar 1', text: 'Ko ɓuri teeŋtude e ɗemngal Pulaar ko ɓamtaare jaŋde.' },
  { label: 'Proverbe Pulaar', text: 'Ɓundu wooturu, ɓoggol gootol : ko dental woni doole.' },
  { label: 'Exemple Wolof', text: 'Kuulal ak jàmm ci réewum Senegaal, nu jàng ci sunu làkk.' },
]
const GLOTTALS = ['ɓ', 'ɗ', 'ƴ', 'ŋ', 'ñ']

const text = ref(SAMPLES[0].text)
const input = ref(null)
const canvas = ref(null)

const words = computed(() => text.value.trim().split(/\s+/).filter(Boolean))

// Whisper BPE « standard » : fragmente les mots contenant des implosives ou trop longs
const stdTokens = computed(() => {
  const tokens = []
  for (const word of words.value) {
    if (/[ɓɗƴŋñƁƊƳŊÑàé]/.test(word) || word.length > 5) {
      for (let i = 0; i < word.length; i += 2) tokens.push(word.slice(i, i + 2))
    } else {
      tokens.push(word)
    }
  }
  return tokens
})

// Tokenizer morphologique Pulaar-v3 : conserve les radicaux et les bigrammes implosifs
const customTokens = computed(() => {
  const tokens = []
  for (const word of words.value) {
    if (word.length > 7) {
      const cut = Math.ceil(word.length * 0.6)
      tokens.push(word.slice(0, cut), `##${word.slice(cut)}`)
    } else {
      tokens.push(word)
    }
  }
  return tokens
})

const compression = computed(() => {
  const std = stdTokens.value.length
  return std ? Math.max(0, Math.round(((std - customTokens.value.length) / std) * 100)) : 0
})

function insertGlottal(char) {
  text.value += char
  input.value?.focus()
}

function drawSpectrogram() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  const { width: w, height: h } = el
  ctx.fillStyle = '#09090b'
  ctx.fillRect(0, 0, w, h)

  const seed = text.value
  const n = Math.max(1, seed.length)
  const cols = 72
  const rows = 32
  const cw = w / cols
  const ch = h / rows
  for (let x = 0; x < cols; x++) {
    const code = seed.charCodeAt(x % n) || 65
    const implosive = /[ɓɗƴŋƁƊƳŊ]/.test(seed[x % n] || '')
    for (let y = 0; y < rows; y++) {
      const f = Math.sin(x * 0.25 + y * 0.3 + code * 0.1)
      let energy = (f + 1) * 0.45 * (1 - (y / rows) * 0.55)
      if (implosive && y > 8 && y < 24) energy = Math.min(1, energy + 0.45)
      ctx.fillStyle = `rgb(${Math.floor(energy * 235)}, ${Math.floor(Math.pow(energy, 1.6) * 115)}, ${Math.floor((1 - energy) * 65)})`
      ctx.fillRect(x * cw, (rows - 1 - y) * ch, cw - 0.5, ch - 0.5)
    }
  }
}

function playPreview() {
  const value = text.value || 'Pulaar'
  for (let i = 0; i < Math.min(value.length, 14); i++) {
    const code = value.charCodeAt(i)
    const implosive = /[ɓɗƴŋ]/.test(value[i])
    tone({
      freq: 190 + (code % 18) * 22 + (implosive ? 160 : 0),
      type: implosive ? 'triangle' : 'sine',
      duration: 0.06,
      gain: 0.12,
      attack: 0.015,
      at: i * 0.065,
    })
  }
  mono.showToast('Synthèse spectrale formantique générée')
}

watch(text, drawSpectrogram)
onMounted(drawSpectrogram)
</script>

<template>
  <div class="space-y-6 rounded-lg border border-mono-line bg-mono-panel/80 p-5 sm:p-8">
    <div class="flex flex-col justify-between gap-4 border-b border-mono-line pb-6 md:flex-row md:items-center">
      <div class="min-w-0">
        <span class="font-mono text-xs uppercase text-mono-accent">// MODULE 3.2 : LOW-RESOURCE SPEECH &amp; BPE TOKENIZATION</span>
        <h2 class="mt-1 font-serif text-2xl text-mono-ink sm:text-3xl">Inspecteur de Tokenisation Pulaar/Wolof &amp; Spectrogramme Log-Mel</h2>
        <RichText
          tag="p"
          class="mt-1 text-sm text-mono-muted"
          text="Comparaison entre le tokenizer BPE standard de Whisper (qui fragmente les consonnes implosives $\text{ɓ, ɗ, ƴ, ŋ}$) et notre tokenizer morphologique adapté pour **Taro Learning / AudioSheet IA**."
        />
      </div>
      <div class="flex shrink-0 flex-wrap gap-2 font-mono text-xs">
        <button
          v-for="sample in SAMPLES"
          :key="sample.label"
          type="button"
          class="rounded border border-mono-line px-2.5 py-1.5 hover:border-mono-accent"
          @click="text = sample.text"
        >
          {{ sample.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div class="min-w-0 space-y-4 lg:col-span-7">
        <label for="mono-pulaar" class="block font-mono text-xs text-mono-muted">TEXTE D'ENTRÉE (AVEC CARACTÈRES SPÉCIAUX : Ɓ, Ɗ, Ƴ, Ŋ, Ñ) :</label>
        <input
          id="mono-pulaar"
          ref="input"
          v-model="text"
          type="text"
          class="w-full rounded border border-mono-line bg-mono-surface px-3 py-2 font-serif text-base text-mono-ink focus:border-mono-accent focus:outline-none"
        />
        <div class="flex flex-wrap gap-1.5 font-mono text-xs">
          <span class="mr-1 py-1 text-mono-muted">Insérer implosive :</span>
          <button
            v-for="char in GLOTTALS"
            :key="char"
            type="button"
            class="rounded border border-mono-line bg-mono-surface px-2.5 py-1 font-bold hover:border-mono-accent"
            @click="insertGlottal(char)"
          >
            {{ char }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div class="rounded border border-mono-line bg-mono-surface p-4">
            <div class="mb-2 flex justify-between gap-2 font-mono text-[11px] text-mono-muted">
              <span>WHISPER BPE STANDARD</span>
              <span class="font-bold text-rose-500">{{ stdTokens.length }} tokens</span>
            </div>
            <div class="flex flex-wrap gap-1 font-mono text-xs">
              <span v-for="(token, i) in stdTokens" :key="`s${i}`" class="rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-rose-500">{{ token }}</span>
            </div>
          </div>
          <div class="rounded border border-emerald-500/30 bg-mono-surface p-4">
            <div class="mb-2 flex justify-between gap-2 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              <span>TOKENIZER PULAAR-V3 (TARO)</span>
              <span class="font-bold">{{ customTokens.length }} tokens</span>
            </div>
            <div class="flex flex-wrap gap-1 font-mono text-xs">
              <span v-for="(token, i) in customTokens" :key="`c${i}`" class="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400">{{ token }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex min-w-0 flex-col justify-between rounded border border-mono-line bg-mono-surface p-4 lg:col-span-5">
        <div>
          <div class="mb-2 flex items-center justify-between gap-2 font-mono text-[11px] text-mono-muted">
            <span>SPECTROGRAMME LOG-MEL (128 BINS)</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">Compression BPE : -{{ compression }}% tokens</span>
          </div>
          <canvas ref="canvas" width="360" height="150" class="h-36 w-full rounded border border-zinc-800 bg-zinc-950" aria-label="Spectrogramme simulé du texte saisi" />
          <RichText
            tag="p"
            class="mt-2 font-mono text-[11px] text-mono-muted"
            text="Les consonnes implosives ($\text{ɓ, ɗ, ƴ}$) génèrent des transitoires glottales rapides visibles dans les bandes $2.5\text{–}4.5\text{ kHz}$."
          />
        </div>
        <button
          type="button"
          class="mt-4 flex w-full items-center justify-center gap-2 rounded bg-mono-accent px-3 py-2 font-mono text-xs font-medium text-white transition hover:opacity-90 dark:text-zinc-950"
          @click="playPreview"
        >
          <span>▶</span><span>SYNTHÉTISER L'EMPREINTE ACOUSTIQUE (WEB AUDIO)</span>
        </button>
      </div>
    </div>
  </div>
</template>
