<script setup>
import { computed, ref } from 'vue'
import { infrastructure, repoCategories, repos, systems } from '../../../content/index.js'

/**
 * Artefacts et clusters, présentés comme la nomenclature d'un plan :
 * une table des pièces numérotée, puis les ensembles et les nœuds de calcul.
 */
const cat = ref('all')
const shown = computed(() => (cat.value === 'all' ? repos : repos.filter((r) => r.cat === cat.value)))
const label = (id) => repoCategories.find((c) => c.id === id)?.label ?? id
</script>

<template>
  <div class="space-y-12">
    <!-- Nomenclature -->
    <section>
      <div class="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-pl-rule pb-2">
        <h2 class="font-archivo text-sm font-bold uppercase tracking-wide text-pl-ink">Nomenclature des dépôts</h2>
        <span class="pl-meta">{{ shown.length }} pièces</span>
      </div>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <button type="button" class="pl-btn" :class="cat === 'all' ? 'pl-btn-on' : ''" @click="cat = 'all'">Tout</button>
        <button
          v-for="c in repoCategories"
          :key="c.id"
          type="button"
          class="pl-btn"
          :class="cat === c.id ? 'pl-btn-on' : ''"
          @click="cat = c.id"
        >
          {{ c.label }}
        </button>
      </div>

      <!-- Table des pièces -->
      <div class="mt-4 overflow-x-auto border border-pl-rule/35">
        <table class="w-full min-w-[42rem] border-collapse text-left">
          <thead>
            <tr class="border-b-2 border-pl-rule">
              <th scope="col" class="pl-meta px-3 py-2 font-normal">Rep.</th>
              <th scope="col" class="pl-meta px-3 py-2 font-normal">Désignation</th>
              <th scope="col" class="pl-meta px-3 py-2 font-normal">Objet</th>
              <th scope="col" class="pl-meta px-3 py-2 font-normal">Langage</th>
              <th scope="col" class="pl-meta px-3 py-2 font-normal">État</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in shown" :key="r.name" class="border-b border-pl-rule/25 align-top last:border-b-0 hover:bg-pl-surface">
              <td class="px-3 py-2.5 font-plexmono text-[0.68rem] tabular-nums text-pl-muted">{{ String(i + 1).padStart(2, '0') }}</td>
              <td class="px-3 py-2.5">
                <a
                  :href="r.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-plexmono text-[0.8rem] font-semibold text-pl-ink underline decoration-pl-rule/40 underline-offset-2 hover:text-pl-blue hover:decoration-pl-blue"
                >
                  {{ r.name }}
                </a>
                <span class="pl-meta mt-0.5 block normal-case tracking-normal">{{ label(r.cat) }}</span>
              </td>
              <td class="max-w-[22rem] px-3 py-2.5 font-plex text-[0.8rem] leading-snug text-pl-muted">{{ r.desc }}</td>
              <td class="whitespace-nowrap px-3 py-2.5 font-plexmono text-[0.7rem] text-pl-ink">{{ r.lang }}</td>
              <td class="whitespace-nowrap px-3 py-2.5">
                <span
                  class="border px-1.5 py-0.5 font-plexmono text-[0.6rem] uppercase tracking-wider"
                  :class="r.public ? 'border-pl-blue/50 text-pl-blue' : 'border-pl-rule/35 text-pl-muted'"
                >
                  {{ r.public ? 'Public' : 'Privé' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="pl-annot pl-mark mt-2">▸ Les pièces privées renvoient au profil : le dépôt n'est pas publiable en l'état.</p>
    </section>

    <!-- Ensembles en production -->
    <section>
      <h2 class="border-b-2 border-pl-rule pb-2 font-archivo text-sm font-bold uppercase tracking-wide text-pl-ink">
        Ensembles en service
      </h2>
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article v-for="s in systems" :key="s.code" class="pl-sheet p-4 sm:p-5">
          <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-pl-rule/35 pb-2">
            <span class="pl-meta">{{ s.code }}</span>
            <span class="pl-meta text-pl-blue">{{ s.status }}</span>
          </div>
          <h3 class="pl-sheet-title mt-3">{{ s.title }}</h3>
          <p class="mt-2 font-plex text-[0.84rem] leading-relaxed text-pl-muted">{{ s.text }}</p>
          <ul class="mt-3 flex flex-wrap gap-1.5">
            <li v-for="tool in s.stack" :key="tool" class="border border-pl-rule/30 px-1.5 py-0.5 font-plexmono text-[0.62rem] text-pl-ink/75">
              {{ tool }}
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- Nœuds -->
    <section>
      <h2 class="border-b-2 border-pl-rule pb-2 font-archivo text-sm font-bold uppercase tracking-wide text-pl-ink">
        Nœuds de calcul &amp; bancs d'essai
      </h2>
      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article v-for="n in infrastructure" :key="n.node" class="pl-sheet p-4">
          <div class="pl-meta">{{ n.node }}</div>
          <div class="pl-meta mt-0.5 text-pl-blue">{{ n.status }}</div>
          <h3 class="pl-sheet-title mt-3 text-[0.95rem]">{{ n.title }}</h3>
          <p class="mt-2 font-plex text-[0.8rem] leading-relaxed text-pl-muted">{{ n.text }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
