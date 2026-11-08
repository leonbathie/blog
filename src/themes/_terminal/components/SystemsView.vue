<script setup>
import { computed, ref } from 'vue'
import { infrastructure, profile, repoCategories, repos, systems } from '../../../content/index.js'

/** [LOG 02] — Répertoire des systèmes, dépôts et nœuds. */
const TONES = {
  emerald: { border: 'border-l-term-ok', text: 'text-term-ok' },
  sky: { border: 'border-l-term-info', text: 'text-term-info' },
  amber: { border: 'border-l-term-accent2', text: 'text-term-accent2' },
  purple: { border: 'border-l-term-extra', text: 'text-term-extra' },
}
const tone = (name) => TONES[name] ?? TONES.amber

const cat = ref('all')
const shown = computed(() => (cat.value === 'all' ? repos : repos.filter((r) => r.cat === cat.value)))
</script>

<template>
  <div class="space-y-12">
    <!-- Systèmes -->
    <section class="space-y-6">
      <div class="border-b border-term-accent/30 pb-4">
        <h2 class="font-term-display text-2xl font-bold text-term-head sm:text-3xl">
          Répertoire des systèmes &amp; GitHub <span class="text-term-accent">(@{{ profile.handle }})</span>
        </h2>
        <p class="mt-1 font-term-mono text-xs text-term-dim">
          Modules logiciels, protocoles de défense et ensembles en service.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article v-for="s in systems" :key="s.code" class="term-card space-y-4 border-l-4 p-6" :class="tone(s.tone).border">
          <div class="flex flex-wrap justify-between gap-2 font-term-mono text-xs text-term-dim">
            <span class="font-bold" :class="tone(s.tone).text">{{ s.code }}</span>
            <span>[{{ s.status }}]</span>
          </div>
          <h3 class="font-term-body text-lg font-bold text-term-head">{{ s.title }}</h3>
          <p class="font-term-body text-sm leading-relaxed text-term-dim">{{ s.text }}</p>
          <ul class="flex flex-wrap gap-1.5">
            <li
              v-for="t in s.stack"
              :key="t"
              class="border border-term-accent/25 bg-term-void/60 px-2 py-0.5 font-term-mono text-[0.62rem] text-term-dim"
            >
              {{ t }}
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- Dépôts -->
    <section class="space-y-5">
      <div class="flex flex-wrap items-center gap-2 border-b border-term-accent/30 pb-4 font-term-mono text-xs">
        <h2 class="mr-auto font-term-display text-lg font-bold text-term-head">ARTEFACTS SWARM</h2>
        <button type="button" class="term-btn px-3 py-1.5" :class="cat === 'all' ? 'term-btn-on' : ''" @click="cat = 'all'">
          TOUS
        </button>
        <button
          v-for="c in repoCategories"
          :key="c.id"
          type="button"
          class="term-btn px-3 py-1.5"
          :class="cat === c.id ? 'term-btn-on' : ''"
          @click="cat = c.id"
        >
          {{ c.label.toUpperCase() }}
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          v-for="r in shown"
          :key="r.name"
          :href="r.url"
          target="_blank"
          rel="noopener noreferrer"
          class="term-card block space-y-2 p-5"
        >
          <span class="flex items-center justify-between gap-2 font-term-mono text-[0.68rem]">
            <span class="font-bold text-term-accent">{{ r.name }}</span>
            <span
              class="shrink-0 border px-1.5 py-0.5 text-[0.58rem] uppercase tracking-wider"
              :class="r.public ? 'border-term-ok/40 text-term-ok' : 'border-term-faint text-term-faint'"
            >
              {{ r.public ? 'public' : 'privé' }}
            </span>
          </span>
          <span class="block font-term-body text-xs leading-relaxed text-term-dim">{{ r.desc }}</span>
          <span class="block font-term-mono text-[0.62rem] text-term-faint">{{ r.lang }} ↗</span>
        </a>
      </div>
    </section>

    <!-- Nœuds -->
    <section class="space-y-5">
      <h2 class="border-b border-term-accent/30 pb-4 font-term-display text-lg font-bold text-term-head">
        NŒUDS DE CALCUL &amp; BANCS D'ESSAI
      </h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article v-for="n in infrastructure" :key="n.node" class="term-card space-y-2 border-l-4 p-5" :class="tone(n.tone).border">
          <div class="font-term-mono text-[0.68rem] font-bold" :class="tone(n.tone).text">{{ n.node }}</div>
          <div class="font-term-mono text-[0.62rem] text-term-faint">[{{ n.status }}]</div>
          <h3 class="font-term-body text-base font-bold text-term-head">{{ n.title }}</h3>
          <p class="font-term-body text-xs leading-relaxed text-term-dim">{{ n.text }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
