<script setup>
import { LAB_MODULES } from '../labs.js'
import LabWeibull from './LabWeibull.vue'
import LabPulaar from './LabPulaar.vue'
import LabGlitch from './LabGlitch.vue'

defineProps({ module: { type: String, default: 'weibull' } })
</script>

<template>
  <section class="space-y-6 py-8">
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-mono-line bg-mono-surface/70 p-3 font-mono text-xs">
      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <RouterLink
          v-for="m in LAB_MODULES"
          :key="m.id"
          :to="{ name: 'lab', params: { module: m.id } }"
          class="min-h-[2.5rem] rounded px-3 py-2 transition sm:min-h-0 sm:py-1.5"
          :class="module === m.id ? 'bg-mono-accent font-medium text-white dark:text-zinc-950' : 'text-mono-ink/80 hover:bg-mono-page'"
          :aria-current="module === m.id ? 'page' : undefined"
        >
          {{ m.tab }}
        </RouterLink>
      </div>
      <span class="hidden text-[11px] text-mono-muted sm:inline">SIMULATION TEMPS RÉEL DANS LE NAVIGATEUR</span>
    </div>

    <LabWeibull v-show="module === 'weibull'" />
    <LabPulaar v-show="module === 'pulaar'" />
    <LabGlitch v-show="module === 'glitch'" />
  </section>
</template>
