<script setup>
import { computed } from 'vue'
import { articles, categories, monthLabel } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'

/** [LOG 01] — Journal des monographies : liste à gauche, lecteur à droite. */
const props = defineProps({
  filter: { type: String, default: 'all' },
  selected: { type: Object, default: null },
})
const emit = defineEmits(['update:filter', 'select', 'copy-bibtex', 'open-lab'])

const shown = computed(() =>
  props.filter === 'all' ? articles : articles.filter((a) => a.category === props.filter),
)
</script>

<template>
  <div class="space-y-6">
    <!-- Filtre -->
    <div class="flex flex-wrap items-center gap-2 font-techmono text-xs">
      <span class="text-slate-500">FILTRE_SECTEUR:</span>
      <button type="button" class="ms-btn px-3 py-1.5" :class="filter === 'all' ? 'ms-btn-on' : ''" @click="emit('update:filter', 'all')">
        TOUS
      </button>
      <button
        v-for="c in categories"
        :key="c.id"
        type="button"
        class="ms-btn px-3 py-1.5"
        :class="filter === c.id ? 'ms-btn-on' : ''"
        @click="emit('update:filter', c.id)"
      >
        {{ c.label.toUpperCase() }}
      </button>
      <span class="ml-auto text-slate-500">{{ shown.length }}/{{ articles.length }} LOGS</span>
    </div>

    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      <!-- Journal -->
      <div class="space-y-4 lg:col-span-5">
        <button
          v-for="a in shown"
          :key="a.slug"
          type="button"
          class="ms-card block w-full p-5 text-left sm:p-6"
          :class="selected?.slug === a.slug ? 'ms-card-on' : ''"
          :aria-current="selected?.slug === a.slug ? 'true' : undefined"
          @click="emit('select', a.slug)"
        >
          <span class="mb-2 flex justify-between gap-3 font-techmono text-[0.68rem] text-slate-400">
            <span :class="selected?.slug === a.slug ? 'font-bold text-orange-400' : ''">{{ a.tag }}</span>
            <span class="shrink-0">{{ a.readTime }} MIN</span>
          </span>
          <span class="block font-grotesk text-base font-bold leading-snug text-white">{{ a.title }}</span>
          <span class="mt-2 block font-grotesk text-xs leading-relaxed text-slate-400">{{ a.abstract }}</span>
        </button>

        <p v-if="!shown.length" class="font-techmono text-xs text-slate-500">Aucun log dans ce secteur.</p>
      </div>

      <!-- Lecteur -->
      <article v-if="selected" class="ms-card min-w-0 p-6 sm:p-10 lg:col-span-7">
        <header class="border-b border-orange-500/30 pb-5">
          <div class="mb-2 flex flex-wrap justify-between gap-3 font-techmono text-xs text-amber-400">
            <span>{{ selected.tag }}</span>
            <button
              v-if="selected.bibtex"
              type="button"
              class="font-bold text-orange-400 hover:underline"
              @click="emit('copy-bibtex')"
            >
              [Copier BibTeX]
            </button>
          </div>
          <h2 class="font-orbitron text-xl font-bold leading-tight text-white sm:text-2xl">{{ selected.title }}</h2>
          <RichText
            v-if="selected.abstract"
            tag="p"
            class="mt-3 font-grotesk text-sm italic leading-relaxed text-slate-400"
            :text="selected.abstract"
          />
          <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-techmono text-[0.68rem] text-slate-500">
            <span>RÉF: {{ selected.id }}</span>
            <span>DATE: {{ monthLabel(selected.date) }}</span>
            <span>DURÉE: {{ selected.readTime }} MIN</span>
          </div>
          <div v-if="selected.metrics" class="mt-3 border-l-[3px] border-orange-500 bg-black/60 px-3 py-2 font-techmono text-[0.7rem] text-orange-300">
            <RichText :text="selected.metrics" />
          </div>
        </header>

        <div class="ms-prose mt-6" v-html="selected.html" />

        <div v-if="selected.lab" class="mt-8 border-t border-orange-500/30 pt-5">
          <button type="button" class="ms-btn ms-btn-on" @click="emit('open-lab', selected.lab)">
            ▸ Ouvrir le module de laboratoire associé
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
