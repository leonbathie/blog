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
  dim: 'text-term-dim',
  cmd: 'text-term-ink',
  out: 'text-term-accent-lt',
  err: 'text-term-alert',
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[90] flex items-start justify-center bg-term-void/85 px-4 pt-20 backdrop-blur-md sm:pt-24"
    role="dialog"
    aria-modal="true"
    aria-label="Terminal de mission"
    @click.self="emit('close')"
  >
    <div class="term-card w-full max-w-3xl overflow-hidden border-term-accent term-modal-glow">
      <div class="flex items-center justify-between gap-3 border-b border-term-accent/40 bg-term-void/90 p-4 font-term-mono text-xs text-term-accent">
        <span class="font-term-display font-bold tracking-widest">[MISSION CONTROL CLI]</span>
        <button
          type="button"
          class="border border-term-alert/40 bg-term-alert/20 px-3 py-1 font-term-mono text-term-alert transition hover:bg-term-alert hover:text-term-void"
          @click="emit('close')"
        >
          ABORT [ESC]
        </button>
      </div>

      <div class="space-y-4 p-5">
        <div class="font-term-mono text-xs text-term-dim">
          Commandes :
          <code class="text-term-accent2">help</code>, <code class="text-term-accent2">logs</code>,
          <code class="text-term-accent2">open</code>, <code class="text-term-accent2">swarm</code>,
          <code class="text-term-accent2">pqc</code>, <code class="text-term-accent2">orbit</code>,
          <code class="text-term-accent2">formes</code>, <code class="text-term-accent2">telemetry</code>,
          <code class="text-term-accent2">clear</code>
        </div>

        <div class="flex items-center gap-3 border border-term-accent/50 bg-term-void p-3">
          <span class="font-term-mono font-bold text-term-accent">&gt;&gt;</span>
          <label for="term-cli" class="sr-only">Commande de mission</label>
          <input
            id="term-cli"
            ref="input"
            v-model="value"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="Entrez une commande de mission…"
            class="w-full bg-transparent font-term-mono text-sm text-term-accent-lt focus:outline-none"
            @keydown="onKey"
          />
        </div>

        <div ref="output" class="max-h-60 space-y-1 overflow-y-auto bg-term-void/50 p-3 font-term-mono text-xs" aria-live="polite">
          <div v-for="(l, i) in history" :key="i" class="whitespace-pre-line" :class="toneClass[l.tone]">{{ l.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
