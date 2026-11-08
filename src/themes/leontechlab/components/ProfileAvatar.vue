<script setup>
import { computed, ref } from 'vue'
import { profile } from '../../../content/index.js'

/**
 * Photo du profil GitHub. GitHub sert l'avatar à la taille demandée (`s=`) :
 * on demande 1×, 2× et 3× pour qu'il reste net sur les écrans de téléphone.
 * Si elle ne charge pas (hors ligne, réseau filtré), les initiales prennent le relais.
 */
const props = defineProps({
  size: { type: Number, default: 64 },
})

const ok = ref(Boolean(profile.avatar))

function sized(px) {
  try {
    const url = new URL(profile.avatar)
    if (url.hostname.endsWith('githubusercontent.com')) url.searchParams.set('s', String(px))
    return url.href
  } catch {
    return profile.avatar
  }
}
const src = computed(() => sized(props.size * 2))
const srcset = computed(() => [1, 2, 3].map((k) => `${sized(props.size * k)} ${k}x`).join(', '))
</script>

<template>
  <span class="leon-thumb block shrink-0 overflow-hidden" :style="{ width: `${size}px`, height: `${size}px` }">
    <img
      v-if="ok"
      :src="src"
      :srcset="srcset"
      :alt="`Photo de profil de ${profile.name}`"
      :width="size"
      :height="size"
      class="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      @error="ok = false"
    />
    <span
      v-else
      class="flex h-full w-full items-center justify-center bg-leon-dark/40 font-pixel text-leon-gold"
      :style="{ fontSize: `${Math.round(size / 4.2)}px` }"
      role="img"
      :aria-label="profile.name"
    >
      {{ profile.initials }}
    </span>
  </span>
</template>
