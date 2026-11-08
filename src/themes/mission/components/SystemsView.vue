<script setup>
import { computed, ref } from 'vue'
import { infrastructure, profile, repoCategories, repos, systems } from '../../../content/index.js'

/** [LOG 02] — Répertoire des systèmes, dépôts et nœuds. */
const TONES = {
  emerald: { border: 'border-l-emerald-400', text: 'text-emerald-400' },
  sky: { border: 'border-l-sky-400', text: 'text-sky-400' },
  amber: { border: 'border-l-amber-400', text: 'text-amber-400' },
  purple: { border: 'border-l-violet-400', text: 'text-violet-400' },
}
const tone = (name) => TONES[name] ?? TONES.amber

const cat = ref('all')
const shown = computed(() => (cat.value === 'all' ? repos : repos.filter((r) => r.cat === cat.value)))
</script>

<template>
  <div class="space-y-12">
    <!-- Systèmes -->
    <section class="space-y-6">
      <div class="border-b border-orange-500/30 pb-4">
        <h2 class="font-orbitron text-2xl font-bold text-white sm:text-3xl">
          Répertoire des systèmes &amp; GitHub <span class="text-orange-400">(@{{ profile.handle }})</span>
        </h2>
        <p class="mt-1 font-techmono text-xs text-slate-400">
          Modules logiciels, protocoles de défense et ensembles en service.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article v-for="s in systems" :key="s.code" class="ms-card space-y-4 border-l-4 p-6" :class="tone(s.tone).border">
          <div class="flex flex-wrap justify-between gap-2 font-techmono text-xs text-slate-400">
            <span class="font-bold" :class="tone(s.tone).text">{{ s.code }}</span>
            <span>[{{ s.status }}]</span>
          </div>
          <h3 class="font-grotesk text-lg font-bold text-white">{{ s.title }}</h3>
          <p class="font-grotesk text-sm leading-relaxed text-slate-300">{{ s.text }}</p>
          <ul class="flex flex-wrap gap-1.5">
            <li
              v-for="t in s.stack"
              :key="t"
              class="border border-orange-500/25 bg-black/60 px-2 py-0.5 font-techmono text-[0.62rem] text-slate-400"
            >
              {{ t }}
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- Dépôts -->
    <section class="space-y-5">
      <div class="flex flex-wrap items-center gap-2 border-b border-orange-500/30 pb-4 font-techmono text-xs">
        <h2 class="mr-auto font-orbitron text-lg font-bold text-white">ARTEFACTS SWARM</h2>
        <button type="button" class="ms-btn px-3 py-1.5" :class="cat === 'all' ? 'ms-btn-on' : ''" @click="cat = 'all'">
          TOUS
        </button>
        <button
          v-for="c in repoCategories"
          :key="c.id"
          type="button"
          class="ms-btn px-3 py-1.5"
          :class="cat === c.id ? 'ms-btn-on' : ''"
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
          class="ms-card block space-y-2 p-5"
        >
          <span class="flex items-center justify-between gap-2 font-techmono text-[0.68rem]">
            <span class="font-bold text-orange-400">{{ r.name }}</span>
            <span
              class="shrink-0 border px-1.5 py-0.5 text-[0.58rem] uppercase tracking-wider"
              :class="r.public ? 'border-emerald-400/40 text-emerald-300' : 'border-slate-600 text-slate-500'"
            >
              {{ r.public ? 'public' : 'privé' }}
            </span>
          </span>
          <span class="block font-grotesk text-xs leading-relaxed text-slate-400">{{ r.desc }}</span>
          <span class="block font-techmono text-[0.62rem] text-slate-500">{{ r.lang }} ↗</span>
        </a>
      </div>
    </section>

    <!-- Nœuds -->
    <section class="space-y-5">
      <h2 class="border-b border-orange-500/30 pb-4 font-orbitron text-lg font-bold text-white">
        NŒUDS DE CALCUL &amp; BANCS D'ESSAI
      </h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article v-for="n in infrastructure" :key="n.node" class="ms-card space-y-2 border-l-4 p-5" :class="tone(n.tone).border">
          <div class="font-techmono text-[0.68rem] font-bold" :class="tone(n.tone).text">{{ n.node }}</div>
          <div class="font-techmono text-[0.62rem] text-slate-500">[{{ n.status }}]</div>
          <h3 class="font-grotesk text-base font-bold text-white">{{ n.title }}</h3>
          <p class="font-grotesk text-xs leading-relaxed text-slate-400">{{ n.text }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
