<script setup>
import { computed, inject, nextTick, onBeforeUnmount, ref } from 'vue'
import { SWARM_TASKS } from '../labs.js'

/**
 * Lab 3.1 — Essaim d'agents MCP.
 * Le déroulé dépend réellement de la tâche choisie, et les minuteries sont
 * annulées au démontage comme à chaque nouveau lancement.
 */
const mission = inject('mission')

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
  mission.beep(700, 0.08)

  current.agents.forEach((agent, i) => {
    timers.push(
      window.setTimeout(() => {
        push(agent)
        mission.beep(900 + i * 160, 0.04)
      }, 420 * (i + 1)),
    )
  })

  timers.push(
    window.setTimeout(
      () => {
        push(current.done, 'ok')
        mission.beep(1300, 0.12)
        mission.showToast('Essaim MCP déployé')
        running.value = false
      },
      420 * (current.agents.length + 1),
    ),
  )
}

const toneClass = {
  idle: 'text-slate-500',
  dim: 'text-slate-400',
  warn: 'text-amber-400',
  ok: 'text-emerald-400 font-bold',
  out: 'text-orange-400',
}

onBeforeUnmount(clearTimers)
</script>

<template>
  <section class="ms-card space-y-6 p-6 sm:p-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="font-orbitron text-xl font-bold text-white sm:text-2xl">Simulateur d'essaim MCP</h3>
      <span
        class="border px-3 py-1 font-techmono text-xs font-bold"
        :class="running ? 'border-amber-500/50 bg-amber-500/15 text-amber-300' : 'border-orange-500/40 bg-orange-500/15 text-orange-300'"
        role="status"
      >
        {{ running ? 'SWARM_RUNNING' : 'MISSION_ACTIVE' }}
      </span>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div class="space-y-5 lg:col-span-6">
        <div>
          <label for="ms-task" class="mb-2 block font-grotesk text-sm font-medium text-slate-400">
            Sélectionner la tâche de l'essaim
          </label>
          <select id="ms-task" v-model="taskId" class="ms-field" @change="onTaskChange">
            <option v-for="t in SWARM_TASKS" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
        </div>

        <div>
          <label for="ms-prompt" class="mb-2 block font-grotesk text-sm font-medium text-slate-400">
            Instructions spécifiques aux agents
          </label>
          <textarea id="ms-prompt" v-model="prompt" rows="3" class="ms-field resize-y text-amber-300" />
        </div>

        <button type="button" class="ms-btn ms-btn-on w-full py-3" :disabled="running" @click="deploy">
          🚀 Déployer l'essaim d'agents MCP
        </button>
      </div>

      <div class="min-w-0 space-y-3 lg:col-span-6">
        <div class="font-grotesk text-sm font-medium text-slate-400">Console de contrôle en temps réel</div>
        <div ref="consoleEl" class="ms-console h-60 space-y-1.5 p-4" aria-live="polite">
          <div v-for="(l, i) in lines" :key="i" :class="toneClass[l.tone]">&gt; {{ l.text }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
