<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { drawIcon, ICON_H, ICON_W } from '../icons.js'

/**
 * Vignette en pixel art, agrandie d'un facteur ENTIER choisi d'après la place
 * disponible et la densité de l'écran : chaque case fait B × B pixels réels.
 * Le reste de la boîte reste noir, comme le ciel des vignettes.
 */
const props = defineProps({
  icon: { type: String, default: 'computer' },
})

const canvas = ref(null)
const box = ref(null)
let observer = null

function paint() {
  const el = canvas.value
  const parent = box.value
  if (!el || !parent) return
  const dpr = window.devicePixelRatio || 1
  const devW = Math.round(parent.clientWidth * dpr)
  const devH = Math.round(parent.clientHeight * dpr)
  const B = Math.max(1, Math.min(Math.floor(devW / ICON_W), Math.floor(devH / ICON_H)))
  drawIcon(el, props.icon, B)
  el.style.width = `${(ICON_W * B) / dpr}px`
  el.style.height = `${(ICON_H * B) / dpr}px`
}

onMounted(() => {
  paint()
  if ('ResizeObserver' in window && box.value) {
    observer = new ResizeObserver(paint)
    observer.observe(box.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => props.icon, paint)
</script>

<template>
  <span ref="box" class="flex h-full w-full items-center justify-center overflow-hidden bg-black">
    <canvas ref="canvas" :width="ICON_W" :height="ICON_H" class="block" style="image-rendering: pixelated" aria-hidden="true" />
  </span>
</template>
