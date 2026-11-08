<script setup>
import { useThemes } from '../core/themes.js'

const { active, defaultTheme, archive, setTheme } = useThemes()
const reload = () => window.location.reload()
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-[#0b0c0e] px-6 text-center font-mono text-sm text-zinc-300">
    <div class="max-w-md space-y-4">
      <p class="text-rose-400 font-bold">Impossible de charger la forme « {{ active.name }} ».</p>
      <p class="text-zinc-500 text-xs">Vérifiez votre connexion puis réessayez.</p>
      <div class="flex flex-wrap justify-center gap-2">
        <button type="button" class="px-4 py-2 rounded border border-zinc-600 hover:border-cyan-400" @click="reload">Recharger</button>
        <button
          v-if="archive && active.id !== defaultTheme.id"
          type="button"
          class="px-4 py-2 rounded border border-zinc-600 hover:border-cyan-400"
          @click="setTheme(defaultTheme.id)"
        >
          Revenir à « {{ defaultTheme.name }} »
        </button>
      </div>
    </div>
  </div>
</template>
