<script setup>
import { computed, inject } from 'vue'
import { SHAPES } from '../deck.js'

/** Colonne de télémétrie gauche (desktop) : radar, moteur WebGL et quête active. */
const deck = inject('deck')
const shapeName = computed(() => SHAPES[deck.state.shape].name)
const rotX = computed(() => `${deck.state.rotation.x.toFixed(2)} rad`)
const rotY = computed(() => `${(((deck.state.rotation.y % 6.28) + 6.28) % 6.28).toFixed(2)} rad`)
</script>

<template>
  <aside class="fixed left-6 top-1/2 z-30 hidden w-56 -translate-y-1/2 flex-col gap-3 font-mono text-[10px] 2xl:flex" aria-hidden="true">
    <!-- Radar -->
    <div class="spatial-panel space-y-2 rounded-2xl border-l-2 border-emerald-400 p-3.5">
      <div class="flex items-center justify-between font-bold text-emerald-400">
        <span>RADAR TACTIQUE</span>
        <span class="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300">{{ deck.state.drones }} CIBLES</span>
      </div>
      <div class="relative mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-cyan-500/40 bg-slate-950/90">
        <div class="radar-sweep absolute inset-0 rounded-full" />
        <div class="h-16 w-16 rounded-full border border-cyan-500/20" />
        <div class="z-10 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
        <span class="absolute left-8 top-3 h-1.5 w-1.5 animate-ping rounded-full bg-rose-500" />
        <span class="absolute bottom-5 right-6 h-1.5 w-1.5 animate-ping rounded-full bg-rose-500" />
        <span class="absolute right-5 top-9 h-1.5 w-1.5 rounded-full bg-amber-400" />
      </div>
      <div class="text-center text-[9px] text-slate-400">
        Visez les drones rouges en 3D ou appuyez sur <span class="text-cyan-300">F</span>
      </div>
    </div>

    <!-- Moteur WebGL -->
    <div class="spatial-panel space-y-2 rounded-2xl border-l-2 border-cyan-400 p-3.5">
      <div class="flex justify-between font-bold text-cyan-400">
        <span>WEBGL ENGINE</span>
        <span>{{ deck.state.webgl ? '60 FPS' : 'OFF' }}</span>
      </div>
      <div class="space-y-1 text-slate-400">
        <div class="flex justify-between"><span>ROT_X:</span><span class="text-slate-200">{{ rotX }}</span></div>
        <div class="flex justify-between"><span>ROT_Y:</span><span class="text-slate-200">{{ rotY }}</span></div>
        <div class="flex justify-between"><span>SHADER:</span><span class="text-cyan-300">{{ shapeName }}</span></div>
      </div>
    </div>

    <!-- Quête -->
    <div class="spatial-panel space-y-2 rounded-2xl border-l-2 border-violet-400 p-3.5">
      <div class="font-bold text-violet-300">QUÊTE ACTIVE</div>
      <div class="leading-relaxed text-slate-300">
        Neutraliser les sentinelles Firewall autour du noyau ou déverrouiller le simulateur Bootloader ARM.
      </div>
    </div>
  </aside>
</template>
