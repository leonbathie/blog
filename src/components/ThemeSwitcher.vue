<script setup>
import { ref } from 'vue'
import { useThemes } from '../core/themes.js'

/**
 * Sélecteur de forme générique (coin bas-gauche), affiché seulement pour les formes
 * qui n'intègrent pas leur propre sélecteur (integratedSwitcher: false dans src/themes/index.js).
 */
const { themes, active, setTheme, number } = useThemes()
const open = ref(false)

function pick(id) {
  open.value = false
  setTheme(id)
}
</script>

<template>
  <div class="fixed bottom-4 left-4 z-[200] font-mono text-xs">
    <div
      v-if="open"
      class="mb-2 w-72 rounded-xl border border-white/15 bg-zinc-950/95 p-2 text-zinc-200 shadow-2xl backdrop-blur"
    >
      <button
        v-for="t in themes"
        :key="t.id"
        type="button"
        class="w-full rounded-lg px-3 py-2 text-left transition hover:bg-white/10"
        :class="t.id === active.id ? 'bg-white/10 text-white' : ''"
        @click="pick(t.id)"
      >
        <span class="font-bold">{{ number(t) }}. {{ t.name }}</span>
        <span class="block text-[11px] text-zinc-400">{{ t.summary }}</span>
      </button>
    </div>
    <button
      type="button"
      class="rounded-full border border-white/20 bg-zinc-950/90 px-3 py-2 text-zinc-200 shadow-lg backdrop-blur hover:border-white/50"
      :aria-expanded="open"
      @click="open = !open"
    >
      ◇ Forme {{ number(active) }}/{{ themes.length }} · {{ active.name }}
    </button>
  </div>
</template>
