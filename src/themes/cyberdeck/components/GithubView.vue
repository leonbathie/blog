<script setup>
import { computed, inject, ref } from 'vue'
import { profile, repoCategories, repos } from '../../../content/index.js'
import { vTilt } from '../tilt.js'

/** Espace 03 — GitHub : grille filtrable des dépôts de @leonbathie. */
const deck = inject('deck')
const filter = ref('all')

const filters = [
  { id: 'all', label: `TOUS (${repos.length})`, active: 'bg-cyan-400 text-slate-950', idle: 'bg-white/5 text-slate-300 border-white/10' },
  { id: 'sec', label: 'CYBERSÉCURITÉ', active: 'bg-rose-400 text-slate-950', idle: 'bg-white/5 text-rose-300 border-rose-500/30' },
  { id: 'key', label: 'CLAVIERS AFRICAINS', active: 'bg-cyan-400 text-slate-950', idle: 'bg-white/5 text-cyan-300 border-cyan-500/30' },
  { id: 'ai', label: 'IA, VISION & WEB', active: 'bg-violet-400 text-slate-950', idle: 'bg-white/5 text-violet-300 border-violet-500/30' },
]
const BADGES = {
  sec: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  key: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  ai: 'text-violet-300 border-violet-500/30 bg-violet-500/10',
}

const visible = computed(() => (filter.value === 'all' ? repos : repos.filter((r) => r.cat === filter.value)))

function setFilter(id) {
  filter.value = id
  deck.synth(740, 0.04)
}
</script>

<template>
  <section class="space-y-6">
    <div class="spatial-panel flex flex-col justify-between gap-4 rounded-3xl border border-cyan-500/30 p-6 md:flex-row md:items-center">
      <div>
        <div class="font-mono text-xs text-emerald-400">// DÉPÔTS GITHUB OFFICIELS • @{{ profile.handle }}</div>
        <h2 class="font-syne text-2xl font-extrabold text-white sm:text-3xl">Architecture Logicielle &amp; Projets Souverains</h2>
      </div>
      <div class="flex flex-wrap gap-2 font-mono text-xs">
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          class="rounded-xl border px-3.5 py-1.5 transition"
          :class="filter === f.id ? `${f.active} font-bold border-transparent` : `${f.idle} hover:bg-white/10`"
          @click="setFilter(f.id)"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="repo in visible" :key="repo.name" v-tilt class="spatial-panel tilt-card flex flex-col justify-between rounded-3xl border border-white/10 p-6">
        <div class="tilt-content space-y-3">
          <div class="flex items-center justify-between font-mono text-[11px]">
            <span class="rounded-md border px-2.5 py-0.5" :class="BADGES[repo.cat]">{{ repo.lang }}</span>
            <span class="text-slate-400">{{ repo.public ? 'Public' : 'Private' }}</span>
          </div>
          <h3 class="flex items-center gap-2 font-syne text-lg font-bold text-white">
            <span aria-hidden="true">📦</span><span>{{ repo.name }}</span>
          </h3>
          <p class="text-xs leading-relaxed text-slate-300">{{ repo.desc }}</p>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[11px] text-cyan-300">
          <span>github.com/{{ profile.handle }}</span>
          <a :href="repo.url" target="_blank" rel="noopener noreferrer" class="transition hover:underline">Inspecter ↗</a>
        </div>
      </div>
    </div>
  </section>
</template>
