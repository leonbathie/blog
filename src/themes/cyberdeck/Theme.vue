<script setup>
import { computed, KeepAlive, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { articles } from '../../content/index.js'
import { createDeck, LAB_SHAPES, shapeForCategory } from './deck.js'
import { DeckScene } from './engine.js'
import HudHeader from './components/HudHeader.vue'
import TelemetrySpine from './components/TelemetrySpine.vue'
import TerminalModal from './components/TerminalModal.vue'
import DockNav from './components/DockNav.vue'
import NexusView from './components/NexusView.vue'
import PapersView from './components/PapersView.vue'
import GithubView from './components/GithubView.vue'
import LabView from './components/LabView.vue'
import ArenaView from './components/ArenaView.vue'
import './theme.css'

/*
 * Forme 2 — « Cyber-deck 3D »
 * Poste de pilotage spatial : noyau WebGL (Three.js) en arrière-plan, espaces de travail
 * en panneaux de verre, dock flottant, terminal (Ctrl+K) et arène de drones.
 */

const route = useRoute()
const deck = createDeck()
provide('deck', deck)

/* ---------- Espaces de travail (pilotés par l'URL) ---------- */
const WORKSPACES = { articles: 'papers', article: 'papers', projects: 'github', lab: 'lab', arena: 'arena' }
const workspace = computed(() => WORKSPACES[route.name] ?? 'nexus')

const LAB_TABS = ['glitch', 'pqc', 'weibull']
const labTab = computed(() => (LAB_TABS.includes(route.params.module) ? route.params.module : 'glitch'))

const selectedArticle = computed(
  () => (route.name === 'article' ? articles.find((a) => a.slug === route.params.slug) : null) ?? articles[0] ?? null,
)

const VIEWS = { nexus: NexusView, papers: PapersView, github: GithubView, lab: LabView, arena: ArenaView }
const viewProps = computed(() => {
  if (workspace.value === 'papers') return { article: selectedArticle.value }
  if (workspace.value === 'lab') return { tab: labTab.value }
  return {}
})

/* ---------- Géométrie 3D associée à ce qui est affiché ---------- */
const WORKSPACE_SHAPES = { nexus: 0, github: 2, arena: 1 }
const targetShape = computed(() => {
  if (workspace.value === 'papers') return shapeForCategory(selectedArticle.value?.category)
  if (workspace.value === 'lab') return LAB_SHAPES[labTab.value]
  return WORKSPACE_SHAPES[workspace.value] ?? 0
})
watch(targetShape, (shape) => deck.setShape(shape))
watch(workspace, () => {
  deck.synth(680)
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
watch(labTab, () => {
  if (workspace.value === 'lab') deck.synth(820)
})

/* ---------- Clavier : Ctrl+K terminal, ESPACE / F salve orbitale ---------- */
const isTyping = (el) => Boolean(el) && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)

function onKey(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    deck.state.terminalOpen = !deck.state.terminalOpen
    return
  }
  if (event.key === 'Escape') {
    deck.state.terminalOpen = false
    deck.state.themesOpen = false
    return
  }
  if (event.ctrlKey || event.metaKey || event.altKey || deck.state.terminalOpen || isTyping(document.activeElement)) return
  // La barre espace reste réservée au défilement sur les pages de lecture
  const isFireKey = event.key.toLowerCase() === 'f' || (event.code === 'Space' && ['nexus', 'arena'].includes(workspace.value))
  if (isFireKey) {
    event.preventDefault()
    deck.fire()
  }
}

/* ---------- Scène 3D ---------- */
const webglEl = ref(null)
let scene = null

onMounted(() => {
  document.title = 'OUSMANE BA // SPATIAL 3D CYBER-DECK & AI RESEARCH LAB'
  deck.setShape(targetShape.value, { silent: true })
  try {
    scene = new DeckScene(webglEl.value, {
      onShoot: (x, y) => deck.shootAt(x, y),
      onRotate: (x, y) => {
        deck.state.rotation.x = x
        deck.state.rotation.y = y
      },
    })
    scene.setShape(targetShape.value)
    deck.attachScene(scene)
  } catch (error) {
    console.warn('[cyberdeck] WebGL indisponible : affichage sans scène 3D.', error)
    deck.attachScene(null)
  }
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  deck.dispose()
  scene?.dispose()
  scene = null
})
</script>

<template>
  <div class="theme-cyberdeck relative min-h-screen text-slate-200">
    <div
      ref="webglEl"
      class="cd-webgl"
      :class="{ 'cd-no-webgl': !deck.state.webgl }"
      title="CLIC : tirer au canon EMP 3D • GLISSER : tourner la caméra • F / ESPACE : salve orbitale"
    />
    <div class="cd-vignette" />

    <!-- Textes de combat -->
    <div class="pointer-events-none fixed inset-0 z-[75] overflow-hidden" aria-hidden="true">
      <div
        v-for="f in deck.state.floats"
        :key="f.id"
        class="cd-float text-sm sm:text-base"
        :style="{ left: `${f.x}px`, top: `${f.y}px`, color: f.color, textShadow: `0 0 12px ${f.color}` }"
      >
        {{ f.text }}
      </div>
    </div>

    <!-- Barre d'expérience -->
    <div class="fixed inset-x-0 top-0 z-[60] h-1 bg-slate-900/90">
      <div
        class="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400 shadow-[0_0_12px_#00f0ff] transition-all duration-300"
        :style="{ width: `${deck.state.stats.xp}%` }"
      />
    </div>

    <!-- Notification -->
    <div
      role="status"
      aria-live="polite"
      class="spatial-panel pointer-events-none fixed right-4 top-20 z-[90] flex items-center gap-3 rounded-xl border border-cyan-400/50 px-4 py-3 font-mono text-xs transition-all duration-300 sm:right-6"
      :class="deck.state.toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'"
    >
      <span class="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
      <span class="text-cyan-200">{{ deck.state.toast.msg }}</span>
    </div>

    <TerminalModal />
    <HudHeader />
    <TelemetrySpine />

    <main class="cd-main relative z-20 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pb-32 pt-24 sm:px-8">
      <KeepAlive>
        <component :is="VIEWS[workspace]" v-bind="viewProps" />
      </KeepAlive>
    </main>

    <DockNav :workspace="workspace" />
  </div>
</template>
