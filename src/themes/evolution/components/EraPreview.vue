<script setup>
import { onMounted, ref, watch } from 'vue'
import { drawIcon } from '../../leontechlab/icons.js'

/**
 * Vignette d'une époque : son bandeau de titre, une mini-fenêtre dans ses
 * couleurs, et une petite illustration en pixel art.
 */
const props = defineProps({ era: { type: Object, required: true }, label: { type: String, default: '' } })
const emit = defineEmits(['select'])

const ART = { web1: 'computer', web2: 'globe', mobile: 'phone', genai: 'network', xr: 'gear', agi: 'satellite', future: 'rocket' }
const canvas = ref(null)
const paint = () => canvas.value && drawIcon(canvas.value, ART[props.era.id] ?? 'computer', 2)
onMounted(paint)
watch(() => props.era.id, paint)
</script>

<template>
  <button
    type="button"
    class="evo-preview era-window"
    :data-era="era.id"
    :style="{ '--c': era.color }"
    :aria-label="label || undefined"
    @click="emit('select', era.id)"
  >
    <span class="evo-preview-label"><span>{{ era.years }}</span><span>| {{ era.name }}</span></span>
    <span class="evo-preview-body" :lang="era.lang">
      <span class="flex items-baseline gap-2">
        <span class="font-bold" style="font-family: var(--era-head)">LeonTechLab</span>
        <span class="era-muted truncate text-[0.62rem]">{{ era.subtitle }}</span>
      </span>
      <span class="evo-preview-nav"><span v-for="[label] in era.nav" :key="label">{{ label }}</span></span>
      <span class="evo-preview-head mt-1 max-w-[62%]">{{ era.headline }}</span>
      <span class="evo-preview-intro era-muted max-w-[62%] text-[0.62rem] leading-tight">{{ era.intro }}</span>
      <canvas ref="canvas" class="evo-preview-art" width="128" height="96" style="image-rendering: pixelated" aria-hidden="true" />
    </span>
  </button>
</template>
