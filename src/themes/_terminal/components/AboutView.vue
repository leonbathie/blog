<script setup>
import { profile } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'

/** [LOG 04] — Briefing de mission : exposé, journal de bord, domaines. */
const { about, domains, links, handle } = profile
</script>

<template>
  <div class="space-y-8">
    <!-- Briefing -->
    <section class="term-card p-6 sm:p-10">
      <div class="font-term-mono text-xs text-term-accent">{{ about.kicker }}</div>
      <h2 class="mt-3 font-term-display text-2xl font-bold leading-tight text-term-head sm:text-3xl">{{ about.title }}</h2>
      <p class="mt-5 max-w-3xl font-term-body text-[0.95rem] leading-relaxed text-term-dim">{{ about.text }}</p>

      <div class="mt-8 border-t border-term-accent/30 pt-6">
        <div class="font-term-display text-sm font-bold text-term-accent">// DOMAINES CLÉS DE RECHERCHE</div>
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RouterLink
            v-for="d in domains"
            :key="d.id"
            :to="d.to"
            class="term-card block space-y-2 p-5"
          >
            <span class="block font-term-mono text-[0.68rem] font-bold text-term-accent2">{{ d.tag }}</span>
            <span class="block font-term-body text-base font-bold text-term-head">{{ d.title }}</span>
            <RichText tag="span" class="block font-term-body text-xs leading-relaxed text-term-dim" :text="d.text" />
            <span class="block font-term-mono text-[0.66rem] text-term-accent">{{ d.cta }} →</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Journal de bord -->
    <section class="term-card p-6 sm:p-10">
      <h3 class="font-term-display text-lg font-bold text-term-head">JOURNAL DE BORD</h3>
      <ol class="mt-5 space-y-0">
        <li
          v-for="(step, i) in about.timeline"
          :key="step.role"
          class="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-term-accent/20 py-5 first:border-t-0 first:pt-0 sm:grid-cols-[11rem_1fr]"
        >
          <div class="font-term-mono text-xs">
            <div class="text-term-faint">T-{{ String(about.timeline.length - i).padStart(2, '0') }}</div>
            <div class="mt-0.5 text-term-accent-lt">{{ step.period }}</div>
            <div v-if="step.current" class="mt-1 flex items-center gap-1.5 text-term-ok">
              <span class="h-1.5 w-1.5 bg-term-ok" />EN COURS
            </div>
          </div>
          <div class="min-w-0">
            <h4 class="font-term-body text-base font-bold text-term-head">{{ step.role }}</h4>
            <RichText tag="p" class="mt-1.5 font-term-body text-sm leading-relaxed text-term-dim" :text="step.text" />
          </div>
        </li>
      </ol>
    </section>

    <!-- Liaison -->
    <section class="term-card p-6 sm:p-10">
      <h3 class="font-term-display text-lg font-bold text-term-head">LIAISON</h3>
      <div class="mt-5 grid grid-cols-1 gap-4 font-term-mono text-xs sm:grid-cols-3">
        <a :href="links.github" target="_blank" rel="noopener noreferrer" class="border border-term-accent/30 bg-term-void/60 p-4 hover:border-term-accent">
          <span class="block text-[0.62rem] uppercase tracking-wider text-term-faint">Dépôt</span>
          <span class="mt-1 block text-term-accent-lt">github.com/{{ handle }} ↗</span>
        </a>
        <a :href="links.linkedin" target="_blank" rel="noopener noreferrer" class="border border-term-accent/30 bg-term-void/60 p-4 hover:border-term-accent">
          <span class="block text-[0.62rem] uppercase tracking-wider text-term-faint">Réseau</span>
          <span class="mt-1 block text-term-accent-lt">linkedin.com/in/husary ↗</span>
        </a>
        <a :href="`mailto:${links.email}`" class="border border-term-accent/30 bg-term-void/60 p-4 hover:border-term-accent">
          <span class="block text-[0.62rem] uppercase tracking-wider text-term-faint">Contact</span>
          <span class="mt-1 block break-all text-term-accent-lt">{{ links.email }}</span>
        </a>
      </div>
    </section>
  </div>
</template>
