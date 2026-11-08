<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Gerbes de jetons, étincelles et textes flottants (canvas plein écran, ne capte aucun clic). */
const canvas = ref(null)
const particles = []
let raf = 0
let dpr = 1

function resize() {
  const el = canvas.value
  if (!el) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  el.width = Math.round(window.innerWidth * dpr)
  el.height = Math.round(window.innerHeight * dpr)
}

function frame() {
  const el = canvas.value
  if (!el) {
    raf = 0
    return
  }
  const ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, el.width / dpr, el.height / dpr)

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += p.gravity
    p.life -= 0.018
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }
    ctx.save()
    ctx.globalAlpha = Math.min(1, p.life)
    if (p.type === 'text') {
      ctx.font = 'bold 11px "Press Start 2P", monospace'
      ctx.fillStyle = p.color
      ctx.shadowColor = '#000'
      ctx.shadowBlur = 4
      ctx.fillText(p.text, p.x, p.y)
    } else if (p.type === 'coin') {
      ctx.translate(p.x, p.y)
      ctx.scale(Math.max(0.15, Math.abs(Math.cos(p.life * 14))), 1)
      ctx.fillStyle = '#F59E0B'
      ctx.fillRect(-7, -10, 14, 20)
      ctx.fillStyle = '#FDE68A'
      ctx.fillRect(-3, -6, 6, 12)
    } else {
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, p.size, p.size)
    }
    ctx.restore()
  }

  raf = particles.length ? requestAnimationFrame(frame) : 0
}

function burst(x, y, count = 4, label = '+200') {
  for (let i = 0; i < count; i++) {
    particles.push({
      type: 'coin',
      x: x + (Math.random() - 0.5) * 30,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: -6 - Math.random() * 5,
      gravity: 0.32,
      life: 1,
    })
  }
  for (let i = 0; i < 12; i++) {
    particles.push({
      type: 'spark',
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.8) * 7,
      gravity: 0.2,
      size: 5,
      color: ['#FBBF24', '#34D399', '#F97316', '#38BDF8'][i % 4],
      life: 0.9,
    })
  }
  particles.push({ type: 'text', text: label, x: x - 24, y: y - 12, vx: 0, vy: -2.2, gravity: 0, color: '#FBBF24', life: 1.15 })
  if (!raf) raf = requestAnimationFrame(frame)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})

defineExpose({ burst })
</script>

<template>
  <canvas ref="canvas" class="pointer-events-none fixed inset-0 z-[80] h-full w-full" aria-hidden="true" />
</template>
