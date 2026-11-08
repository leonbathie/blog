<script setup>
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { profile } from '../../../content/index.js'
import { SHAPES } from '../deck.js'
import { useUtcClock } from '../../../core/useClock.js'

/** En-tête HUD fixe : identité, sélecteur de géométrie 3D, télémétrie et contrôles. */
const deck = inject('deck')
const router = useRouter()
const clock = useUtcClock(' UTC')
const score = computed(() => deck.state.stats.score.toLocaleString('fr-FR'))
</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 py-3 sm:px-8">
    <div class="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
      <!-- Identité -->
      <div class="spatial-panel pointer-events-auto flex items-center gap-3 rounded-2xl border border-cyan-500/30 px-4 py-2">
        <div class="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 font-syne text-sm font-extrabold text-slate-950">
          {{ profile.initials }}
          <span class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-syne text-sm font-bold tracking-tight text-white">{{ profile.name.toUpperCase() }}</span>
            <span class="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] text-cyan-300">@{{ profile.handle }}</span>
          </div>
          <div class="hidden font-mono text-[10px] uppercase text-slate-400 sm:block">{{ profile.focus }} // {{ profile.city }}</div>
        </div>
      </div>

      <!-- Sélecteur de géométrie 3D -->
      <div class="spatial-panel pointer-events-auto hidden items-center gap-1.5 rounded-2xl p-1.5 font-mono text-[11px] xl:flex">
        <span class="px-2.5 text-slate-400">3D CORE:</span>
        <button
          v-for="(shape, i) in SHAPES"
          :key="shape.name"
          type="button"
          class="rounded-xl px-3 py-1.5 transition"
          :class="deck.state.shape === i ? 'bg-cyan-400 font-bold text-slate-950' : 'text-slate-300 hover:text-cyan-300'"
          @click="deck.setShape(i)"
        >
          {{ shape.button }}
        </button>
      </div>

      <!-- Télémétrie & contrôles -->
      <div class="spatial-panel pointer-events-auto flex items-center gap-2.5 rounded-2xl px-3 py-2 font-mono text-xs">
        <div class="flex items-center gap-2.5 border-r border-white/10 pr-2">
          <div class="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
            LVL {{ deck.state.stats.level }}
          </div>
          <div class="flex items-center gap-1 text-[11px] font-bold text-amber-300" title="Data Shards récoltés">
            <span aria-hidden="true">💠</span><span>{{ score }}</span>
          </div>
          <div class="hidden rounded border border-rose-500/30 bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 sm:block">
            COMBO x{{ deck.state.stats.combo }}
          </div>
        </div>
        <div class="hidden items-center border-r border-white/10 pr-2 text-[11px] md:flex">
          <span class="font-bold text-cyan-300">{{ clock }}</span>
        </div>
        <button
          type="button"
          class="rounded-xl border border-rose-400/40 bg-rose-500/20 px-2.5 py-1 font-bold text-rose-300 transition hover:bg-rose-500 hover:text-slate-950"
          title="Salve EMP sur les drones 3D (touche F)"
          @click="deck.fire()"
        >
          🎯 FIRE
        </button>
        <button
          type="button"
          class="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-cyan-300 transition hover:bg-cyan-500/20"
          :title="deck.state.audio ? 'Couper le son' : 'Activer le son'"
          @click="deck.toggleAudio()"
        >
          {{ deck.state.audio ? '🔊' : '🔇' }}
        </button>
        <button
          type="button"
          class="rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 font-bold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
          title="Terminal (Ctrl+K)"
          @click="deck.state.terminalOpen = true"
        >
          ⌘K
        </button>
      </div>
    </div>
  </header>
</template>
