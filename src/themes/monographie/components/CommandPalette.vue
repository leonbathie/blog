<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  commands: { type: Array, default: () => [] },
})
const emit = defineEmits(['close'])

const query = ref('')
const index = ref(0)
const input = ref(null)
const list = ref(null)

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? props.commands.filter((c) => c.label.toLowerCase().includes(q)) : props.commands
})

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    query.value = ''
    index.value = 0
    await nextTick()
    input.value?.focus()
  },
)
watch(query, () => (index.value = 0))

function run(command) {
  emit('close')
  command.run()
}

function move(step) {
  if (!matches.value.length) return
  index.value = (index.value + step + matches.value.length) % matches.value.length
  nextTick(() => list.value?.children[index.value]?.scrollIntoView({ block: 'nearest' }))
}

function onKey(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    const command = matches.value[index.value]
    if (command) run(command)
  } else if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[65] flex items-start justify-center bg-black/60 px-4 pt-20 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-lg overflow-hidden rounded-lg border border-mono-line bg-mono-panel shadow-2xl" role="dialog" aria-modal="true" aria-label="Palette de commandes">
      <div class="flex items-center gap-2 border-b border-mono-line p-3 font-mono text-xs">
        <span class="font-bold text-mono-accent">&gt;_</span>
        <input
          ref="input"
          v-model="query"
          type="text"
          class="w-full bg-transparent text-mono-ink focus:outline-none"
          placeholder="Tapez une commande ou recherchez un papier (ex: Pulaar, Weibull, Faulty Cat, BibTeX)..."
          @keydown="onKey"
        />
        <button type="button" class="rounded border border-mono-line px-1.5 py-0.5 text-[10px] text-mono-muted" @click="emit('close')">ESC</button>
      </div>
      <div ref="list" class="max-h-64 space-y-1 overflow-y-auto p-2 font-mono text-xs">
        <button
          v-for="(command, i) in matches"
          :key="command.label"
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left transition"
          :class="i === index ? 'bg-mono-accent/15 text-mono-accent' : 'text-mono-ink hover:bg-mono-accent/10'"
          @click="run(command)"
          @mousemove="index = i"
        >
          <span>{{ command.label }}</span>
          <span class="text-[10px] text-mono-muted">↵</span>
        </button>
        <div v-if="!matches.length" class="px-3 py-2 text-mono-muted">Aucune commande ne correspond.</div>
      </div>
    </div>
  </div>
</template>
