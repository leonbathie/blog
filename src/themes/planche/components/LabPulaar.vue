<script setup>
import { computed, inject, onMounted, ref, watch } from 'vue'
import RichText from '../../../components/RichText.vue'
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

/**
 * Planche 3.2 — Relevé comparé de segmentation.
 * Les deux tokenizers sont mis en regard comme deux relevés d'un même mesurage,
 * et l'empreinte spectrale est tirée à l'encre (trame de densité) et non en fausses couleurs.
 */
const planche = inject('planche')

const text = ref(PULAAR_SAMPLES[0].text)
const input = ref(null)
const canvas = ref(null)

const words = computed(() => splitWords(text.value))
const std = computed(() => standardTokens(words.value))
const morph = computed(() => morphTokens(words.value))
const gain = computed(() => compressionRate(std.value, morph.value))

function insert(char) {
  text.value += char
  input.value?.focus()
}

/** Trame de densité : l'énergie devient une quantité d'encre, comme sur un tirage. */
function drawSpectrogram() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  const { width: w, height: h } = el

  // Les variables du thème valent « r g b » : on les repasse en rgba() pour le canvas,
  // dont le support de la syntaxe CSS Color 4 n'est pas garanti partout.
  const cs = getComputedStyle(document.documentElement)
  const channels = (name, fallback) => {
    const parts = (cs.getPropertyValue(name).trim() || fallback).split(/[\s,]+/).map(Number)
    return parts.length === 3 && parts.every((v) => Number.isFinite(v)) ? parts : fallback.split(' ').map(Number)
  }
  const paper = channels('--pl-paper', '244 241 232')
  const ink = channels('--pl-ink', '22 23 26')
  const blue = channels('--pl-blue', '29 63 115')
  const rgba = ([r, g, b], a) => `rgba(${r}, ${g}, ${b}, ${a})`

  ctx.fillStyle = rgba(paper, 1)
  ctx.fillRect(0, 0, w, h)

  const seed = text.value
  const n = Math.max(1, seed.length)
  const cols = 72
  const rows = 28
  const cw = w / cols
  const ch = h / rows

  for (let x = 0; x < cols; x++) {
    const char = seed[x % n] || ''
    const code = seed.charCodeAt(x % n) || 65
    const implosive = IMPLOSIVE_RE.test(char)
    for (let y = 0; y < rows; y++) {
      const f = Math.sin(x * 0.25 + y * 0.3 + code * 0.1)
      let energy = (f + 1) * 0.45 * (1 - (y / rows) * 0.55)
      if (implosive && y > 7 && y < 21) energy = Math.min(1, energy + 0.45)
      // Les bandes glottales sont relevées au bleu de construction, le reste à l'encre
      ctx.fillStyle = implosive && y > 7 && y < 21 ? rgba(blue, energy.toFixed(3)) : rgba(ink, (energy * 0.85).toFixed(3))
      ctx.fillRect(x * cw, (rows - 1 - y) * ch, Math.max(cw - 0.6, 0.5), Math.max(ch - 0.6, 0.5))
    }
  }
}

function playPreview() {
  const value = text.value || 'Pulaar'
  for (let i = 0; i < Math.min(value.length, 14); i++) {
    const code = value.charCodeAt(i)
    const implosive = IMPLOSIVE_RE.test(value[i])
    tone({
      freq: 190 + (code % 18) * 22 + (implosive ? 160 : 0),
      type: implosive ? 'triangle' : 'sine',
      duration: 0.06,
      gain: 0.12,
      attack: 0.015,
      at: i * 0.065,
    })
  }
  planche.showToast('Empreinte acoustique synthétisée')
}

watch(text, drawSpectrogram)
watch(() => planche.dark.value, () => drawSpectrogram())
onMounted(drawSpectrogram)
</script>

<template>
  <section class="border-2 border-pl-rule bg-pl-paper/80">
    <header class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-pl-rule px-4 py-3 sm:px-6">
      <div class="min-w-0">
        <span class="pl-meta">PL-3.2 — Langues atlantiques &amp; mandé</span>
        <h2 class="mt-0.5 font-archivo text-lg font-bold uppercase tracking-tight text-pl-ink sm:text-xl">
          Relevé comparé de segmentation
        </h2>
      </div>
      <span class="pl-meta shrink-0">Écart relevé : <span class="text-pl-blue">−{{ gain }} % de tokens</span></span>
    </header>

    <div class="grid grid-cols-1 gap-0 lg:grid-cols-12">
      <!-- Saisie et relevés -->
      <div class="min-w-0 space-y-4 border-pl-rule/35 p-4 sm:p-6 lg:col-span-7 lg:border-r">
        <p class="font-plex text-[0.82rem] leading-relaxed text-pl-muted">
          <RichText
            text="Mise en regard du BPE standard de Whisper, qui fragmente les implosives $\text{ɓ, ɗ, ƴ, ŋ}$, et du tokenizer morphologique **Pulaar-v3** utilisé par *Taro Learning* et *AudioSheet IA*."
          />
        </p>

        <div>
          <label for="pl-pulaar" class="pl-meta mb-1 block">Texte mesuré</label>
          <input id="pl-pulaar" ref="input" v-model="text" type="text" class="pl-field" />
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span class="pl-meta mr-1">Insérer</span>
          <button
            v-for="char in IMPLOSIVES"
            :key="char"
            type="button"
            class="pl-btn pl-key px-2.5 font-semibold"
            :aria-label="`Insérer ${char}`"
            @click="insert(char)"
          >
            {{ char }}
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button v-for="s in PULAAR_SAMPLES" :key="s.label" type="button" class="pl-btn" @click="text = s.text">
            {{ s.label }}
          </button>
        </div>

        <!-- Les deux relevés -->
        <div class="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
          <div class="border border-pl-rule/35 p-3">
            <div class="mb-2 flex items-baseline justify-between gap-2 border-b border-pl-rule/35 pb-1.5">
              <span class="pl-meta">Relevé A · BPE Whisper</span>
              <span class="font-plexmono text-xs font-bold text-pl-red">{{ std.length }}</span>
            </div>
            <div class="flex flex-wrap gap-1 font-plexmono text-[0.7rem]">
              <span v-for="(t, i) in std" :key="`a${i}`" class="border border-pl-red/40 px-1.5 py-0.5 text-pl-red">{{ t }}</span>
            </div>
          </div>
          <div class="border border-pl-rule/35 p-3">
            <div class="mb-2 flex items-baseline justify-between gap-2 border-b border-pl-rule/35 pb-1.5">
              <span class="pl-meta">Relevé B · Pulaar-v3</span>
              <span class="font-plexmono text-xs font-bold text-pl-blue">{{ morph.length }}</span>
            </div>
            <div class="flex flex-wrap gap-1 font-plexmono text-[0.7rem]">
              <span v-for="(t, i) in morph" :key="`b${i}`" class="border border-pl-blue/40 px-1.5 py-0.5 text-pl-blue">{{ t }}</span>
            </div>
          </div>
        </div>

        <p class="pl-annot pl-mark">
          ▸ Relevé A fractionne chaque implosive en deux unités : le modèle perd la frontière morphologique.
        </p>
      </div>

      <!-- Empreinte spectrale -->
      <div class="flex min-w-0 flex-col justify-between p-4 sm:p-6 lg:col-span-5">
        <div>
          <div class="pl-meta mb-2">Empreinte spectrale log-mel — tirage à l'encre</div>
          <canvas
            ref="canvas"
            width="420"
            height="170"
            class="w-full border border-pl-rule/40"
            aria-label="Empreinte spectrale du texte mesuré"
          />
          <RichText
            tag="p"
            class="pl-meta mt-2 normal-case tracking-normal"
            text="Les implosives produisent des transitoires glottales rapides, relevées au bleu dans les bandes $2.5\text{–}4.5\text{ kHz}$."
          />
        </div>
        <button type="button" class="pl-btn pl-btn-on mt-4 w-full" @click="playPreview">▶ Synthétiser l'empreinte</button>
      </div>
    </div>
  </section>
</template>
