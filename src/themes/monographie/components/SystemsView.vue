<script setup>
import { infrastructure, systems } from '../../../content/index.js'

const BADGES = {
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  purple: 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400',
}
const DOTS = {
  emerald: 'text-emerald-500',
  sky: 'text-sky-500',
  amber: 'text-amber-500',
  purple: 'text-purple-500',
}
</script>

<template>
  <section class="py-8">
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 class="font-serif text-2xl text-mono-ink sm:text-3xl">Systèmes Déployés, Modèles &amp; Pipelines</h2>
        <p class="mt-1 font-mono text-sm text-mono-muted">
          Briques logicielles, infrastructures auto-hébergées et corpus linguistiques en production.
        </p>
      </div>
      <div class="flex items-center gap-2 self-start rounded border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400 sm:self-auto">
        <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        <span>{{ systems.length }}/{{ systems.length }} SYSTÈMES OPÉRATIONNELS</span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div
        v-for="sys in systems"
        :key="sys.code"
        class="flex min-w-0 flex-col justify-between rounded-lg border border-mono-line bg-mono-surface/40 p-5 sm:p-6"
      >
        <div>
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-mono-muted">
            <span class="font-semibold text-mono-accent">{{ sys.code }}</span>
            <span class="rounded border px-2 py-0.5" :class="BADGES[sys.tone]">{{ sys.status }}</span>
          </div>
          <h3 class="font-serif text-xl font-medium text-mono-ink">{{ sys.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-mono-muted">{{ sys.text }}</p>
        </div>
        <div class="mt-6 flex flex-wrap gap-x-2 gap-y-1 border-t border-mono-line pt-4 font-mono text-[11px] text-mono-muted">
          <template v-for="(item, i) in sys.stack" :key="item">
            <span v-if="i">•</span><span>{{ item }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Topologie d'infrastructure -->
    <div class="mt-8 rounded-lg border border-mono-line bg-mono-panel/60 p-5 sm:p-6">
      <div class="mb-2 font-mono text-xs uppercase text-mono-accent">// Topologie d'infrastructure &amp; auto-hébergement</div>
      <h3 class="mb-4 font-serif text-xl text-mono-ink">Architecture des Nœuds de Calcul &amp; Pipelines</h3>
      <div class="grid grid-cols-1 gap-4 font-mono text-xs sm:grid-cols-3">
        <div v-for="node in infrastructure" :key="node.node" class="min-w-0 rounded border border-mono-line bg-mono-page p-4">
          <div class="mb-1 flex flex-wrap items-center justify-between gap-1 text-mono-muted">
            <span>{{ node.node }}</span>
            <span :class="DOTS[node.tone]">● {{ node.status }}</span>
          </div>
          <div class="font-semibold text-mono-ink">{{ node.title }}</div>
          <p class="mt-1.5 font-sans text-[11px] text-mono-muted">{{ node.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
