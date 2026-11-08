<script setup>
import { computed } from 'vue'
import { LAB_MODULES } from '../labs.js'
import LabWeibull from './LabWeibull.vue'
import LabPulaar from './LabPulaar.vue'
import LabGlitch from './LabGlitch.vue'

/** Jeu de planches du laboratoire : une planche active à la fois. */
const props = defineProps({
  module: { type: String, default: 'weibull' },
})

const COMPONENTS = { weibull: LabWeibull, pulaar: LabPulaar, glitch: LabGlitch }
const current = computed(() => COMPONENTS[props.module] ?? LabWeibull)
const active = computed(() => LAB_MODULES.find((m) => m.id === props.module) ?? LAB_MODULES[0])
</script>

<template>
  <div>
    <div class="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-pl-rule pb-2">
      <h2 class="font-archivo text-sm font-bold uppercase tracking-wide text-pl-ink">Laboratoire — jeu de planches</h2>
      <span class="pl-meta">{{ active.code }} · {{ LAB_MODULES.length }} planches</span>
    </div>

    <!-- Onglets de planche -->
    <nav class="mt-4 flex flex-wrap gap-1 border-b-2 border-pl-rule" aria-label="Planches du laboratoire">
      <RouterLink
        v-for="m in LAB_MODULES"
        :key="m.id"
        :to="{ name: 'lab', params: { module: m.id } }"
        class="pl-tab"
        :class="m.id === module ? 'pl-tab-on' : ''"
        :aria-current="m.id === module ? 'page' : undefined"
      >
        <span class="tabular-nums opacity-70">{{ m.code }}</span>
        <span>{{ m.tab }}</span>
      </RouterLink>
    </nav>

    <div class="mt-6">
      <component :is="current" />
    </div>
  </div>
</template>
