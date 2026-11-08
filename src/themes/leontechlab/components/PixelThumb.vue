<script setup>
import { onMounted, ref, watch } from 'vue'

/**
 * Vignette en pixel art, déterministe : la même graine donne toujours le même
 * motif. Évite d'embarquer des images et reste net à toute taille.
 */
const props = defineProps({
  seed: { type: String, required: true },
  tone: { type: String, default: 'green' },
})

const SIZE = 24 // tuiles logiques
const canvas = ref(null)

const TONES = {
  green: ['#0b3b17', '#149933', '#22ff55', '#eafff0'],
  gold: ['#4a3208', '#a8761c', '#f5b841', '#fff3d1'],
  blue: ['#0d2b4f', '#1e5a8f', '#5fb4f0', '#e6f4ff'],
}

/** Suite déterministe tirée de la graine */
function* noise(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  for (;;) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    yield (h >>> 0) / 4294967296
  }
}

function draw() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  const palette = TONES[props.tone] ?? TONES.green
  const rnd = noise(props.seed)

  ctx.fillStyle = palette[0]
  ctx.fillRect(0, 0, SIZE, SIZE)

  // Motif symétrique : plus lisible qu'un bruit pur à cette taille
  for (let y = 2; y < SIZE - 2; y++) {
    for (let x = 2; x < SIZE / 2; x++) {
      const v = rnd.next().value
      if (v < 0.52) continue
      const shade = v > 0.86 ? 3 : v > 0.68 ? 2 : 1
      ctx.fillStyle = palette[shade]
      ctx.fillRect(x, y, 1, 1)
      ctx.fillRect(SIZE - 1 - x, y, 1, 1)
    }
  }

  // Cadre
  ctx.fillStyle = palette[2]
  ctx.fillRect(0, 0, SIZE, 1)
  ctx.fillRect(0, SIZE - 1, SIZE, 1)
  ctx.fillRect(0, 0, 1, SIZE)
  ctx.fillRect(SIZE - 1, 0, 1, SIZE)
}

onMounted(draw)
watch(() => [props.seed, props.tone], draw)
</script>

<template>
  <canvas
    ref="canvas"
    :width="SIZE"
    :height="SIZE"
    class="block h-full w-full"
    style="image-rendering: pixelated"
    aria-hidden="true"
  />
</template>
