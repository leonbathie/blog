<script setup>
import { computed } from 'vue'
import RichText from '../../../components/RichText.vue'
import PixelIcon from './PixelIcon.vue'
import { moisCourt } from '../format.js'
import { t, useLeon } from '../i18n.js'

/**
 * Colonne centrale : la liste des articles (accueil, ou page « Articles »
 * avec recherche et filtres), puis le lecteur.
 */
const props = defineProps({
  /** 'home' : tous les articles, sans outils ; 'list' : recherche et filtres */
  mode: { type: String, default: 'home' },
  filter: { type: String, default: 'all' },
  query: { type: String, default: '' },
  selected: { type: Object, default: null },
  reading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:filter', 'update:query', 'copy-bibtex', 'open-lab', 'close'])
const { lang, content } = useLeon()

const articles = computed(() => content.value.articles)
const categories = computed(() => content.value.categories)
const profile = computed(() => content.value.profile)

/** Vignette : champ `icon` de l'article, sinon une icône par domaine */
const ICONS = { 'speech-ai': 'computer', security: 'satellite', industrial: 'gear' }
const iconOf = (a) => a.icon ?? ICONS[a.category] ?? 'computer'

const label = (id) => categories.value.find((c) => c.id === id)?.label ?? id
const count = (id) => articles.value.filter((a) => a.category === id).length

const shown = computed(() => {
  if (props.mode !== 'list') return articles.value
  let list = props.filter === 'all' ? articles.value : articles.value.filter((a) => a.category === props.filter)
  const q = props.query.trim().toLowerCase()
  if (q) list = list.filter((a) => `${a.title} ${a.abstract} ${a.tag} ${label(a.category)}`.toLowerCase().includes(q))
  return list
})

function resetList() {
  emit('update:query', '')
  emit('update:filter', 'all')
}

/* Article précédent / suivant, dans l'ordre chronologique */
const index = computed(() => articles.value.findIndex((a) => a.slug === props.selected?.slug))
const older = computed(() => (index.value >= 0 ? articles.value[index.value + 1] : null) ?? null)
const newer = computed(() => (index.value > 0 ? articles.value[index.value - 1] : null) ?? null)
</script>

<template>
  <!-- Lecteur -->
  <article v-if="reading && selected" class="leon-panel">
    <h2 class="leon-panel-head">{{ selected.tag || label(selected.category) }}</h2>
    <div class="leon-panel-body">
      <div class="flex flex-wrap items-center justify-between gap-2 text-[1rem] text-leon-dim">
        <span>{{ t('articles.ref', { id: selected.id }) }}</span>
        <button type="button" class="leon-btn" @click="emit('close')">{{ t('articles.back') }}</button>
      </div>

      <h1 class="leon-article-title mt-2 text-[1.55rem] sm:text-[1.9rem]">{{ selected.title }}</h1>
      <p class="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[1.05rem] sm:gap-x-2">
        <span class="text-leon-gold">{{ t('articles.by', { name: profile.name }) }}</span>
        <span class="hidden text-leon-dim sm:inline" aria-hidden="true">|</span>
        <span class="text-leon-green">{{ moisCourt(selected.date, lang) }}</span>
        <span class="hidden text-leon-dim sm:inline" aria-hidden="true">|</span>
        <span class="text-leon-ink/80">{{ t('articles.minutes', { n: selected.readTime }) }}</span>
        <span class="hidden text-leon-dim sm:inline" aria-hidden="true">|</span>
        <span class="text-leon-gold">{{ label(selected.category) }}</span>
      </p>

      <RichText
        v-if="selected.abstract"
        tag="p"
        class="mt-3 border-l-2 border-leon-green/70 pl-3 text-[1.15rem] italic leading-tight text-leon-ink/85"
        :text="selected.abstract"
      />
      <p v-if="selected.metrics" class="mt-3 border border-leon-green/40 bg-leon-dark/40 px-3 py-1 text-[1.05rem] text-leon-gold">
        <RichText :text="selected.metrics" />
      </p>

      <p v-if="selected.bodyLang !== lang" class="mt-4 border border-dashed border-leon-gold/60 px-3 py-1 text-[1.05rem] text-leon-gold">
        {{ t('articles.frOnly') }}
      </p>
      <div class="leon-prose mt-5" :lang="selected.bodyLang" v-html="selected.html" />

      <div class="leon-rule mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 pt-3">
        <button v-if="selected.bibtex" type="button" class="leon-btn" @click="emit('copy-bibtex')">{{ t('articles.copyBibtex') }}</button>
        <button v-if="selected.lab" type="button" class="leon-btn leon-btn-amber" @click="emit('open-lab', selected.lab)">
          {{ t('articles.openLab') }}
        </button>
      </div>
      <nav class="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2" :aria-label="t('articles.others')">
        <RouterLink
          v-if="older"
          :to="{ name: 'article', params: { slug: older.slug } }"
          class="block border border-leon-green/40 px-2 py-1 hover:bg-leon-green/10"
        >
          <span class="block text-[1rem] text-leon-dim">{{ t('articles.older') }}</span>
          <span class="block truncate text-[1.1rem] text-leon-cyan">{{ older.title }}</span>
        </RouterLink>
        <span v-else class="hidden sm:block" />
        <RouterLink
          v-if="newer"
          :to="{ name: 'article', params: { slug: newer.slug } }"
          class="block border border-leon-green/40 px-2 py-1 hover:bg-leon-green/10 sm:text-right"
        >
          <span class="block text-[1rem] text-leon-dim">{{ t('articles.newer') }}</span>
          <span class="block truncate text-[1.1rem] text-leon-cyan">{{ newer.title }}</span>
        </RouterLink>
      </nav>
    </div>
  </article>

  <!-- Liste -->
  <section v-else class="leon-panel">
    <template v-if="mode === 'list'">
      <h2 class="leon-panel-head">{{ t('articles.title', { n: shown.length, total: articles.length }) }}</h2>
      <form class="flex items-center gap-2 px-2.5 pt-1.5 text-[1.08rem]" role="search" @submit.prevent>
        <label for="leon-list-q" class="shrink-0 text-leon-green">&gt;&gt; {{ t('articles.search') }}</label>
        <input
          id="leon-list-q"
          type="search"
          class="leon-field"
          :placeholder="t('articles.placeholder')"
          autocomplete="off"
          :value="query"
          @input="emit('update:query', $event.target.value)"
        />
      </form>
      <div class="flex flex-wrap items-center gap-x-1 gap-y-0.5 px-2 pb-1.5 pt-1 text-[1.05rem]">
        <span class="text-leon-dim">{{ t('articles.filter') }}</span>
        <button type="button" class="leon-btn" :class="filter === 'all' ? 'leon-btn-on' : ''" @click="emit('update:filter', 'all')">
          {{ t('articles.all', { n: articles.length }) }}
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          type="button"
          class="leon-btn"
          :class="filter === c.id ? 'leon-btn-on' : ''"
          @click="emit('update:filter', c.id)"
        >
          {{ c.label }} ({{ count(c.id) }})
        </button>
      </div>
    </template>

    <ul class="divide-y divide-leon-green/40" :class="mode === 'list' ? 'border-t border-leon-green/40' : ''">
      <li v-for="a in shown" :key="a.slug" class="flow-root p-2.5 sm:flex sm:gap-4 sm:p-3.5">
        <!-- Sur téléphone la vignette flotte : le résumé reprend toute la largeur dessous -->
        <RouterLink
          :to="{ name: 'article', params: { slug: a.slug } }"
          class="leon-thumb float-left mb-1 mr-3 h-[60px] w-20 sm:float-none sm:m-0 sm:h-[78px] sm:w-[104px] sm:shrink-0"
          tabindex="-1"
          aria-hidden="true"
        >
          <PixelIcon :icon="iconOf(a)" />
        </RouterLink>
        <div class="sm:min-w-0 sm:flex-1">
          <h3 class="text-[1.32rem] leading-tight sm:text-[1.5rem]">
            <RouterLink :to="{ name: 'article', params: { slug: a.slug } }" class="leon-article-title">{{ a.title }}</RouterLink>
          </h3>
          <p class="mt-1 flex flex-wrap gap-x-3 text-[1.02rem] leading-tight sm:gap-x-2 sm:text-[1.08rem]">
            <span class="text-leon-gold">{{ t('articles.by', { name: profile.name }) }}</span>
            <span class="hidden text-leon-dim sm:inline" aria-hidden="true">|</span>
            <span class="text-leon-green">{{ moisCourt(a.date, lang) }}</span>
            <span class="hidden text-leon-dim sm:inline" aria-hidden="true">|</span>
            <span class="text-leon-gold">{{ label(a.category) }}</span>
          </p>
          <p class="mt-1.5 line-clamp-3 text-[1.1rem] leading-tight text-leon-ink/85 sm:line-clamp-2">{{ a.abstract }}</p>
          <RouterLink :to="{ name: 'article', params: { slug: a.slug } }" class="leon-btn -ml-1 mt-1">
            {{ t('articles.readMore') }}<span class="sr-only"> : {{ a.title }}</span>
          </RouterLink>
        </div>
      </li>
    </ul>

    <p v-if="!shown.length" class="leon-panel-body text-[1.1rem] text-leon-dim">
      {{ t('articles.none') }}
      <button type="button" class="leon-btn" @click="resetList">{{ t('articles.showAll') }}</button>
    </p>
  </section>
</template>
