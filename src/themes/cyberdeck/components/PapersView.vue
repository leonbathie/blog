<script setup>
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { articles, dotDate } from '../../../content/index.js'
import { copyText } from '../../../core/clipboard.js'
import { vTilt } from '../tilt.js'

/** Espace 02 — Recherche : liste des monographies + lecteur avec formules et BibTeX. */
const props = defineProps({ article: { type: Object, default: null } })
const deck = inject('deck')
const router = useRouter()

const current = computed(() => props.article ?? articles[0] ?? null)
const proseClass = computed(() => `cd-prose cd-prose--${current.value?.category === 'security' ? 'security' : current.value?.category === 'industrial' ? 'industrial' : 'speech'}`)

function select(slug) {
  router.push({ name: 'article', params: { slug } })
}
async function copyBibtex() {
  if (!current.value) return
  const ok = await copyText(current.value.bibtex)
  deck.toast(ok ? 'Citation BibTeX copiée !' : 'Erreur lors de la copie')
}
</script>

<template>
  <section class="space-y-6">
    <div class="spatial-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-cyan-500/30 p-6">
      <div>
        <div class="font-mono text-xs text-cyan-400">// PUBLICATIONS &amp; NOTES DE RECHERCHE</div>
        <h2 class="font-syne text-2xl font-extrabold text-white sm:text-3xl">Monographies Techniques &amp; Modèles Mathématiques</h2>
      </div>
      <div class="flex gap-2 font-mono text-xs">
        <span class="rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-3 py-1.5 text-cyan-300">LaTeX / KaTeX Active</span>
        <button type="button" class="rounded-xl bg-white/10 px-3 py-1.5 font-bold text-white transition hover:bg-cyan-400 hover:text-slate-950" @click="copyBibtex">
          📋 Copier BibTeX
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <!-- Liste -->
      <div class="space-y-3.5 lg:col-span-5">
        <button
          v-for="a in articles"
          :key="a.slug"
          v-tilt
          type="button"
          class="spatial-panel tilt-card block w-full rounded-2xl p-5 text-left transition"
          :class="a.slug === current?.slug ? 'border-cyan-400 bg-cyan-500/10' : ''"
          @click="select(a.slug)"
        >
          <span class="mb-1.5 flex justify-between font-mono text-[10px] text-cyan-300">
            <span>{{ a.tag }}</span>
            <span>{{ dotDate(a.date) }}</span>
          </span>
          <h3 class="font-syne text-base font-bold text-white">{{ a.title }}</h3>
          <p class="mt-1.5 line-clamp-2 text-xs text-slate-400">{{ a.abstract }}</p>
        </button>
      </div>

      <!-- Lecteur -->
      <article v-if="current" class="spatial-panel space-y-6 rounded-3xl border border-cyan-500/30 p-7 sm:p-10 lg:col-span-7">
        <div class="border-b border-white/10 pb-5">
          <div class="mb-2 font-mono text-xs text-cyan-400">{{ current.tag }} // {{ dotDate(current.date) }}</div>
          <h2 class="font-syne text-2xl font-extrabold text-white sm:text-3xl">{{ current.title }}</h2>
          <p class="mt-2 text-xs italic text-slate-400">{{ current.abstract }}</p>
        </div>
        <div :class="proseClass" v-html="current.html" />
        <div class="rounded-2xl border border-white/10 bg-slate-950/90 p-4 font-mono text-[11px] text-slate-400">
          <div class="mb-1 flex items-center justify-between">
            <span class="font-bold text-cyan-300">// CITATION BIBTEX</span>
            <button type="button" class="text-cyan-300 transition hover:underline" @click="copyBibtex">Copier ⎘</button>
          </div>
          <pre class="overflow-x-auto whitespace-pre-wrap text-slate-300">{{ current.bibtex }}</pre>
        </div>
      </article>
    </div>
  </section>
</template>
