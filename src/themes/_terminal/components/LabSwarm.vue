<script setup>
import { computed, inject, nextTick, onBeforeUnmount, ref } from 'vue'
import { SWARM_TASKS } from '../labs.js'

/**
 * Lab 3.1 — Essaim d'agents MCP.
 * Le déroulé dépend réellement de la tâche choisie, et les minuteries sont
 * annulées au démontage comme à chaque nouveau lancement.
 */
const terminal = inject('terminal')

const taskId = ref(SWARM_TASKS[0].id)
const task = computed(() => SWARM_TASKS.find((t) => t.id === taskId.value) ?? SWARM_TASKS[0])
const prompt = ref(SWARM_TASKS[0].prompt)
const lines = ref([{ text: "En attente de lancement de l'essaim…", tone: 'idle' }])
const running = ref(false)
const consoleEl = ref(null)

let timers = []
function clearTimers() {
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

/** Changer de tâche recharge la consigne type, tant qu'elle n'a pas été réécrite */
function onTaskChange() {
  const previous = SWARM_TASKS.find((t) => t.prompt === prompt.value)
  if (previous) prompt.value = task.value.prompt
}

async function push(text, tone = 'out') {
  lines.value.push({ text, tone })
  await nextTick()
  const el = consoleEl.value
  if (el) el.scrollTop = el.scrollHeight
}

function deploy() {
  clearTimers()
  running.value = true
  const current = task.value
  const consigne = prompt.value.trim()

  lines.value = [{ text: `Lancement de l'essaim — ${current.label}`, tone: 'warn' }]
  if (consigne) push(`Consigne transmise aux agents : « ${consigne} »`, 'dim')
  terminal.beep(700, 0.08)

  current.agents.forEach((agent, i) => {
    timers.push(
      window.setTimeout(() => {
        push(agent)
        terminal.beep(900 + i * 160, 0.04)
      }, 420 * (i + 1)),
    )
  })

  timers.push(
    window.setTimeout(
      () => {
        push(current.done, 'ok')
        terminal.beep(1300, 0.12)
        terminal.showToast('Essaim MCP déployé')
        running.value = false
      },
      420 * (current.agents.length + 1),
    ),
  )
}

const toneClass = {
  idle: 'text-term-faint',
  dim: 'text-term-dim',
  warn: 'text-term-accent2',
  ok: 'text-term-ok font-bold',
  out: 'text-term-accent',
}

onBeforeUnmount(clearTimers)
</script>

<template>
  <section class="term-card space-y-6 p-6 sm:p-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="font-term-display text-xl font-bold text-term-head sm:text-2xl">Simulateur d'essaim MCP</h3>
      <span
        class="border px-3 py-1 font-term-mono text-xs font-bold"
        :class="running ? 'border-term-accent2/50 bg-term-accent2/15 text-term-accent2' : 'border-term-accent/40 bg-term-accent/15 text-term-accent-lt'"
        role="status"
      >
        {{ running ? 'SWARM_RUNNING' : 'MISSION_ACTIVE' }}
      </span>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div class="space-y-5 lg:col-span-6">
        <div>
          <label for="term-task" class="mb-2 block font-term-body text-sm font-medium text-term-dim">
            Sélectionner la tâche de l'essaim
          </label>
          <select id="term-task" v-model="taskId" class="term-field" @change="onTaskChange">
            <option v-for="t in SWARM_TASKS" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
        </div>

        <div>
          <label for="term-prompt" class="mb-2 block font-term-body text-sm font-medium text-term-dim">
            Instructions spécifiques aux agents
          </label>
          <textarea id="term-prompt" v-model="prompt" rows="3" class="term-field resize-y text-term-accent2" />
        </div>

        <button type="button" class="term-btn term-btn-on w-full py-3" :disabled="running" @click="deploy">
          🚀 Déployer l'essaim d'agents MCP
        </button>
      </div>

      <div class="min-w-0 space-y-3 lg:col-span-6">
        <div class="font-term-body text-sm font-medium text-term-dim">Console de contrôle en temps réel</div>
        <div ref="consoleEl" class="term-console h-60 space-y-1.5 p-4" aria-live="polite">
          <div v-for="(l, i) in lines" :key="i" :class="toneClass[l.tone]">&gt; {{ l.text }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
