<script setup>
import { computed, inject } from 'vue'
import { WEAPONS } from '../deck.js'

/** Espace 05 — Arène : vise les drones 3D directement dans la scène de fond. */
const deck = inject('deck')
const stats = computed(() => deck.state.stats)

const WEAPON_STYLES = [
  { active: 'bg-rose-500 text-slate-950', idle: 'bg-white/5 text-rose-300 border-rose-500/30 hover:bg-rose-500/20' },
  { active: 'bg-cyan-400 text-slate-950', idle: 'bg-white/5 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20' },
  { active: 'bg-emerald-400 text-slate-950', idle: 'bg-white/5 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' },
]
const skills = [
  { title: 'Implant #01 : Faulty Cat EMFI', note: 'Dégâts critiques sur bootloaders ARM', btn: 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 border-rose-500/40' },
  { title: 'Implant #02 : Tappirgal & Lingoo ASR', note: '6 claviers Kotlin + Whisper Pulaar/Wolof', btn: 'bg-cyan-500/20 hover:bg-cyan-400 text-cyan-300 border-cyan-500/40' },
  { title: 'Implant #03 : GMAO Weibull Shield', note: 'Disponibilité industrielle 98.4% (Madar/IBS)', btn: 'bg-emerald-500/20 hover:bg-emerald-400 text-emerald-300 border-emerald-500/40' },
]
</script>

<template>
  <section class="space-y-6">
    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
      <!-- Mission & arsenal -->
      <div class="spatial-panel space-y-4 rounded-3xl border border-cyan-400/50 p-5 lg:col-span-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-2.5 font-mono text-xs">
          <span class="flex items-center gap-2 font-bold text-cyan-300">
            <span class="h-2.5 w-2.5 animate-ping rounded-full bg-rose-500" />
            NEURAL BREACH // ARENA
          </span>
          <span class="rounded border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 font-bold text-rose-300">VAGUE {{ String(stats.wave).padStart(2, '0') }}</span>
        </div>
        <p class="text-xs leading-relaxed text-slate-300">
          <strong>MODE COMBAT SPATIAL ACTIF :</strong> cliquez directement sur les <strong>drones sentinelles rouges</strong> qui gravitent en 3D autour du noyau, ou appuyez sur <code class="rounded bg-white/10 px-1">F</code> pour une salve orbitale.
        </p>
        <div class="space-y-2 font-mono text-xs">
          <div class="text-[10px] uppercase tracking-wider text-slate-400">Arsenal cybernétique :</div>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="(weapon, i) in WEAPONS"
              :key="weapon.name"
              type="button"
              class="rounded-xl border p-2.5 text-center font-bold transition"
              :class="stats.weapon === i ? `${WEAPON_STYLES[i].active} border-transparent` : WEAPON_STYLES[i].idle"
              @click="deck.selectWeapon(i)"
            >
              {{ weapon.label }}
            </button>
          </div>
        </div>
        <div class="flex gap-2 pt-1 font-mono text-xs">
          <button type="button" class="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-3 font-extrabold text-slate-950 shadow-lg shadow-rose-500/30 transition hover:brightness-110" @click="deck.fire()">
            🔥 SALVE ORBITALE [F]
          </button>
          <button type="button" class="rounded-xl border border-violet-400/50 bg-violet-500/20 px-3.5 py-3 font-bold text-violet-200 transition hover:bg-violet-500 hover:text-slate-950" @click="deck.spawnBoss()">
            👾 BOSS
          </button>
        </div>
      </div>

      <!-- Viseur -->
      <div class="flex min-h-[340px] select-none flex-col items-center justify-center lg:col-span-4">
        <div class="relative flex h-56 w-56 items-center justify-center" aria-hidden="true">
          <div class="hud-corner-tl absolute left-0 top-0 h-6 w-6" />
          <div class="hud-corner-tr absolute right-0 top-0 h-6 w-6" />
          <div class="hud-corner-bl absolute bottom-0 left-0 h-6 w-6" />
          <div class="hud-corner-br absolute bottom-0 right-0 h-6 w-6" />
          <div class="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/30">
            <div class="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]" />
          </div>
          <div class="absolute -bottom-8 rounded-full border border-cyan-500/30 bg-slate-950/80 px-3 py-1 font-mono text-[11px] text-cyan-300">
            VISEUR 3D ACTIF • CLIQUEZ LES DRONES
          </div>
        </div>
      </div>

      <!-- Arbre de compétences -->
      <div class="spatial-panel space-y-4 rounded-3xl border border-violet-400/50 p-5 font-mono text-xs lg:col-span-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
          <span class="font-bold text-violet-300">ARBRE DE COMPÉTENCES</span>
          <span class="font-bold text-emerald-400">{{ stats.kills }} DRONES DÉTRUITS</span>
        </div>
        <div class="space-y-2.5">
          <div v-for="(skill, i) in skills" :key="i" class="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/80 p-3">
            <div>
              <div class="font-bold text-white">{{ skill.title }}</div>
              <div class="text-[10px] text-slate-400">{{ skill.note }}</div>
            </div>
            <button type="button" class="rounded-xl border px-3 py-1.5 font-bold transition hover:text-slate-950" :class="skill.btn" @click="deck.upgradeSkill(i)">
              LVL {{ stats.skills[i] }} ▲
            </button>
          </div>
        </div>
        <div class="h-20 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/90 p-3 text-[11px] text-cyan-300" aria-live="polite">
          <div v-for="(line, i) in deck.state.arenaLog" :key="i">&gt; {{ line }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
