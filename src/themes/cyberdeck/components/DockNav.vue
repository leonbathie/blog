<script setup>
import { RouterLink } from 'vue-router'

/** Dock flottant (bas de l'écran) : navigation entre les espaces de travail. */
defineProps({ workspace: { type: String, default: 'nexus' } })

const items = [
  { id: 'nexus', icon: '🌐', label: '01. NEXUS', to: { name: 'home' } },
  { id: 'papers', icon: '📜', label: '02. RECHERCHE', to: { name: 'articles' } },
  { id: 'github', icon: '🪐', label: '03. GITHUB', to: { name: 'projects' } },
  { id: 'lab', icon: '⚡', label: '04. CYBER-LAB', to: { name: 'lab', params: { module: 'glitch' } } },
  { id: 'arena', icon: '🎮', label: '05. ARÈNE', to: { name: 'arena' }, accent: true },
]
</script>

<template>
  <nav
    class="spatial-panel fixed bottom-5 left-1/2 z-50 flex max-w-[96vw] -translate-x-1/2 items-center gap-1.5 overflow-x-auto rounded-3xl border border-cyan-400/40 px-3 py-2 shadow-[0_15px_50px_rgba(0,0,0,0.85)] sm:gap-2.5"
    aria-label="Espaces de travail"
  >
    <RouterLink
      v-for="item in items"
      :key="item.id"
      :to="item.to"
      class="dock-item flex shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 font-mono text-xs"
      :class="[
        workspace === item.id ? 'active-dock' : 'border-transparent text-slate-300',
        item.accent && workspace !== item.id ? 'border-rose-500/40 bg-rose-500/15 text-rose-200' : '',
      ]"
      :aria-current="workspace === item.id ? 'page' : undefined"
    >
      <span aria-hidden="true">{{ item.icon }}</span>
      <span class="font-bold">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
