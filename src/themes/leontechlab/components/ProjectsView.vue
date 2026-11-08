<script setup>
import { computed, ref } from 'vue'
import { infrastructure, profile, repoCategories, repos, systems } from '../../../content/index.js'

/** Catalogue GitHub en listing de console, systèmes en service et nœuds de calcul. */
const cat = ref('all')
const shown = computed(() => (cat.value === 'all' ? repos : repos.filter((r) => r.cat === cat.value)))
const count = (id) => repos.filter((r) => r.cat === id).length

/** Teintes des contenus (emerald, sky, amber, purple) ramenées à la palette de la console */
const TONE = {
  emerald: 'border-leon-green/50 text-leon-green',
  sky: 'border-leon-cyan/50 text-leon-cyan',
  amber: 'border-leon-gold/50 text-leon-gold',
  purple: 'border-leon-magenta/50 text-leon-magenta',
}
</script>

<template>
  <div class="space-y-2">
    <section class="leon-panel">
      <h2 class="leon-panel-head leon-panel-head-wrap">
        Dépôts GitHub — @{{ profile.handle }} ({{ profile.githubRepoCount }})
      </h2>
      <div class="flex flex-wrap items-center gap-x-1 gap-y-0.5 px-2 py-1 text-[1.05rem]">
        <span class="text-leon-dim">Filtre&nbsp;:</span>
        <button type="button" class="leon-btn" :class="cat === 'all' ? 'leon-btn-on' : ''" @click="cat = 'all'">
          Tous ({{ repos.length }})
        </button>
        <button
          v-for="c in repoCategories"
          :key="c.id"
          type="button"
          class="leon-btn"
          :class="cat === c.id ? 'leon-btn-on' : ''"
          @click="cat = c.id"
        >
          {{ c.label }} ({{ count(c.id) }})
        </button>
      </div>

      <!-- En-tête de colonnes, à partir de la tablette -->
      <div
        class="hidden grid-cols-[minmax(0,1fr)_8.5rem_5rem] gap-2 border-y border-leon-green/40 px-3 py-0.5 text-[1rem] text-leon-dim sm:grid"
        aria-hidden="true"
      >
        <span>NOM</span><span>LANGAGE</span><span class="text-right">ACCÈS</span>
      </div>
      <ul class="divide-y divide-leon-green/25 border-t border-leon-green/40 sm:border-t-0">
        <li v-for="r in shown" :key="r.name">
          <a :href="r.url" target="_blank" rel="noopener noreferrer" class="group block px-3 py-2 transition-colors hover:bg-leon-green/10">
            <span class="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 sm:grid-cols-[minmax(0,1fr)_8.5rem_5rem]">
              <span class="truncate text-[1.25rem] text-leon-cyan group-hover:text-[#c8fbff]">
                <span class="text-leon-dim" aria-hidden="true">&gt;&gt; </span>{{ r.name }}
              </span>
              <span class="hidden text-[1.05rem] text-leon-gold sm:block">{{ r.lang }}</span>
              <span class="text-right text-[1.02rem]" :class="r.public ? 'text-leon-green' : 'text-leon-dim'">
                [{{ r.public ? 'public' : 'privé' }}]
              </span>
            </span>
            <span class="mt-0.5 block text-[1.08rem] leading-tight text-leon-ink/85">
              <span class="text-leon-gold sm:hidden">{{ r.lang }} — </span>{{ r.desc }}
            </span>
          </a>
        </li>
      </ul>
      <p class="border-t border-leon-green/40 px-3 py-1 text-[1rem] text-leon-dim">
        {{ shown.length }} dépôt(s) affiché(s). Les dépôts privés mènent au profil
        <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="text-leon-green hover:text-leon-bright">
          github.com/{{ profile.handle }}</a
        >.
      </p>
    </section>

    <section class="leon-panel">
      <h2 class="leon-panel-head">Systèmes en service</h2>
      <div class="grid grid-cols-1 gap-2 p-2 md:grid-cols-2">
        <article v-for="s in systems" :key="s.code" class="border p-2.5" :class="TONE[s.tone] ?? TONE.emerald">
          <p class="flex flex-wrap justify-between gap-x-2 text-[1rem]">
            <span>{{ s.code }}</span>
            <span>[{{ s.status }}]</span>
          </p>
          <h3 class="mt-1 text-[1.3rem] leading-tight text-leon-cyan">{{ s.title }}</h3>
          <p class="mt-1 text-[1.08rem] leading-tight text-leon-ink/85">{{ s.text }}</p>
          <ul class="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[1rem] text-leon-dim">
            <li v-for="tool in s.stack" :key="tool">[{{ tool }}]</li>
          </ul>
        </article>
      </div>
    </section>

    <section class="leon-panel">
      <h2 class="leon-panel-head">Nœuds de calcul</h2>
      <div class="grid grid-cols-1 gap-2 p-2 md:grid-cols-3">
        <article v-for="n in infrastructure" :key="n.node" class="border p-2.5" :class="TONE[n.tone] ?? TONE.emerald">
          <p class="text-[1rem]">{{ n.node }}</p>
          <p class="text-[1rem] text-leon-dim">[{{ n.status }}]</p>
          <h3 class="mt-1 text-[1.22rem] leading-tight text-leon-cyan">{{ n.title }}</h3>
          <p class="mt-1 text-[1.08rem] leading-tight text-leon-ink/85">{{ n.text }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
