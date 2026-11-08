<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { ICONS } from '../eras.js'

/**
 * La frise des époques : sept boutons reliés par un fil lumineux.
 * Flèches gauche / droite, Début et Fin passent d'une époque à l'autre.
 * Sur téléphone la frise défile à l'horizontale : l'époque choisie reste en vue.
 */
const props = defineProps({
  modelValue: { type: String, required: true },
  eras: { type: Array, required: true },
  label: { type: String, default: 'Époques' },
})
const emit = defineEmits(['update:modelValue'])
const nav = ref(null)

function pick(index) {
  const era = props.eras[(index + props.eras.length) % props.eras.length]
  emit('update:modelValue', era.id)
  nextTick(() => nav.value?.querySelector(`[data-id="${era.id}"]`)?.focus())
}
function onKey(e) {
  const index = props.eras.findIndex((era) => era.id === props.modelValue)
  const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: props.eras.length - 1 }
  if (!(e.key in moves)) return
  e.preventDefault()
  pick(moves[e.key])
}

/** Défilement horizontal de la frise seule : scrollIntoView ferait aussi défiler la page. */
function reveal(smooth = true) {
  const box = nav.value
  const button = box?.querySelector('.evo-era-on')
  if (!box || !button || box.scrollWidth <= box.clientWidth) return
  const a = box.getBoundingClientRect()
  const b = button.getBoundingClientRect()
  box.scrollBy({ left: b.left - a.left - (a.width - b.width) / 2, behavior: smooth ? 'smooth' : 'auto' })
}
watch(
  () => props.modelValue,
  () => nextTick(() => reveal()),
)
onMounted(() => reveal(false))
</script>

<template>
  <nav ref="nav" class="evo-timeline" :aria-label="label" @keydown="onKey">
    <button
      v-for="e in eras"
      :key="e.id"
      type="button"
      class="evo-era"
      :class="e.id === modelValue ? 'evo-era-on' : ''"
      :style="{ '--c': e.color }"
      :data-id="e.id"
      :aria-pressed="e.id === modelValue"
      :tabindex="e.id === modelValue ? 0 : -1"
      :title="`${e.years} — ${e.name} (${e.mood})`"
      @click="emit('update:modelValue', e.id)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path :d="ICONS[e.icon]" />
      </svg>
      <span class="evo-era-dot" aria-hidden="true" />
      <span class="evo-era-years">{{ e.years }}</span>
      <span class="evo-era-name">{{ e.name }}</span>
      <span class="evo-era-mood">({{ e.mood }})</span>
    </button>
  </nav>
</template>
