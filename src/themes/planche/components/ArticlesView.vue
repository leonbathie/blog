<script setup>
import { computed } from 'vue'
import { articles, categories, dotDate } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'

/**
 * Index des monographies, présenté comme le registre d'un jeu de planches :
 * une ligne numérotée par pièce, puis la planche elle-même en regard.
 */
const props = defineProps({
  filter: { type: String, default: 'all' },
  query: { type: String, default: '' },
  selected: { type: Object, default: null },
})
const emit = defineEmits(['update:filter', 'update:query', 'select', 'copy-bibtex', 'open-lab'])

const shown = computed(() => {
  const q = props.query.trim().toLowerCase()
  return articles.filter((a) => {
    const byCat = props.filter === 'all' || a.category === props.filter
    const byQuery = !q || `${a.title} ${a.abstract} ${a.tag}`.toLowerCase().includes(q)
    return byCat && byQuery
  })
})

const indexOf = (article) => articles.indexOf(article) + 1
const folio = (article) => String(indexOf(article)).padStart(2, '0')
</script>

<template>
  <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
    <!-- Registre -->
    <aside class="lg:col-span-5 xl:col-span-4">
      <div class="flex items-baseline justify-between gap-3 border-b-2 border-pl-rule pb-2">
        <h2 class="font-archivo text-sm font-bold uppercase tracking-wide text-pl-ink">Registre des monographies</h2>
        <span class="pl-meta">{{ shown.length }}/{{ articles.length }}</span>
      </div>

      <!-- Filtres -->
      <div class="mt-3 space-y-2">
        <label for="pl-search" class="sr-only">Rechercher dans les monographies</label>
        <input
          id="pl-search"
          :value="query"
          type="search"
          placeholder="Rechercher…"
          class="pl-field"
          @input="emit('update:query', $event.target.value)"
        />
        <div class="flex flex-wrap gap-1.5">
          <button type="button" class="pl-btn" :class="filter === 'all' ? 'pl-btn-on' : ''" @click="emit('update:filter', 'all')">
            Tout
          </button>
          <button
            v-for="c in categories"
            :key="c.id"
            type="button"
            class="pl-btn"
            :class="filter === c.id ? 'pl-btn-on' : ''"
            @click="emit('update:filter', c.id)"
          >
            {{ c.label }}
          </button>
        </div>
      </div>

      <!-- Lignes du registre -->
      <ol class="mt-4">
        <li v-for="a in shown" :key="a.slug">
          <button
            type="button"
            class="pl-sheet mb-1.5 flex w-full items-start gap-3 p-3 text-left"
            :class="selected?.slug === a.slug ? 'pl-sheet-on' : ''"
            :aria-current="selected?.slug === a.slug ? 'true' : undefined"
            @click="emit('select', a.slug)"
          >
            <span class="pl-meta mt-0.5 shrink-0 tabular-nums">{{ folio(a) }}</span>
            <span class="min-w-0 flex-1">
              <span class="pl-sheet-title block">{{ a.title }}</span>
              <span class="pl-meta mt-1 block normal-case tracking-normal">{{ dotDate(a.date) }} · {{ a.readTime }} min · {{ a.tag }}</span>
            </span>
          </button>
        </li>
      </ol>

      <p v-if="!shown.length" class="pl-meta mt-4 normal-case tracking-normal">Aucune pièce ne correspond à ce filtre.</p>
    </aside>

    <!-- Planche ouverte -->
    <article v-if="selected" class="min-w-0 lg:col-span-7 xl:col-span-8">
      <div class="border-2 border-pl-rule bg-pl-paper/80">
        <!-- Cartouche de la pièce -->
        <header class="border-b-2 border-pl-rule">
          <div class="grid grid-cols-2 sm:grid-cols-4">
            <div class="pl-cell border-r border-t-0 border-pl-rule/35">
              <span class="pl-cell-label">Folio</span>
              <span class="pl-cell-value">{{ folio(selected) }}/{{ String(articles.length).padStart(2, '0') }}</span>
            </div>
            <div class="pl-cell border-pl-rule/35 sm:border-r">
              <span class="pl-cell-label">Date</span>
              <span class="pl-cell-value">{{ dotDate(selected.date) }}</span>
            </div>
            <div class="pl-cell border-r border-pl-rule/35 sm:border-t-0">
              <span class="pl-cell-label">Lecture</span>
              <span class="pl-cell-value">{{ selected.readTime }} min</span>
            </div>
            <div class="pl-cell sm:border-t-0">
              <span class="pl-cell-label">Réf.</span>
              <span class="pl-cell-value truncate">{{ selected.id }}</span>
            </div>
          </div>

          <div class="border-t border-pl-rule/35 p-4 sm:p-6">
            <div class="pl-meta">{{ selected.tag }}</div>
            <h1 class="mt-1.5 font-archivo text-2xl font-extrabold uppercase leading-[1.1] tracking-tight text-pl-ink sm:text-[2rem]">
              {{ selected.title }}
            </h1>
            <RichText v-if="selected.abstract" tag="p" class="mt-3 font-plex text-[0.92rem] leading-relaxed text-pl-muted" :text="selected.abstract" />
            <div v-if="selected.metrics" class="pl-meta mt-3 border-l-[3px] border-pl-blue pl-3 normal-case tracking-normal">
              <RichText :text="selected.metrics" />
            </div>
          </div>
        </header>

        <!-- Corps -->
        <div class="p-4 sm:p-6">
          <div class="pl-prose" v-html="selected.html" />

          <!-- Renvois -->
          <div class="pl-rule-thick mt-8 flex flex-wrap items-center gap-2 pt-4">
            <button v-if="selected.bibtex" type="button" class="pl-btn" @click="emit('copy-bibtex')">Copier la citation BibTeX</button>
            <button v-if="selected.lab" type="button" class="pl-btn pl-btn-on" @click="emit('open-lab', selected.lab)">
              Ouvrir la planche de laboratoire
            </button>
          </div>

          <p class="pl-annot pl-mark mt-3">▸ Pièce {{ folio(selected) }} — renvois vérifiés, échelle 1:1.</p>
        </div>
      </div>
    </article>
  </div>
</template>
