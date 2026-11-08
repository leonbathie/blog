<script setup>
import { nextTick, ref, watch } from 'vue'

/**
 * Terminal de mission (Ctrl/⌘ + K).
 * La résolution des commandes est fournie par la forme : ce composant ne gère
 * que la saisie, l'historique affiché et le défilement.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  /** (commande) => { lines: string[], clear?: boolean } */
  resolve: { type: Function, required: true },
})
const emit = defineEmits(['close'])

const input = ref(null)
const output = ref(null)
const value = ref('')
const history = ref([{ text: "Mission Control initialisé. Liaison établie avec Dakar Grid. Tapez 'help'.", tone: 'dim' }])
/** Commandes déjà tapées, rappelables avec les flèches haut/bas */
const typed = ref([])
let cursor = -1

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    input.value?.focus()
  },
)

async function scroll() {
  await nextTick()
  const el = output.value
  if (el) el.scrollTop = el.scrollHeight
}

function submit() {
  const cmd = value.value.trim()
  value.value = ''
  cursor = -1
  if (!cmd) return

  typed.value.push(cmd)
  history.value.push({ text: `> ${cmd}`, tone: 'cmd' })

  const result = props.resolve(cmd)
  if (result.clear) {
    history.value = []
    return
  }
  for (const line of result.lines) history.value.push({ text: line, tone: result.tone ?? 'out' })
  scroll()
}

function recall(step) {
  if (!typed.value.length) return
  cursor = cursor === -1 ? typed.value.length - 1 : Math.min(Math.max(cursor + step, 0), typed.value.length - 1)
  value.value = typed.value[cursor] ?? ''
}

function onKey(event) {
  if (event.key === 'Enter') submit()
  else if (event.key === 'Escape') emit('close')
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    recall(-1)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    recall(1)
  }
}

const toneClass = {
  dim: 'text-slate-400',
  cmd: 'text-slate-200',
  out: 'text-orange-300',
  err: 'text-rose-300',
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[90] flex items-start justify-center bg-black/85 px-4 pt-20 backdrop-blur-md sm:pt-24"
    role="dialog"
    aria-modal="true"
    aria-label="Terminal de mission"
    @click.self="emit('close')"
  >
    <div class="ms-card w-full max-w-3xl overflow-hidden border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
      <div class="flex items-center justify-between gap-3 border-b border-orange-500/40 bg-black/90 p-4 font-techmono text-xs text-orange-400">
        <span class="font-orbitron font-bold tracking-widest">[MISSION CONTROL CLI]</span>
        <button
          type="button"
          class="border border-rose-500/40 bg-rose-500/20 px-3 py-1 font-techmono text-rose-300 transition hover:bg-rose-500 hover:text-black"
          @click="emit('close')"
        >
          ABORT [ESC]
        </button>
      </div>

      <div class="space-y-4 p-5">
        <div class="font-techmono text-xs text-slate-400">
          Commandes :
          <code class="text-amber-400">help</code>, <code class="text-amber-400">logs</code>,
          <code class="text-amber-400">open</code>, <code class="text-amber-400">swarm</code>,
          <code class="text-amber-400">pqc</code>, <code class="text-amber-400">orbit</code>,
          <code class="text-amber-400">formes</code>, <code class="text-amber-400">telemetry</code>,
          <code class="text-amber-400">clear</code>
        </div>

        <div class="flex items-center gap-3 border border-orange-500/50 bg-black p-3">
          <span class="font-techmono font-bold text-orange-500">&gt;&gt;</span>
          <label for="ms-cli" class="sr-only">Commande de mission</label>
          <input
            id="ms-cli"
            ref="input"
            v-model="value"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="Entrez une commande de mission…"
            class="w-full bg-transparent font-techmono text-sm text-orange-200 focus:outline-none"
            @keydown="onKey"
          />
        </div>

        <div ref="output" class="max-h-60 space-y-1 overflow-y-auto bg-black/50 p-3 font-techmono text-xs" aria-live="polite">
          <div v-for="(l, i) in history" :key="i" class="whitespace-pre-line" :class="toneClass[l.tone]">{{ l.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
