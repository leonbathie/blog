<script setup>
import { profile } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'

/** Notice du dossier : exposé puis chronologie, lue comme un cartouche de révisions. */
const { about, domains, links, handle } = profile
</script>

<template>
  <div class="space-y-12">
    <!-- Exposé -->
    <section class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div class="lg:col-span-7">
        <div class="pl-meta">{{ about.kicker }}</div>
        <h2 class="mt-2 font-archivo text-2xl font-extrabold uppercase leading-[1.1] tracking-tight text-pl-ink sm:text-3xl">
          {{ about.title }}
        </h2>
        <p class="mt-4 font-plex text-[0.95rem] leading-relaxed text-pl-muted">{{ about.text }}</p>
      </div>

      <!-- Coordonnées -->
      <aside class="lg:col-span-5">
        <div class="pl-cartouche">
          <div class="pl-cell">
            <span class="pl-cell-label">Dépôt</span>
            <a :href="links.github" target="_blank" rel="noopener noreferrer" class="pl-cell-value hover:text-pl-blue">github.com/{{ handle }} ↗</a>
          </div>
          <div class="pl-cell">
            <span class="pl-cell-label">Réseau</span>
            <a :href="links.linkedin" target="_blank" rel="noopener noreferrer" class="pl-cell-value hover:text-pl-blue">linkedin.com/in/husary ↗</a>
          </div>
          <div class="pl-cell">
            <span class="pl-cell-label">Contact</span>
            <a :href="`mailto:${links.email}`" class="pl-cell-value break-all hover:text-pl-blue">{{ links.email }}</a>
          </div>
          <div class="pl-cell">
            <span class="pl-cell-label">Implantation</span>
            <span class="pl-cell-value">{{ profile.city }}, {{ profile.country }}</span>
          </div>
        </div>
      </aside>
    </section>

    <!-- Chronologie -->
    <section>
      <h2 class="border-b-2 border-pl-rule pb-2 font-archivo text-sm font-bold uppercase tracking-wide text-pl-ink">
        Chronologie des révisions
      </h2>
      <ol class="mt-4 border border-pl-rule/35">
        <li
          v-for="(step, i) in about.timeline"
          :key="step.role"
          class="grid grid-cols-1 gap-x-6 gap-y-1 border-b border-pl-rule/25 p-4 last:border-b-0 sm:grid-cols-[8rem_1fr]"
        >
          <div>
            <div class="pl-meta tabular-nums">RÉV. {{ String(about.timeline.length - i).padStart(2, '0') }}</div>
            <div class="mt-0.5 font-plexmono text-[0.74rem] text-pl-ink">{{ step.period }}</div>
            <div v-if="step.current" class="pl-meta mt-1 text-pl-blue">● En cours</div>
          </div>
          <div class="min-w-0">
            <h3 class="pl-sheet-title text-[0.95rem]">{{ step.role }}</h3>
            <RichText tag="p" class="mt-1.5 font-plex text-[0.84rem] leading-relaxed text-pl-muted" :text="step.text" />
          </div>
        </li>
      </ol>
    </section>

    <!-- Domaines -->
    <section>
      <h2 class="border-b-2 border-pl-rule pb-2 font-archivo text-sm font-bold uppercase tracking-wide text-pl-ink">
        Domaines traités
      </h2>
      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <article v-for="d in domains" :key="d.id" class="pl-sheet p-4">
          <div class="pl-meta border-b border-pl-rule/35 pb-2">{{ d.tag }}</div>
          <h3 class="pl-sheet-title mt-3">{{ d.title }}</h3>
          <RichText tag="p" class="mt-2 font-plex text-[0.84rem] leading-relaxed text-pl-muted" :text="d.text" />
          <RouterLink :to="d.to" class="pl-meta mt-3 inline-block text-pl-blue hover:underline">{{ d.cta }} →</RouterLink>
        </article>
      </div>
    </section>
  </div>
</template>
