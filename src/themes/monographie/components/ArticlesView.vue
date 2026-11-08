<script setup>
import { computed, ref } from 'vue'
import { articles, categories, monthLabel, profile } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'
import { LAB_MODULES } from '../labs.js'

const props = defineProps({
  selected: { type: Object, default: null },
  filter: { type: String, default: 'all' },
  query: { type: String, default: '' },
})
const emit = defineEmits(['select', 'update:filter', 'update:query', 'copy-bibtex', 'open-lab'])

const chips = [
  { id: 'all', label: `ALL (${articles.length})` },
  ...categories.map((c) => ({ id: c.id, label: c.label.toUpperCase() })),
]

const filtered = computed(() => {
  const q = props.query.trim().toLowerCase()
  return articles.filter(
    (a) =>
      (props.filter === 'all' || a.category === props.filter) &&
      (!q || [a.title, a.abstract, a.tag, a.metrics].some((text) => text.toLowerCase().includes(q))),
  )
})

const labCta = computed(() => LAB_MODULES.find((m) => m.id === props.selected?.lab) ?? null)

const reader = ref(null)
function pick(slug) {
  emit('select', slug)
  if (window.matchMedia('(max-width: 1023px)').matches) {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    reader.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }
}
</script>

<template>
  <main class="pt-8 pb-8 sm:pt-10">
    <div class="mono-section-intro">
      <div>
        <p>Journal de recherche · 01</p>
        <h2 class="text-mono-ink">À la une du laboratoire.</h2>
      </div>
      <span>IA vocale / Sécurité / Industrie</span>
    </div>

    <!-- Filtres & recherche -->
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
        <span class="mr-1 text-mono-muted">FILTRER :</span>
        <button
          v-for="chip in chips"
          :key="chip.id"
          type="button"
          class="min-h-[2.25rem] rounded-full border px-3 py-1.5 transition"
          :class="filter === chip.id ? 'border-mono-accent bg-mono-accent/10 text-mono-accent' : 'border-mono-line text-mono-muted hover:text-mono-ink'"
          :aria-pressed="filter === chip.id"
          @click="emit('update:filter', chip.id)"
        >
          {{ chip.label }}
        </button>
      </div>
      <input
        :value="query"
        type="search"
        placeholder="Rechercher (Whisper, MCP, MTBF, Fault...)"
        aria-label="Rechercher un article"
        class="w-full rounded-full border border-mono-line bg-mono-surface px-4 py-2.5 font-mono text-base text-mono-ink placeholder:text-mono-muted focus:border-mono-accent focus:outline-none sm:w-64 sm:text-xs"
        @input="emit('update:query', $event.target.value)"
      />
    </div>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
      <!-- Liste -->
      <div class="min-w-0 space-y-3 lg:col-span-5">
        <button
          v-for="a in filtered"
          :key="a.slug"
          type="button"
          class="block w-full rounded-xl border p-5 text-left transition hover:-translate-y-0.5"
          :class="a.slug === selected?.slug ? 'border-mono-accent bg-mono-accent/5 shadow-sm' : 'border-mono-line bg-mono-panel/40 hover:border-mono-muted'"
          @click="pick(a.slug)"
        >
          <span class="mb-1.5 flex items-center justify-between gap-2 font-mono text-[10px] text-mono-muted">
            <span :class="a.slug === selected?.slug ? 'font-semibold text-mono-accent' : ''">{{ a.id }} // {{ monthLabel(a.date) }}</span>
            <span class="shrink-0">{{ a.readTime }} MIN READ</span>
          </span>
          <span class="mono-card-title block font-serif font-medium text-mono-ink">{{ a.title }}</span>
          <span class="mt-2 line-clamp-2 block text-xs leading-relaxed text-mono-muted">{{ a.abstract }}</span>
          <span v-if="a.metrics" class="mt-3 block border-t border-mono-line/60 pt-2 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
            {{ a.metrics }}
          </span>
        </button>
        <div v-if="!filtered.length" class="rounded border border-dashed border-mono-line p-6 font-mono text-xs text-mono-muted">
          Aucun rapport ne correspond à cette requête.
        </div>
      </div>

      <!-- Lecteur -->
      <article
        v-if="selected"
        ref="reader"
        class="mono-reader min-w-0 scroll-mt-16 rounded-2xl border border-mono-line bg-mono-panel p-5 sm:p-8 lg:col-span-7"
      >
        <div class="mb-6 border-b border-mono-line pb-5">
          <div class="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-mono-accent">
            <span>{{ selected.tag }}</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded border border-mono-line bg-mono-surface px-2 py-0.5 text-mono-ink/80 transition hover:border-mono-accent"
                title="Copier la citation BibTeX"
                @click="emit('copy-bibtex')"
              >
                [Cite BibTeX]
              </button>
              <span class="rounded border border-mono-line bg-mono-surface px-2 py-0.5 text-mono-muted">ID: {{ selected.id }}</span>
            </div>
          </div>
          <h2 class="mono-reader-title font-serif font-medium text-mono-ink">{{ selected.title }}</h2>
          <div class="mt-4 rounded border-l-2 border-mono-accent bg-mono-surface/60 p-3.5 font-serif text-xs italic text-mono-ink/80 sm:text-sm">
            <strong>Abstract —</strong> {{ selected.abstract }}
          </div>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-mono-muted">
            <span>AUTEUR : {{ profile.name.toUpperCase() }} ({{ profile.city.toUpperCase() }})</span>
            <span v-if="selected.metrics">{{ selected.metrics }}</span>
          </div>
        </div>

        <div class="mono-prose text-sm sm:text-base" v-html="selected.html" />

        <button
          v-if="labCta"
          type="button"
          class="mt-6 rounded border border-mono-accent bg-mono-accent/10 px-3 py-1.5 text-left font-mono text-xs text-mono-accent transition hover:bg-mono-accent hover:text-white dark:hover:text-zinc-950"
          @click="emit('open-lab', labCta.id)"
        >
          → <RichText :text="labCta.cta" />
        </button>

        <div class="mt-8 border-t border-mono-line pt-4">
          <div class="mb-2 flex items-center justify-between gap-2 font-mono text-[11px] text-mono-muted">
            <span>ENTRÉE BIBTEX POUR CITATION ACADÉMIQUE</span>
            <button type="button" class="shrink-0 text-mono-accent hover:underline" @click="emit('copy-bibtex')">Copier BibTeX ⎘</button>
          </div>
          <pre class="overflow-x-auto rounded border border-mono-line bg-mono-surface/60 p-3 font-mono text-[11px] text-mono-muted">{{ selected.bibtex }}</pre>
        </div>
      </article>
    </div>
  </main>
</template>
