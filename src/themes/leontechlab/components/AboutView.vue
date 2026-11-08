<script setup>
import { profile } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'

/** Colonne centrale : parcours, domaines et liaison. */
const { about, domains, links, handle } = profile
</script>

<template>
  <div class="space-y-4">
    <section class="leon-box p-3 sm:p-4">
      <h2 class="leon-box-header font-silk text-[0.72rem]">{{ about.kicker }}</h2>
      <h3 class="font-silk text-[0.8rem] leading-relaxed text-leon-gold">{{ about.title }}</h3>
      <p class="mt-3 text-[0.76rem] leading-relaxed text-leon-ink/80">{{ about.text }}</p>
    </section>

    <section class="leon-box p-3 sm:p-4">
      <h2 class="leon-box-header font-silk text-[0.72rem]">Parcours</h2>
      <ol class="space-y-0">
        <li
          v-for="(step, i) in about.timeline"
          :key="step.role"
          class="grid grid-cols-1 gap-x-4 gap-y-1 border-b border-leon-green/15 py-3 last:border-b-0 sm:grid-cols-[9rem_1fr]"
        >
          <div class="text-[0.66rem]">
            <div class="text-leon-gold">{{ step.period }}</div>
            <div v-if="step.current" class="mt-0.5 flex items-center gap-1 text-leon-green">
              <span class="h-1.5 w-1.5 bg-leon-green" />en cours
            </div>
            <div v-else class="mt-0.5 text-leon-dim">archive {{ about.timeline.length - i }}</div>
          </div>
          <div class="min-w-0">
            <h3 class="font-silk text-[0.66rem] leading-relaxed text-leon-green">{{ step.role }}</h3>
            <RichText tag="p" class="mt-1 text-[0.72rem] leading-relaxed text-leon-ink/70" :text="step.text" />
          </div>
        </li>
      </ol>
    </section>

    <section class="leon-box p-3 sm:p-4">
      <h2 class="leon-box-header font-silk text-[0.72rem]">Domaines de recherche</h2>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RouterLink
          v-for="d in domains"
          :key="d.id"
          :to="d.to"
          class="block border border-leon-green/25 bg-leon-bg/60 p-3 transition-colors hover:border-leon-green"
        >
          <span class="block text-[0.6rem] text-leon-gold">{{ d.tag }}</span>
          <span class="mt-1 block font-silk text-[0.66rem] leading-relaxed text-leon-green">{{ d.title }}</span>
          <RichText tag="span" class="mt-1.5 block text-[0.7rem] leading-relaxed text-leon-ink/70" :text="d.text" />
          <span class="mt-2 block text-[0.64rem] text-leon-gold">{{ d.cta }} →</span>
        </RouterLink>
      </div>
    </section>

    <section class="leon-box p-3 sm:p-4">
      <h2 class="leon-box-header font-silk text-[0.72rem]">Liaison</h2>
      <ul class="space-y-1.5 text-[0.72rem]">
        <li>
          <span class="text-leon-dim">GitHub&nbsp;:</span>
          <a :href="links.github" target="_blank" rel="noopener noreferrer" class="text-leon-green hover:text-leon-bright">
            github.com/{{ handle }} ↗
          </a>
        </li>
        <li>
          <span class="text-leon-dim">LinkedIn&nbsp;:</span>
          <a :href="links.linkedin" target="_blank" rel="noopener noreferrer" class="text-leon-green hover:text-leon-bright">
            linkedin.com/in/husary ↗
          </a>
        </li>
        <li>
          <span class="text-leon-dim">Courriel&nbsp;:</span>
          <a :href="`mailto:${links.email}`" class="break-all text-leon-green hover:text-leon-bright">{{ links.email }}</a>
        </li>
        <li><span class="text-leon-dim">Implantation&nbsp;:</span> {{ profile.city }}, {{ profile.country }}</li>
      </ul>
    </section>
  </div>
</template>
