<script setup>
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * « Arcade 221 » — mini-jeu 8-bit du labo de Dakar.
 * Un pixel-ingénieur court sur un circuit imprimé et active, en sautant, des puces
 * qui résument les travaux du blog. Clic sur une puce = bonus ; ESPACE / flèches quand le jeu a le focus.
 */
const props = defineProps({ open: { type: Boolean, default: true } })
const emit = defineEmits(['update:open'])
const mono = inject('mono')
const canvas = ref(null)

const W = 920
const H = 145
const GROUND = 124
const PIXEL_FONT = '8px "Press Start 2P", monospace'

const hero = { x: 110, y: GROUND - 26, vx: 2.2, vy: 0, w: 22, h: 26, onGround: true, dir: 1, frame: 0 }
const chips = [
  { x: 190, y: 42, w: 96, h: 26, label: 'ASR PULAAR', reward: 'WHISPER +1', bump: 0, flash: 0 },
  { x: 355, y: 42, w: 96, h: 26, label: 'GMAO -25%', reward: 'WEIBULL OK!', bump: 0, flash: 0 },
  { x: 520, y: 42, w: 96, h: 26, label: 'FAULTY CAT', reward: 'GLITCH UNLOCK!', bump: 0, flash: 0 },
  { x: 685, y: 42, w: 96, h: 26, label: 'VEO 3D', reward: 'BOUKI & LEUK!', bump: 0, flash: 0 },
]
const clouds = [
  { x: 60, y: 18, s: 0.35 },
  { x: 310, y: 12, s: 0.25 },
  { x: 620, y: 20, s: 0.4 },
  { x: 830, y: 14, s: 0.3 },
]
const stars = Array.from({ length: 26 }, (_, i) => ({ x: (i * 137) % W, y: 6 + ((i * 53) % 44) }))

// Silhouette de ville (déterministe) avec fenêtres allumées
const skyline = []
for (let x = 70, i = 0; x < W - 80; i++) {
  const w = 26 + ((i * 17) % 22)
  const h = 18 + ((i * 29) % 34)
  const windows = []
  for (let wy = GROUND - h + 5; wy < GROUND - 4; wy += 7) {
    for (let wx = x + 4; wx < x + w - 4; wx += 6) if ((wx * 7 + wy * 3 + i) % 5 === 0) windows.push({ x: wx, y: wy })
  }
  skyline.push({ x, w, h, windows })
  x += w + 6 + ((i * 11) % 14)
}

const popups = []
const timers = new Set()
let raf = 0
let tick = 0

function later(fn, ms) {
  const id = window.setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

function jump() {
  if (!hero.onGround) return
  hero.vy = -8.6
  hero.onGround = false
  mono.sfx.jump()
}

function activate(chip) {
  chip.bump = -10
  chip.flash = 1
  popups.push({ x: chip.x + chip.w / 2, y: chip.y - 6, vy: -5.5, life: 1, text: chip.reward })
}

function combo() {
  mono.sfx.fanfare()
  chips.forEach((chip, i) =>
    later(() => {
      activate(chip)
      const rect = canvas.value?.getBoundingClientRect()
      if (rect) mono.coinBurst(rect.left + ((chip.x + chip.w / 2) / W) * rect.width, rect.top + 30, 2, chip.reward)
    }, i * 160),
  )
}

function onClick(event) {
  const rect = canvas.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left) * W) / rect.width
  const y = ((event.clientY - rect.top) * H) / rect.height
  const chip = chips.find((c) => x >= c.x && x <= c.x + c.w && y >= c.y - 10 && y <= c.y + c.h + 15)
  if (chip) {
    activate(chip)
    hero.x = chip.x + chip.w / 2 - hero.w / 2
    hero.vy = -4
    hero.onGround = false
    mono.coinBurst(event.clientX, event.clientY, 2, chip.reward)
  } else {
    hero.dir = x > hero.x ? 1 : -1
    jump()
  }
}

function onKey(event) {
  if (event.code === 'Space' || event.key === ' ') {
    event.preventDefault()
    jump()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    hero.dir = 1
    hero.x = Math.min(W - 95, hero.x + 14)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    hero.dir = -1
    hero.x = Math.max(65, hero.x - 14)
  }
}

function update() {
  tick += 1
  hero.x += hero.vx * hero.dir
  if (hero.x > W - 95) hero.dir = -1
  if (hero.x < 65) hero.dir = 1

  // Saut spontané sous une puce, pour que la scène vive toute seule
  for (const chip of chips) {
    const center = chip.x + chip.w / 2
    if (hero.onGround && Math.abs(hero.x + hero.w / 2 - center) < 4 && Math.random() < 0.08) {
      hero.vy = -8.4
      hero.onGround = false
    }
  }

  if (!hero.onGround) {
    hero.y += hero.vy
    hero.vy += 0.48
    for (const chip of chips) {
      const hit = hero.vy < 0 && hero.x + hero.w > chip.x && hero.x < chip.x + chip.w && hero.y <= chip.y + chip.h && hero.y >= chip.y - 8
      if (hit) {
        hero.vy = 2.2
        activate(chip)
        mono.addScore(250, 1)
      }
    }
    if (hero.y >= GROUND - hero.h) {
      hero.y = GROUND - hero.h
      hero.vy = 0
      hero.onGround = true
    }
  }
  hero.frame += 0.18
}

function drawRack(ctx, x, label, phase) {
  const top = GROUND - 44
  ctx.fillStyle = '#334155'
  ctx.fillRect(x, top, 38, 44)
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(x + 3, top + 3, 32, 38)
  for (let r = 0; r < 4; r++) {
    ctx.fillStyle = '#475569'
    ctx.fillRect(x + 5, top + 6 + r * 9, 28, 5)
    const on = (Math.floor(tick / 12) + r + phase) % 3 !== 0
    ctx.fillStyle = on ? '#34d399' : '#f59e0b'
    ctx.fillRect(x + 28, top + 7 + r * 9, 3, 3)
  }
  ctx.font = PIXEL_FONT
  ctx.fillStyle = '#6EE7B7'
  ctx.fillText(label, x + 3, top - 5)
}

function draw(ctx) {
  // Ciel de nuit
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#0f172a')
  sky.addColorStop(1, '#1e293b')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  for (const s of stars) ctx.fillRect(s.x, s.y, 1.5, 1.5)

  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  for (const c of clouds) {
    c.x -= c.s
    if (c.x < -70) c.x = W + 40
    ctx.fillRect(c.x, c.y, 48, 12)
    ctx.fillRect(c.x + 10, c.y - 6, 28, 6)
  }

  // Ville en arrière-plan
  for (const b of skyline) {
    ctx.fillStyle = '#16233a'
    ctx.fillRect(b.x, GROUND - b.h, b.w, b.h)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.55)'
    for (const w of b.windows) ctx.fillRect(w.x, w.y, 2, 2)
  }

  // Baies de serveurs aux deux extrémités
  drawRack(ctx, 18, 'DKR', 0)
  drawRack(ctx, W - 56, 'GPU', 1)

  // Puces de données
  for (const chip of chips) {
    chip.bump = chip.bump < 0 ? chip.bump + 1.2 : 0
    chip.flash = Math.max(0, chip.flash - 0.04)
    const y = chip.y + chip.bump
    ctx.fillStyle = '#d4a017'
    for (let px = chip.x + 6; px < chip.x + chip.w - 4; px += 9) {
      ctx.fillRect(px, y - 3, 3, 3)
      ctx.fillRect(px, y + chip.h, 3, 3)
    }
    ctx.fillStyle = '#134e4a'
    ctx.fillRect(chip.x, y, chip.w, chip.h)
    ctx.fillStyle = chip.flash > 0 ? `rgba(45, 212, 191, ${0.55 + chip.flash * 0.45})` : '#0f766e'
    ctx.fillRect(chip.x + 2, y + 2, chip.w - 4, chip.h - 4)
    ctx.fillStyle = '#99f6e4'
    ctx.fillRect(chip.x + 5, y + 5, 3, 3)
    ctx.font = PIXEL_FONT
    ctx.fillStyle = '#ecfeff'
    ctx.fillText(chip.label, chip.x + 11, y + 17)
  }

  // Jetons qui s'envolent
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i]
    p.y += p.vy
    p.vy += 0.28
    p.life -= 0.025
    if (p.life <= 0) {
      popups.splice(i, 1)
      continue
    }
    ctx.fillStyle = '#FBBF24'
    ctx.fillRect(p.x - 5, p.y - 12, 10, 14)
    ctx.fillStyle = '#FDE68A'
    ctx.fillRect(p.x - 2, p.y - 9, 4, 8)
    ctx.font = PIXEL_FONT
    ctx.fillStyle = '#34D399'
    ctx.fillText(p.text, p.x - 36, p.y - 18)
  }

  // Pixel-ingénieur (casque terracotta, visière cyan)
  const hx = Math.round(hero.x)
  const hy = Math.round(hero.y)
  ctx.fillStyle = '#D95D39'
  ctx.fillRect(hx + 2, hy, 18, 6)
  ctx.fillStyle = '#38BDF8'
  ctx.fillRect(hx + (hero.dir > 0 ? 10 : 2), hy + 6, 10, 5)
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(hx + 3, hy + 11, 16, 9)
  ctx.fillStyle = '#D95D39'
  ctx.fillRect(hx + 6, hy + 12, 10, 7)
  const leg = hero.onGround ? Math.sin(hero.frame) * 3 : 3
  ctx.fillStyle = '#F59E0B'
  ctx.fillRect(hx + 3 + leg, hy + 20, 6, 6)
  ctx.fillRect(hx + 13 - leg, hy + 20, 6, 6)

  // Sol : circuit imprimé
  ctx.fillStyle = '#052e16'
  ctx.fillRect(0, GROUND, W, H - GROUND)
  ctx.fillStyle = '#22c55e'
  ctx.fillRect(0, GROUND, W, 2)
  ctx.fillStyle = '#15803d'
  for (let gx = 0; gx < W; gx += 24) {
    ctx.fillRect(gx + 2, GROUND + 7, 18, 2)
    ctx.fillRect(gx + 12, GROUND + 13, 2, 7)
  }
  ctx.fillStyle = '#fbbf24'
  for (let gx = 10; gx < W; gx += 48) ctx.fillRect(gx, GROUND + 6, 4, 4)
}

function loop() {
  raf = 0
  const el = canvas.value
  if (!el || !props.open || document.hidden) return
  update()
  draw(el.getContext('2d'))
  raf = requestAnimationFrame(loop)
}
function start() {
  if (!raf) raf = requestAnimationFrame(loop)
}
function onVisibility() {
  if (!document.hidden) start()
}

watch(
  () => props.open,
  (open) => {
    if (open) start()
  },
)
onMounted(() => {
  start()
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  raf = 0
  timers.forEach((id) => window.clearTimeout(id))
  document.removeEventListener('visibilitychange', onVisibility)
})

defineExpose({ jump, combo })
</script>

<template>
  <details class="mono-arcade" :open="open" @toggle="emit('update:open', $event.target.open)">
    <summary>Une pause au laboratoire : découvrir le mini-jeu 8-bit</summary>
    <div class="relative border-t-2 border-amber-500/50 bg-sky-950 dark:border-amber-400/40">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-zinc-900/95 px-3 py-1.5 font-pixel text-[10px] text-amber-400">
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-400" />
          <span>ARCADE 221 // DAKAR LAB STAGE</span>
        </div>
        <div class="flex items-center gap-2 font-mono text-[11px] text-zinc-300">
          <span class="hidden sm:inline">
            Activez les puces <strong class="text-amber-400">DATA</strong> (clic sur le jeu,
            <kbd class="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[10px]">ESPACE</kbd> ou flèches)
          </span>
          <button type="button" class="rounded bg-amber-500 px-2 py-0.5 font-pixel text-[9px] text-zinc-950 transition hover:bg-amber-400 active:scale-95" @click="jump">
            SAUTER
          </button>
          <button type="button" class="rounded bg-emerald-500 px-2 py-0.5 font-pixel text-[9px] text-zinc-950 transition hover:bg-emerald-400 active:scale-95" @click="combo">
            COMBO x4
          </button>
        </div>
      </div>
      <div class="mono-arcade-scroll">
        <canvas
          ref="canvas"
          :width="W"
          :height="H"
          tabindex="0"
          class="block h-32 w-full cursor-pointer sm:h-36"
          aria-label="Mini-jeu : sélectionnez-le puis utilisez les flèches et la barre espace"
          title="Cliquez pour faire courir et sauter le pixel-ingénieur sous les puces !"
          @click="onClick"
          @keydown="onKey"
        />
      </div>
    </div>
  </details>
</template>
