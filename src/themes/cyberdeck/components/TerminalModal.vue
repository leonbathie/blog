<script setup>
import { inject, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { SHAPES } from '../deck.js'
import { useThemes } from '../../../core/themes.js'

/** Terminal (Ctrl+K) : commandes rapides pour piloter la géométrie 3D et naviguer. */
const deck = inject('deck')
const router = useRouter()
const { themes, active, archive, setTheme } = useThemes()

const input = ref(null)
const field = ref('')
const lines = ref([
  { tone: 'emerald', text: 'WebGL Three.js Neural Core initialisé (1400 particules actives).' },
  { tone: 'slate', text: "Tapez 'help' ou utilisez les boutons 3D pour morpher l'espace." },
])

watch(
  () => deck.state.terminalOpen,
  async (open) => {
    if (!open) return
    await nextTick()
    input.value?.focus()
  },
)

function push(text, tone = 'cyan') {
  lines.value.push({ tone, text })
}

function run() {
  const cmd = field.value.trim().toLowerCase()
  field.value = ''
  if (!cmd) return
  push(`> ${cmd}`, 'slate')

  if (cmd === 'help') {
    push("Commandes : shape 0..3, glitch, pqc, github, nexus, arena, formes, forme <n>, clear")
  } else if (cmd === 'clear') {
    lines.value = []
  } else if (cmd.startsWith('shape ')) {
    const n = Math.max(0, Math.min(3, parseInt(cmd.split(' ')[1], 10) || 0))
    deck.setShape(n)
    push(`Morphing 3D → ${SHAPES[n].name}.`)
  } else if (cmd === 'glitch') {
    router.push({ name: 'lab', params: { module: 'glitch' } })
    close()
  } else if (cmd === 'pqc') {
    router.push({ name: 'lab', params: { module: 'pqc' } })
    close()
  } else if (cmd === 'github') {
    router.push({ name: 'projects' })
    close()
  } else if (cmd === 'nexus') {
    router.push({ name: 'home' })
    close()
  } else if (cmd === 'arena') {
    router.push({ name: 'arena' })
    close()
  } else if (cmd === 'formes') {
    push('Formes disponibles : ' + themes.map((t, i) => `${i + 1}=${t.name}`).join(', '))
  } else if (cmd.startsWith('forme ')) {
    const target = cmd.split(' ')[1]
    if (!archive) push('Archives de formes désactivées.', 'rose')
    else if (setTheme(target)) push(`Forme active : ${active.value.name}.`, 'emerald')
    else push(`Forme inconnue : « ${target} ». Tapez 'formes'.`, 'rose')
  } else {
    push("Commande inconnue. Tapez 'help'.", 'rose')
  }
}

function close() {
  deck.state.terminalOpen = false
}

const TONES = { emerald: 'text-emerald-400', slate: 'text-slate-400', cyan: 'text-cyan-300', rose: 'text-rose-400' }
</script>

<template>
  <div
    v-if="deck.state.terminalOpen"
    class="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/80 px-4 pt-24 font-mono backdrop-blur-xl"
    @click.self="close"
  >
    <div class="spatial-panel w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-400/50 shadow-[0_0_80px_rgba(0,240,255,0.2)]" role="dialog" aria-modal="true" aria-label="Terminal">
      <div class="flex items-center justify-between border-b border-cyan-500/20 bg-slate-950/90 p-4 text-xs">
        <div class="flex items-center gap-2 text-cyan-400">
          <span class="h-2 w-2 rounded-full bg-cyan-400" />
          <span class="font-bold tracking-wider">SPATIAL KERNEL TERMINAL // {{ active.name.toUpperCase() }}</span>
        </div>
        <button type="button" class="rounded border border-rose-500/40 bg-rose-500/20 px-2.5 py-1 text-rose-300 transition hover:bg-rose-500 hover:text-black" @click="close">ESC</button>
      </div>
      <div class="space-y-4 p-5">
        <div class="text-xs text-slate-400">
          Commandes : <code class="text-cyan-300">help</code>, <code class="text-cyan-300">shape 0..3</code>, <code class="text-cyan-300">glitch</code>, <code class="text-cyan-300">github</code>, <code class="text-cyan-300">pqc</code>, <code class="text-cyan-300">formes</code>, <code class="text-cyan-300">clear</code>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-slate-950/90 p-3.5">
          <span class="font-bold text-cyan-400">ousmane@dakar-3d:~#</span>
          <input
            ref="input"
            v-model="field"
            type="text"
            class="w-full bg-transparent text-sm text-cyan-100 focus:outline-none"
            placeholder="Exécuter une commande ou changer la géométrie 3D..."
            @keydown.enter="run"
            @keydown.escape="close"
          />
        </div>
        <div class="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/60 p-3 text-xs">
          <div v-for="(line, i) in lines" :key="i" :class="TONES[line.tone]">&gt; {{ line.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
