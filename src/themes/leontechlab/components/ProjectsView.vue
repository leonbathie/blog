<script setup>
import { computed, ref } from 'vue'
import { infrastructure, profile, repoCategories, repos, systems } from '../../../content/index.js'

/** Catalogue GitHub et systèmes en service. */
const cat = ref('all')
const shown = computed(() => (cat.value === 'all' ? repos : repos.filter((r) => r.cat === cat.value)))
const count = (id) => repos.filter((r) => r.cat === id).length
</script>

<template>
  <div class="space-y-4">
    <section class="leon-box p-3 sm:p-4">
      <h2 class="leon-box-header font-silk text-[0.72rem]">
        Catalogue GitHub (@{{ profile.handle }} — {{ profile.githubRepoCount }} dépôts)
      </h2>

      <div class="mb-3 flex flex-wrap gap-2 text-[0.7rem]">
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

      <ul class="divide-y divide-leon-green/20 border border-leon-green/25">
        <li v-for="r in shown" :key="r.name" class="p-2.5 transition-colors hover:bg-leon-green/5 sm:p-3">
          <a :href="r.url" target="_blank" rel="noopener noreferrer" class="group block">
            <span class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="font-silk text-[0.7rem] text-leon-green group-hover:text-leon-bright">{{ r.name }}</span>
              <span class="flex items-center gap-2 text-[0.62rem] text-leon-dim">
                <span>{{ r.lang }}</span>
                <span
                  class="border px-1.5 py-0.5"
                  :class="r.public ? 'border-leon-green/50 text-leon-green' : 'border-leon-dim/50 text-leon-dim'"
                >
                  {{ r.public ? 'public' : 'privé' }}
                </span>
              </span>
            </span>
            <span class="mt-1 block text-[0.72rem] leading-relaxed text-leon-ink/70">{{ r.desc }}</span>
          </a>
        </li>
      </ul>
    </section>

    <section class="leon-box p-3 sm:p-4">
      <h2 class="leon-box-header font-silk text-[0.72rem]">Systèmes en service</h2>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <article v-for="s in systems" :key="s.code" class="border border-leon-green/25 bg-leon-bg/60 p-3">
          <div class="flex flex-wrap justify-between gap-2 text-[0.62rem]">
            <span class="text-leon-gold">{{ s.code }}</span>
            <span class="text-leon-dim">[{{ s.status }}]</span>
          </div>
          <h3 class="mt-2 font-silk text-[0.68rem] leading-relaxed text-leon-green">{{ s.title }}</h3>
          <p class="mt-1.5 text-[0.72rem] leading-relaxed text-leon-ink/70">{{ s.text }}</p>
          <ul class="mt-2 flex flex-wrap gap-1">
            <li v-for="tool in s.stack" :key="tool" class="border border-leon-green/25 px-1.5 py-0.5 text-[0.58rem] text-leon-dim">
              {{ tool }}
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section class="leon-box p-3 sm:p-4">
      <h2 class="leon-box-header font-silk text-[0.72rem]">Nœuds de calcul</h2>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article v-for="n in infrastructure" :key="n.node" class="border border-leon-green/25 bg-leon-bg/60 p-3">
          <div class="text-[0.6rem] text-leon-gold">{{ n.node }}</div>
          <div class="text-[0.58rem] text-leon-dim">[{{ n.status }}]</div>
          <h3 class="mt-2 font-silk text-[0.64rem] leading-relaxed text-leon-green">{{ n.title }}</h3>
          <p class="mt-1.5 text-[0.7rem] leading-relaxed text-leon-ink/70">{{ n.text }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
