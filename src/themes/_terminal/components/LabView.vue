<script setup>
import { computed } from 'vue'
import { LAB_MODULES } from '../labs.js'
import LabSwarm from './LabSwarm.vue'
import LabPqc from './LabPqc.vue'
import LabOrbit from './LabOrbit.vue'

/** Laboratoire : un module actif à la fois. Les intitulés viennent de la peau. */
const props = defineProps({
  module: { type: String, default: 'mcp' },
  /** { mcp, pqc, hologram } — intitulés propres à la forme */
  labels: { type: Object, default: () => ({}) },
})

const COMPONENTS = { mcp: LabSwarm, pqc: LabPqc, hologram: LabOrbit }
const current = computed(() => COMPONENTS[props.module] ?? LabSwarm)
</script>

<template>
  <div class="space-y-6">
    <nav class="flex flex-wrap gap-3 border-b border-term-accent/30 pb-4" aria-label="Modules du laboratoire">
      <RouterLink
        v-for="m in LAB_MODULES"
        :key="m.id"
        :to="{ name: 'lab', params: { module: m.id } }"
        class="term-btn"
        :class="m.id === module ? 'term-btn-on' : ''"
        :aria-current="m.id === module ? 'page' : undefined"
      >
        [{{ m.code }}] {{ labels[m.id] ?? m.tab }}
      </RouterLink>
    </nav>

    <component :is="current" />
  </div>
</template>
