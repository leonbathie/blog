<script setup>
import { onMounted, ref, watch } from 'vue'
import { drawIcon, ICON_H, ICON_W } from '../icons.js'

/** Icône d'article en pixel art : terminal, satellite, globe ou engrenage. */
const props = defineProps({
  icon: { type: String, default: 'computer' },
})

const canvas = ref(null)

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (ctx) drawIcon(ctx, props.icon)
}

onMounted(draw)
watch(() => props.icon, draw)
</script>

<template>
  <canvas
    ref="canvas"
    :width="ICON_W"
    :height="ICON_H"
    class="block h-full w-full"
    style="image-rendering: pixelated"
    aria-hidden="true"
  />
</template>
