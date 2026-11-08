<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import { profile } from '../../../content/index.js'
import { SHAPES } from '../deck.js'
import RichText from '../../../components/RichText.vue'
import { vTilt } from '../tilt.js'

/** Espace 01 — Nexus : bannière héro, hublot 3D et 4 cartes de domaines. */
const deck = inject('deck')
const router = useRouter()

const SHORT_TONES = {
  cyan: 'border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20',
  rose: 'border-rose-500/30 text-rose-300 hover:bg-rose-500/20',
  emerald: 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20',
  violet: 'border-violet-500/30 text-violet-300 hover:bg-violet-500/20',
}
const DOMAIN_BORDERS = {
  security: 'border-rose-500/60',
  speech: 'border-cyan-400/60',
  industrial: 'border-emerald-400/60',
  vision: 'border-violet-400/60',
}
const DOMAIN_BADGES = {
  security: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  speech: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  industrial: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  vision: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
}
const DOMAIN_LINKS = {
  security: 'text-rose-400',
  speech: 'text-cyan-300',
  industrial: 'text-emerald-400',
  vision: 'text-violet-300',
}
</script>

<template>
  <section class="space-y-8">
    <div class="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
      <!-- Héro -->
      <div v-tilt class="spatial-panel tilt-card space-y-6 rounded-3xl border border-cyan-500/30 p-7 sm:p-10 lg:col-span-7">
        <div class="tilt-content space-y-5">
          <div class="inline-flex flex-wrap items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 font-mono text-xs text-cyan-300">
            <span class="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
            <span>SPATIAL CYBERNETICS &amp; SOVEREIGN AI ENGINEERING</span>
          </div>
          <h1 class="font-syne text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
            Ingénierie <span class="glow-text bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">Offensive</span>, Silicium &amp; IA Souveraine.
          </h1>
          <RichText tag="p" class="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base" :text="profile.intro" />
          <div class="flex flex-wrap gap-3 pt-2 font-mono text-xs">
            <button type="button" class="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-cyan-400 px-5 py-3 font-extrabold text-slate-950 shadow-[0_0_30px_rgba(244,63,94,0.45)] transition hover:brightness-110" @click="router.push({ name: 'arena' })">
              🎮 JOUER : ARÈNE CYBER
            </button>
            <button type="button" class="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3 font-bold text-slate-950 transition hover:brightness-110" @click="router.push({ name: 'lab', params: { module: 'glitch' } })">
              ⚡ CYBER-LAB 3D
            </button>
            <button type="button" class="spatial-panel flex items-center gap-2 rounded-2xl px-5 py-3 text-cyan-200 transition hover:border-cyan-400" @click="router.push({ name: 'projects' })">
              🪐 {{ profile.githubRepoCount }} REPOS GITHUB
            </button>
          </div>
        </div>
      </div>

      <!-- Hublot 3D -->
      <div class="spatial-panel tilt-card cyber-grid-bg flex min-h-[340px] flex-col justify-between rounded-3xl border border-violet-500/30 p-6 lg:col-span-5">
        <div class="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs">
          <span class="flex items-center gap-2 font-bold text-cyan-300">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            INTERACTIVE 3D HOLOGRAM
          </span>
          <span class="rounded-full border border-violet-400/30 bg-violet-500/20 px-2.5 py-0.5 text-violet-300">MODE: {{ SHAPES[deck.state.shape].name.split('_')[0] }}</span>
        </div>
        <div class="my-auto space-y-2 py-8 text-center">
          <div class="inline-block rounded-full border border-cyan-500/30 bg-slate-950/70 px-4 py-1.5 font-mono text-[11px] text-cyan-200">
            🖱️ Glissez l'arrière-plan 3D ou choisissez ci-dessous
          </div>
          <p class="mx-auto max-w-xs text-xs text-slate-400">
            Chaque géométrie modélise un pilier de recherche : Cryptographie Kyber, Silicium ARM, Constellation GitHub ou Réseau Neuronal.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-2 font-mono text-[10px] sm:grid-cols-4">
          <button
            v-for="(shape, i) in SHAPES"
            :key="shape.name"
            type="button"
            class="rounded-xl border bg-slate-900/90 p-2.5 text-center transition"
            :class="SHORT_TONES[shape.tone]"
            @click="deck.setShape(i)"
          >
            {{ shape.short }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cartes de domaines -->
    <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      <button
        v-for="(domain, i) in profile.domains"
        :key="domain.id"
        v-tilt
        type="button"
        class="spatial-panel tilt-card space-y-3 rounded-3xl border-t-2 p-6 text-left"
        :class="DOMAIN_BORDERS[domain.id]"
        @click="router.push(domain.to)"
      >
        <div class="tilt-content space-y-3">
          <div class="flex items-center justify-between font-mono text-xs">
            <span class="rounded-md border px-2.5 py-0.5" :class="DOMAIN_BADGES[domain.id]">{{ domain.tag }}</span>
            <span class="text-slate-500">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>
          <h3 class="font-syne text-xl font-bold text-white">{{ domain.title }}</h3>
          <RichText tag="p" class="text-xs leading-relaxed text-slate-300" :text="domain.text" />
          <div class="flex items-center gap-1 pt-2 font-mono text-[11px]" :class="DOMAIN_LINKS[domain.id]">
            <span>{{ domain.cta }}</span> →
          </div>
        </div>
      </button>
    </div>
  </section>
</template>
