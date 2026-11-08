<script setup>
import { profile } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'

/** [LOG 04] — Briefing de mission : exposé, journal de bord, domaines. */
const { about, domains, links, handle } = profile
</script>

<template>
  <div class="space-y-8">
    <!-- Briefing -->
    <section class="ms-card p-6 sm:p-10">
      <div class="font-techmono text-xs text-orange-400">{{ about.kicker }}</div>
      <h2 class="mt-3 font-orbitron text-2xl font-bold leading-tight text-white sm:text-3xl">{{ about.title }}</h2>
      <p class="mt-5 max-w-3xl font-grotesk text-[0.95rem] leading-relaxed text-slate-300">{{ about.text }}</p>

      <div class="mt-8 border-t border-orange-500/30 pt-6">
        <div class="font-orbitron text-sm font-bold text-orange-400">// DOMAINES CLÉS DE RECHERCHE</div>
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RouterLink
            v-for="d in domains"
            :key="d.id"
            :to="d.to"
            class="ms-card block space-y-2 p-5"
          >
            <span class="block font-techmono text-[0.68rem] font-bold text-amber-400">{{ d.tag }}</span>
            <span class="block font-grotesk text-base font-bold text-white">{{ d.title }}</span>
            <RichText tag="span" class="block font-grotesk text-xs leading-relaxed text-slate-400" :text="d.text" />
            <span class="block font-techmono text-[0.66rem] text-orange-400">{{ d.cta }} →</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Journal de bord -->
    <section class="ms-card p-6 sm:p-10">
      <h3 class="font-orbitron text-lg font-bold text-white">JOURNAL DE BORD</h3>
      <ol class="mt-5 space-y-0">
        <li
          v-for="(step, i) in about.timeline"
          :key="step.role"
          class="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-orange-500/20 py-5 first:border-t-0 first:pt-0 sm:grid-cols-[11rem_1fr]"
        >
          <div class="font-techmono text-xs">
            <div class="text-slate-500">T-{{ String(about.timeline.length - i).padStart(2, '0') }}</div>
            <div class="mt-0.5 text-orange-300">{{ step.period }}</div>
            <div v-if="step.current" class="mt-1 flex items-center gap-1.5 text-emerald-400">
              <span class="h-1.5 w-1.5 bg-emerald-400" />EN COURS
            </div>
          </div>
          <div class="min-w-0">
            <h4 class="font-grotesk text-base font-bold text-white">{{ step.role }}</h4>
            <RichText tag="p" class="mt-1.5 font-grotesk text-sm leading-relaxed text-slate-400" :text="step.text" />
          </div>
        </li>
      </ol>
    </section>

    <!-- Liaison -->
    <section class="ms-card p-6 sm:p-10">
      <h3 class="font-orbitron text-lg font-bold text-white">LIAISON</h3>
      <div class="mt-5 grid grid-cols-1 gap-4 font-techmono text-xs sm:grid-cols-3">
        <a :href="links.github" target="_blank" rel="noopener noreferrer" class="border border-orange-500/30 bg-black/60 p-4 hover:border-orange-500">
          <span class="block text-[0.62rem] uppercase tracking-wider text-slate-500">Dépôt</span>
          <span class="mt-1 block text-orange-300">github.com/{{ handle }} ↗</span>
        </a>
        <a :href="links.linkedin" target="_blank" rel="noopener noreferrer" class="border border-orange-500/30 bg-black/60 p-4 hover:border-orange-500">
          <span class="block text-[0.62rem] uppercase tracking-wider text-slate-500">Réseau</span>
          <span class="mt-1 block text-orange-300">linkedin.com/in/husary ↗</span>
        </a>
        <a :href="`mailto:${links.email}`" class="border border-orange-500/30 bg-black/60 p-4 hover:border-orange-500">
          <span class="block text-[0.62rem] uppercase tracking-wider text-slate-500">Contact</span>
          <span class="mt-1 block break-all text-orange-300">{{ links.email }}</span>
        </a>
      </div>
    </section>
  </div>
</template>
