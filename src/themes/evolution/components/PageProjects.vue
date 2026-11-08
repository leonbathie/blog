<script setup>
import { computed } from 'vue'
import { contentIn } from '../../../content/index.js'
import { LABELS } from '../eras.js'

/** Dépôts en tableau, systèmes et nœuds en cartes. */
const props = defineProps({ era: { type: Object, required: true } })
const L = computed(() => LABELS[props.era.lang])
const C = computed(() => contentIn(props.era.lang))
const profile = computed(() => C.value.profile)
const repos = computed(() => C.value.repos)
const systems = computed(() => C.value.systems)
const infrastructure = computed(() => C.value.infrastructure)
const catLabel = (id) => C.value.repoCategories.find((c) => c.id === id)?.label ?? id
</script>

<template>
  <div class="p-4 sm:p-6">
    <h1 class="era-h1 text-2xl font-bold">{{ L.repos }} <span class="era-muted text-base font-normal">— github.com/{{ profile.handle }}</span></h1>
    <div class="mt-3 overflow-x-auto">
      <table class="era-table">
        <thead>
          <tr>
            <th>Repo</th>
            <th>{{ L.language }}</th>
            <th>{{ L.access }}</th>
            <th class="hidden sm:table-cell">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in repos" :key="r.name">
            <td>
              <a :href="r.url" target="_blank" rel="noopener noreferrer" class="era-link font-bold">{{ r.name }}</a>
              <span class="era-muted block text-[0.75rem]">{{ catLabel(r.cat) }}</span>
            </td>
            <td>{{ r.lang }}</td>
            <td>{{ r.public ? L.public : L.private }}</td>
            <td class="hidden sm:table-cell">{{ r.desc }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 class="era-h1 mt-8 text-xl font-bold">{{ L.systems }}</h2>
    <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      <article v-for="s in systems" :key="s.code" class="era-panel p-3">
        <p class="era-muted text-[0.75rem]" style="font-family: var(--era-mono)">{{ s.code }} · {{ s.status }}</p>
        <h3 class="era-h2 mt-1 text-[1rem]">{{ s.title }}</h3>
        <p class="mt-1 text-[0.88rem] leading-snug">{{ s.text }}</p>
        <p class="mt-2 flex flex-wrap gap-1"><span v-for="tool in s.stack" :key="tool" class="era-chip">{{ tool }}</span></p>
      </article>
    </div>

    <h2 class="era-h1 mt-8 text-xl font-bold">{{ L.nodes }}</h2>
    <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
      <article v-for="n in infrastructure" :key="n.node" class="era-panel p-3">
        <p class="era-muted text-[0.75rem]" style="font-family: var(--era-mono)">{{ n.node }} · {{ n.status }}</p>
        <h3 class="era-h2 mt-1 text-[0.98rem]">{{ n.title }}</h3>
        <p class="mt-1 text-[0.88rem] leading-snug">{{ n.text }}</p>
      </article>
    </div>
  </div>
</template>
