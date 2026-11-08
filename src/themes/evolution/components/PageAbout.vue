<script setup>
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { contentIn } from '../../../content/index.js'
import RichText from '../../../components/RichText.vue'
import { LABELS } from '../eras.js'

/** Présentation, parcours, chiffres clés, liens et contact. */
const props = defineProps({ era: { type: Object, required: true } })
const L = computed(() => LABELS[props.era.lang])
const profile = computed(() => contentIn(props.era.lang).profile)
const route = useRoute()
const LINKS = computed(() => [
  ['GitHub', profile.value.links.github],
  ['LinkedIn', profile.value.links.linkedin],
  ['Hugging Face', 'https://huggingface.co'],
  ['arXiv', 'https://arxiv.org'],
  ['Anthropic', 'https://www.anthropic.com'],
  ['DeepMind', 'https://deepmind.google'],
])
async function reveal() {
  if (route.hash !== '#links') return
  await nextTick()
  document.getElementById('links')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
watch(() => route.hash, reveal)
onMounted(reveal)
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="flex flex-wrap items-start gap-4">
      <img
        v-if="profile.avatar"
        :src="profile.avatar"
        alt=""
        width="88"
        height="88"
        class="h-[88px] w-[88px] border border-[rgb(var(--era-line))] object-cover"
        :class="era.id === 'web1' ? 'grayscale contrast-125' : ''"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <div class="min-w-0">
        <h1 class="era-h1 text-2xl font-bold">{{ L.about }} — {{ profile.name }}</h1>
        <p class="era-muted">@{{ profile.handle }} · {{ profile.role }} · {{ profile.city }}, {{ profile.country }}</p>
        <p class="mt-2 text-[0.95rem] leading-snug">{{ profile.tagline[era.lang] ?? profile.tagline.fr }}</p>
      </div>
    </div>

    <h2 class="era-h1 mt-6 text-xl font-bold">{{ profile.about.title }}</h2>
    <p class="mt-2 text-[0.95rem] leading-snug">{{ profile.about.text }}</p>

    <h2 class="era-h1 mt-6 text-xl font-bold">{{ L.career }}</h2>
    <ol class="mt-2 divide-y divide-[rgb(var(--era-line))]">
      <li v-for="step in profile.about.timeline" :key="step.role" class="grid grid-cols-1 gap-x-4 py-2 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <p class="text-[0.85rem]" style="font-family: var(--era-mono)">
          <span class="era-muted">{{ step.period }}</span>
          <span v-if="step.current" class="era-chip ml-1">{{ L.current }}</span>
        </p>
        <div>
          <h3 class="era-h2 text-[1rem] leading-tight">{{ step.role }}</h3>
          <RichText tag="p" class="mt-0.5 text-[0.9rem] leading-snug" :text="step.text" />
        </div>
      </li>
    </ol>

    <h2 class="era-h1 mt-6 text-xl font-bold">{{ L.figures }}</h2>
    <ul class="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
      <li v-for="h in profile.highlights" :key="h.label" class="era-panel p-2 text-center">
        <p class="text-xl font-bold text-[rgb(var(--era-accent))]" style="font-family: var(--era-head)">{{ h.value }}</p>
        <p class="text-[0.82rem] leading-tight">{{ h.label }}</p>
        <p class="era-muted text-[0.75rem]">{{ h.note }}</p>
      </li>
    </ul>

    <h2 id="links" class="era-h1 mt-6 scroll-mt-4 text-xl font-bold">{{ L.links }} &amp; {{ L.contact }}</h2>
    <ul class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.95rem] sm:grid-cols-3">
      <li v-for="[label, url] in LINKS" :key="label">
        <a :href="url" target="_blank" rel="noopener noreferrer" class="era-link">{{ label }}</a>
      </li>
    </ul>
    <p class="mt-3 text-[0.95rem]">
      <span class="era-muted">{{ L.email }} :</span>
      <a :href="`mailto:${profile.links.email}`" class="era-link break-all">{{ profile.links.email }}</a>
      · <span class="era-muted">{{ L.location }}{{ L.colon }}</span> {{ profile.city }}, {{ profile.country }}
    </p>
  </div>
</template>
