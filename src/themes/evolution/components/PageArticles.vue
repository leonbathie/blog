<script setup>
import { computed, inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { contentIn } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'
import { copyText } from '../../../core/clipboard.js'
import { LABELS } from '../eras.js'
import { dateOf } from '../format.js'

/** Liste des articles, puis lecteur, dans les couleurs de l'époque. */
const props = defineProps({ era: { type: Object, required: true }, slug: { type: String, default: '' } })
const L = computed(() => LABELS[props.era.lang])
const C = computed(() => contentIn(props.era.lang))
const articles = computed(() => C.value.articles)
const categories = computed(() => C.value.categories)
const profile = computed(() => C.value.profile)
const evo = inject('evo')

// ?cat=… : catégorie choisie depuis l'accueil de 2000-2009
const catOf = (id) => (categories.value.some((c) => c.id === id) ? String(id) : 'all')
const filter = ref('all')
// ?q=… : recherche lancée depuis la barre d'invite de l'accueil (2020-2029)
const route = useRoute()
const query = ref(String(route.query.q ?? ''))
watch(
  () => route.query.q,
  (q) => {
    if (q !== undefined) query.value = String(q)
  },
)
filter.value = catOf(route.query.cat)
watch(
  () => route.query.cat,
  (cat) => {
    if (cat !== undefined) filter.value = catOf(cat)
  },
)
const shown = computed(() => {
  let list = filter.value === 'all' ? articles.value : articles.value.filter((a) => a.category === filter.value)
  // tous les mots demandés doivent figurer, dans n'importe quel ordre ; guillemets ignorés
  const words = query.value.toLowerCase().replace(/[«»“”"]/g, ' ').split(/\s+/).filter(Boolean)
  if (words.length) list = list.filter((a) => words.every((w) => `${a.title} ${a.abstract} ${a.tag}`.toLowerCase().includes(w)))
  return list
})
const label = (id) => categories.value.find((c) => c.id === id)?.label ?? id

const selected = computed(() => (props.slug ? articles.value.find((a) => a.slug === props.slug) : null) ?? null)
const index = computed(() => articles.value.findIndex((a) => a.slug === selected.value?.slug))
const older = computed(() => (index.value >= 0 ? articles.value[index.value + 1] : null) ?? null)
const newer = computed(() => (index.value > 0 ? articles.value[index.value - 1] : null) ?? null)

async function copyBibtex() {
  if (!selected.value?.bibtex) return
  evo.toast((await copyText(selected.value.bibtex)) ? L.value.copied : '…')
}
</script>

<template>
  <!-- Lecteur -->
  <article v-if="selected" class="p-4 sm:p-6">
    <p class="flex flex-wrap items-center justify-between gap-2 text-[0.82rem]" style="font-family: var(--era-mono)">
      <span class="era-muted">{{ selected.tag || label(selected.category) }}</span>
      <RouterLink :to="{ name: 'articles' }" class="era-link">← {{ L.back }}</RouterLink>
    </p>
    <h1 class="era-h1 mt-2 text-2xl font-bold sm:text-3xl">{{ selected.title }}</h1>
    <p class="era-muted mt-2 text-[0.85rem]">
      {{ L.by }} {{ profile.name }} · {{ dateOf(selected.date, era.lang) }} · {{ selected.readTime }} {{ L.min }}
    </p>
    <RichText v-if="selected.abstract" tag="p" class="mt-3 border-l-2 border-[rgb(var(--era-accent))] pl-3 text-[0.95rem] italic leading-snug" :text="selected.abstract" />
    <p v-if="selected.metrics" class="era-chip mt-3 text-[0.82rem]"><RichText :text="selected.metrics" /></p>
    <div class="era-prose mt-5" :lang="selected.bodyLang ?? era.lang" v-html="selected.html" />
    <div class="mt-6 flex flex-wrap items-center gap-2 border-t border-[rgb(var(--era-line))] pt-3">
      <button v-if="selected.bibtex" type="button" class="era-btn" @click="copyBibtex">{{ L.copy }}</button>
      <RouterLink v-if="selected.lab" :to="{ name: 'lab', params: { module: selected.lab } }" class="era-btn">{{ L.openLab }}</RouterLink>
      <span class="flex-1" />
      <RouterLink v-if="older" :to="{ name: 'article', params: { slug: older.slug } }" class="era-link text-[0.85rem]">« {{ L.olderArticle }}</RouterLink>
      <RouterLink v-if="newer" :to="{ name: 'article', params: { slug: newer.slug } }" class="era-link text-[0.85rem]">{{ L.newerArticle }} »</RouterLink>
    </div>
  </article>

  <!-- Liste -->
  <div v-else class="p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="era-h1 text-2xl font-bold">{{ L.allNotes }} <span class="era-muted text-base font-normal">({{ shown.length }})</span></h1>
      <input v-model="query" type="search" class="era-field max-w-xs" :placeholder="L.search" :aria-label="L.search" />
    </div>
    <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[0.85rem]">
      <span class="era-muted">{{ L.filter }}{{ L.colon }}</span>
      <button type="button" class="era-btn" :class="filter === 'all' ? 'era-btn-on' : ''" @click="filter = 'all'">{{ L.all }}</button>
      <button v-for="c in categories" :key="c.id" type="button" class="era-btn" :class="filter === c.id ? 'era-btn-on' : ''" @click="filter = c.id">
        {{ c.label }}
      </button>
    </div>
    <ul class="mt-4 divide-y divide-[rgb(var(--era-line))]">
      <li v-for="a in shown" :key="a.slug" class="py-3">
        <h2 class="era-h2 text-[1.05rem] leading-tight">
          <RouterLink :to="{ name: 'article', params: { slug: a.slug } }" class="era-link">{{ a.title }}</RouterLink>
        </h2>
        <p class="era-muted mt-0.5 text-[0.8rem]" style="font-family: var(--era-mono)">
          {{ dateOf(a.date, era.lang) }} · {{ a.readTime }} {{ L.min }} · {{ label(a.category) }}
        </p>
        <p class="mt-1 text-[0.9rem] leading-snug">{{ a.abstract }}</p>
      </li>
    </ul>
    <p v-if="!shown.length" class="era-muted mt-4">{{ L.none }}</p>
  </div>
</template>
