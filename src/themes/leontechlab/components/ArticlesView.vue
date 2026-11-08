<script setup>
import { computed } from 'vue'
import { articles, categories, monthLabel } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'
import PixelThumb from './PixelThumb.vue'

/** Colonne centrale : liste des articles, puis lecteur. */
const props = defineProps({
  filter: { type: String, default: 'all' },
  selected: { type: Object, default: null },
  reading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:filter', 'select', 'copy-bibtex', 'open-lab', 'close'])

const TONES = { 'speech-ai': 'blue', security: 'gold', industrial: 'green' }
const shown = computed(() =>
  props.filter === 'all' ? articles : articles.filter((a) => a.category === props.filter),
)
const label = (id) => categories.find((c) => c.id === id)?.label ?? id
</script>

<template>
  <!-- Lecteur -->
  <article v-if="reading && selected" class="leon-box p-4 sm:p-6">
    <div class="leon-box-header flex flex-wrap items-center justify-between gap-2 font-silk text-[0.62rem]">
      <span>&gt; {{ selected.tag || label(selected.category) }}</span>
      <button type="button" class="leon-btn" @click="emit('close')">[ Retour à l'index ]</button>
    </div>

    <h1 class="font-silk text-base leading-relaxed text-leon-gold sm:text-lg">{{ selected.title }}</h1>
    <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.68rem] text-leon-dim">
      <span>Par {{ 'Ousmane BA' }}</span>
      <span>{{ monthLabel(selected.date) }}</span>
      <span>{{ selected.readTime }} min</span>
      <span>Réf. {{ selected.id }}</span>
    </div>
    <RichText
      v-if="selected.abstract"
      tag="p"
      class="mt-3 border-l-2 border-leon-green/50 pl-3 text-[0.78rem] leading-relaxed text-leon-ink/75"
      :text="selected.abstract"
    />
    <div v-if="selected.metrics" class="mt-3 bg-leon-dark/50 px-3 py-2 text-[0.72rem] text-leon-green">
      <RichText :text="selected.metrics" />
    </div>

    <div class="leon-prose mt-5" v-html="selected.html" />

    <div class="mt-6 flex flex-wrap gap-2 border-t border-leon-green/30 pt-4">
      <button v-if="selected.bibtex" type="button" class="leon-btn" @click="emit('copy-bibtex')">
        [ Copier BibTeX ]
      </button>
      <button v-if="selected.lab" type="button" class="leon-btn leon-btn-gold" @click="emit('open-lab', selected.lab)">
        [ Ouvrir le simulateur ]
      </button>
    </div>
  </article>

  <!-- Index -->
  <div v-else class="space-y-4">
    <div class="leon-box p-3">
      <div class="flex flex-wrap items-center gap-2 text-[0.7rem]">
        <span class="text-leon-dim">FILTRE :</span>
        <button type="button" class="leon-btn" :class="filter === 'all' ? 'leon-btn-on' : ''" @click="emit('update:filter', 'all')">
          Tous ({{ articles.length }})
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          type="button"
          class="leon-btn"
          :class="filter === c.id ? 'leon-btn-on' : ''"
          @click="emit('update:filter', c.id)"
        >
          {{ c.label }}
        </button>
      </div>
    </div>

    <article v-for="a in shown" :key="a.slug" class="leon-box p-3 sm:p-4">
      <div class="flex gap-3 sm:gap-4">
        <div class="h-20 w-20 shrink-0 border border-leon-green/40 sm:h-24 sm:w-24">
          <PixelThumb :seed="a.slug" :tone="TONES[a.category] ?? 'green'" />
        </div>
        <div class="min-w-0 flex-1">
          <button
            type="button"
            class="block text-left font-silk text-[0.74rem] leading-relaxed text-leon-gold hover:text-leon-bright sm:text-[0.82rem]"
            @click="emit('select', a.slug)"
          >
            {{ a.title }}
          </button>
          <div class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.66rem] text-leon-dim">
            <span>Par Ousmane BA</span>
            <span>{{ monthLabel(a.date) }}</span>
            <span class="text-leon-green">{{ a.tag || label(a.category) }}</span>
          </div>
          <p class="mt-2 line-clamp-2 text-[0.74rem] leading-relaxed text-leon-ink/70">{{ a.abstract }}</p>
          <button type="button" class="mt-2 text-[0.7rem] text-leon-green hover:text-leon-bright" @click="emit('select', a.slug)">
            [ Lire la suite → ]
          </button>
        </div>
      </div>
    </article>

    <p v-if="!shown.length" class="leon-box p-4 text-[0.75rem] text-leon-dim">Aucun article dans ce domaine.</p>
  </div>
</template>
