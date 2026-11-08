<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { contentIn } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'
import { LABELS, NAV_TARGETS } from '../eras.js'
import { yearOf, dateOf } from '../format.js'

/** Page d'accueil de la fenêtre : trois structures selon l'époque. */
const props = defineProps({ era: { type: Object, required: true }, visits: { type: Number, default: 0 } })
const L = computed(() => LABELS[props.era.lang])
const C = computed(() => contentIn(props.era.lang))
const articles = computed(() => C.value.articles)
const profile = computed(() => C.value.profile)
/* 2000-2009 : catégories réelles du blog, et archives par mois */
const categories = computed(() =>
  C.value.categories.map((c) => ({ ...c, count: articles.value.filter((a) => a.category === c.id).length })).filter((c) => c.count),
)
const months = computed(() => {
  const seen = new Map()
  for (const a of articles.value) {
    const key = String(a.date).slice(0, 7)
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  return [...seen].map(([key, count]) => ({ key, count }))
})
const latest = computed(() => articles.value.slice(0, props.era.layout === 'classic' ? 3 : 4))
const interests = computed(() => props.era.interests ?? profile.value.domains.map((d) => d.title))
const counter = computed(() => String(props.visits).padStart(6, '0'))

/* 2020-2029 : la barre d'invite cherche dans les articles */
const router = useRouter()
const ask = ref('')
const PROMPT = {
  en: { label: 'Search the notes', placeholder: 'Ask the notebook: “Whisper Pulaar”, “Weibull”…', enter: 'Enter' },
  fr: { label: 'Rechercher dans les articles', placeholder: 'Demandez au carnet : « Whisper pulaar », « Weibull »…', enter: 'Entrée' },
}
const P = computed(() => PROMPT[props.era.lang])
function submitAsk() {
  const q = ask.value.trim()
  router.push({ name: 'articles', query: q ? { q } : {} })
}
</script>

<template>
  <!-- 1991-1999 : page personnelle, barre noire à gauche -->
  <div v-if="era.layout === 'classic'" class="grid grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)]">
    <aside class="era-side px-3 py-3 text-[0.9rem]">
      <p class="mb-2 font-bold text-[#33ff33] sm:mb-3">LeonTechLab</p>
      <ul class="flex flex-wrap gap-x-4 gap-y-1.5 sm:block sm:space-y-1.5">
        <li v-for="[label, key] in era.nav" :key="label" class="flex items-center gap-2">
          <span aria-hidden="true">▶</span>
          <RouterLink :to="NAV_TARGETS[key]" :class="key === 'home' ? 'era-side-on' : ''">{{ label }}</RouterLink>
        </li>
      </ul>
      <!-- L'Afrique en caractères pleins, comme sur les pages perso des années 1990 -->
      <pre class="mt-5 hidden text-[0.55rem] leading-[0.6rem] text-[#33ff33] sm:block" aria-hidden="true">
    ▄▄▄▄▄▄▄▄▄▄
  ▄████████████▄
 ███████████████▄
 ████████████████▄▄
  ▀▀▀█████████████▀
      ██████████▀
      █████████   ▄
       ███████   ██
        █████    ▀
         ███
          ▀</pre>
      <div class="mt-3 flex items-center gap-2 sm:mt-4 sm:block">
        <p class="text-[0.78rem] text-white">{{ L.visitors }}:</p>
        <p class="era-counter sm:mt-1" :title="era.lang === 'en' ? 'Visits from this browser' : 'Visites depuis ce navigateur'">{{ counter }}</p>
      </div>
    </aside>
    <div class="px-4 py-3">
      <div class="flex flex-wrap items-center gap-4">
        <img
          v-if="profile.avatar"
          :src="profile.avatar"
          alt=""
          width="64"
          height="64"
          class="h-16 w-16 border border-black object-cover grayscale contrast-125"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <div>
          <h1 class="era-h1 text-3xl font-bold">LeonTechLab</h1>
          <p class="font-[var(--era-mono)] text-[0.95rem] font-bold" style="font-family: var(--era-mono)">{{ era.subtitle }}</p>
        </div>
        <span class="ml-auto hidden text-4xl sm:block" aria-hidden="true">📡</span>
      </div>
      <hr class="my-3" />
      <p class="era-mark text-[1rem]">&gt; {{ era.headline }}</p>
      <p class="mt-2 text-[0.95rem] leading-snug" style="font-family: var(--era-mono)">{{ era.intro }}</p>
      <h2 class="era-bracket mt-4">[ {{ L.notes }} ]</h2>
      <ul class="mt-2 list-disc space-y-1 pl-6 text-[0.95rem]" style="font-family: var(--era-mono)">
        <li v-for="a in latest" :key="a.slug">
          <RouterLink :to="{ name: 'article', params: { slug: a.slug } }" class="era-link">{{ a.title }}</RouterLink>
          <span class="era-muted"> ({{ yearOf(a.date) }})</span>
        </li>
      </ul>
      <h2 class="era-bracket mt-4">[ {{ L.interests }} ]</h2>
      <ul class="mt-2 list-disc space-y-0.5 pl-6 text-[0.95rem]" style="font-family: var(--era-mono)">
        <li v-for="i in interests" :key="i">{{ i }}</li>
      </ul>
      <hr class="my-3" />
      <p class="era-muted text-[0.8rem]" style="font-family: var(--era-mono)">
        {{ L.updated }}: {{ dateOf(articles[0]?.date, era.lang) }} · Best viewed with Netscape Navigator 3.0 · 800×600
      </p>
    </div>
  </div>

  <!-- 2000-2009 : blog à catégories -->
  <div v-else-if="era.layout === 'blog'" class="p-3">
    <header class="era-glossy px-4 py-3">
      <div class="flex items-center gap-3">
        <span class="text-2xl" aria-hidden="true">🌐</span>
        <div>
          <h1 class="text-2xl font-bold" style="font-family: var(--era-head)">LeonTechLab</h1>
          <p class="text-[0.8rem] opacity-90">{{ era.subtitle }}</p>
        </div>
        <span class="era-rss ml-auto" aria-hidden="true">RSS</span>
      </div>
      <nav class="mt-2 flex flex-wrap gap-x-4 text-[0.82rem]">
        <RouterLink v-for="[label, key] in era.nav" :key="label" :to="NAV_TARGETS[key]" class="hover:underline">{{ label }}</RouterLink>
      </nav>
    </header>
    <div class="grid grid-cols-1 gap-3 border border-t-0 border-[rgb(var(--era-line))] bg-[rgb(var(--era-paper))] p-3 sm:grid-cols-[170px_minmax(0,1fr)]">
      <aside class="text-[0.82rem]">
        <h2 class="rounded bg-[rgb(var(--era-accent))] px-2 py-1 font-bold text-white">Categories</h2>
        <ul class="mt-1 space-y-0.5 px-1">
          <li v-for="c in categories" :key="c.id">
            <RouterLink :to="{ name: 'articles', query: { cat: c.id } }" class="era-link">▪ {{ c.label }}</RouterLink>
            <span class="era-muted"> ({{ c.count }})</span>
          </li>
        </ul>
        <h2 class="mt-3 rounded bg-[rgb(var(--era-accent))] px-2 py-1 font-bold text-white">Archives</h2>
        <ul class="mt-1 space-y-0.5 px-1 era-muted">
          <li v-for="m in months" :key="m.key">{{ dateOf(m.key, era.lang) }} ({{ m.count }})</li>
        </ul>
      </aside>
      <div class="space-y-3">
        <article v-for="a in latest" :key="a.slug" class="era-panel p-3">
          <h2 class="text-[1.05rem] font-bold" style="font-family: var(--era-head)">
            <RouterLink :to="{ name: 'article', params: { slug: a.slug } }" class="era-link">{{ a.title }}</RouterLink>
          </h2>
          <p class="era-muted text-[0.75rem]">{{ dateOf(a.date, 'en') }} · {{ L.by }} {{ profile.name }} · 0 comments</p>
          <p class="mt-1 text-[0.85rem] leading-snug">{{ a.abstract }}</p>
        </article>
      </div>
    </div>
  </div>

  <!-- 2010 et au-delà : héros et cartes -->
  <div v-else class="p-4 sm:p-6">
    <nav class="flex flex-wrap gap-x-4 gap-y-1 text-[0.85rem]" style="font-family: var(--era-mono)">
      <RouterLink v-for="[label, key] in era.nav" :key="label" :to="NAV_TARGETS[key]" class="era-muted hover:text-[rgb(var(--era-accent))]">{{ label }}</RouterLink>
    </nav>
    <section class="mt-6 max-w-2xl">
      <p class="era-muted text-[0.8rem] uppercase tracking-[0.2em]" style="font-family: var(--era-mono)">{{ era.years }} · {{ era.name }}</p>
      <h1 class="era-h1 mt-2 text-2xl font-bold sm:text-4xl">{{ era.headline }}</h1>
      <p class="mt-3 text-[1rem] leading-snug era-muted">{{ era.intro }}</p>
      <p class="mt-2 text-[0.9rem]">{{ era.subtitle }} — <span class="era-muted">{{ profile.city }}</span></p>
      <form v-if="era.id === 'genai'" class="era-prompt mt-5 text-[0.9rem]" role="search" @submit.prevent="submitAsk">
        <span aria-hidden="true">✦</span>
        <input v-model="ask" type="search" class="era-prompt-input" :placeholder="P.placeholder" :aria-label="P.label" enterkeyhint="search" autocomplete="off" />
        <button type="submit" class="era-btn era-prompt-go">{{ P.enter }} <span aria-hidden="true">↵</span></button>
      </form>
      <ul v-if="era.checklist" class="era-check mt-5 grid grid-cols-1 gap-1 text-[0.95rem] sm:grid-cols-2">
        <li v-for="c in era.checklist" :key="c">{{ c }}</li>
      </ul>
    </section>
    <section class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <article v-for="a in latest" :key="a.slug" class="era-panel p-3">
        <p class="era-muted text-[0.72rem]" style="font-family: var(--era-mono)">{{ dateOf(a.date, era.lang) }} · {{ a.readTime }} {{ L.min }}</p>
        <h2 class="era-h2 mt-1 text-[1rem] leading-tight">
          <RouterLink :to="{ name: 'article', params: { slug: a.slug } }" class="hover:text-[rgb(var(--era-accent))]">{{ a.title }}</RouterLink>
        </h2>
        <p class="era-muted mt-1 line-clamp-2 text-[0.85rem] leading-snug">{{ a.abstract }}</p>
      </article>
    </section>
    <section class="mt-5 flex flex-wrap gap-2">
      <RouterLink v-for="d in profile.domains" :key="d.id" :to="d.to" class="era-chip hover:border-[rgb(var(--era-accent))]">
        <RichText :text="d.tag" />
      </RouterLink>
    </section>
  </div>
</template>
