<script setup>
import { profile } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'

const about = profile.about
</script>

<template>
  <section class="py-8">
    <div class="mx-auto max-w-3xl space-y-8 rounded-lg border border-mono-line bg-mono-panel/70 p-5 sm:p-10">
      <div>
        <div class="mb-2 font-mono text-xs uppercase text-mono-accent">{{ about.kicker }}</div>
        <h2 class="font-serif text-3xl text-mono-ink">{{ about.title }}</h2>
        <RichText tag="p" class="mt-4 leading-relaxed text-mono-ink/80" :text="about.text" />
      </div>

      <div class="space-y-4 border-t border-mono-line pt-6 font-mono text-xs">
        <div class="uppercase tracking-wider text-mono-muted">Chronologie &amp; Rôles Clés</div>
        <div
          v-for="(item, i) in about.timeline"
          :key="item.role"
          class="grid grid-cols-1 gap-2 py-3 sm:grid-cols-4"
          :class="i < about.timeline.length - 1 ? 'border-b border-mono-line/60' : ''"
        >
          <div :class="item.current ? 'font-semibold text-mono-accent' : 'text-mono-muted'">{{ item.period }}</div>
          <div class="sm:col-span-3">
            <div class="font-semibold text-mono-ink">{{ item.role }}</div>
            <RichText tag="div" class="mt-1 font-sans text-mono-muted" :text="item.text" />
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 border-t border-mono-line pt-6 font-mono text-xs">
        <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="mono-link-pill">GitHub <span class="text-mono-accent">↗</span></a>
        <a :href="profile.links.linkedin" target="_blank" rel="noopener noreferrer" class="mono-link-pill">LinkedIn <span class="text-mono-accent">↗</span></a>
        <a :href="`mailto:${profile.links.email}`" class="mono-link-pill">{{ profile.links.email }} <span class="text-mono-accent">✉</span></a>
      </div>
    </div>
  </section>
</template>
