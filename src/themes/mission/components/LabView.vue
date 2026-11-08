<script setup>
import { computed } from 'vue'
import { LAB_MODULES } from '../labs.js'
import LabSwarm from './LabSwarm.vue'
import LabPqc from './LabPqc.vue'
import LabOrbit from './LabOrbit.vue'

/** [LOG 03] — Labo orbital : un module actif à la fois. */
const props = defineProps({
  module: { type: String, default: 'mcp' },
})

const COMPONENTS = { mcp: LabSwarm, pqc: LabPqc, hologram: LabOrbit }
const current = computed(() => COMPONENTS[props.module] ?? LabSwarm)
</script>

<template>
  <div class="space-y-6">
    <nav class="flex flex-wrap gap-3 border-b border-orange-500/30 pb-4" aria-label="Modules du labo orbital">
      <RouterLink
        v-for="m in LAB_MODULES"
        :key="m.id"
        :to="{ name: 'lab', params: { module: m.id } }"
        class="ms-btn"
        :class="m.id === module ? 'ms-btn-on' : ''"
        :aria-current="m.id === module ? 'page' : undefined"
      >
        [{{ m.code }}] {{ m.tab }}
      </RouterLink>
    </nav>

    <component :is="current" />
  </div>
</template>
