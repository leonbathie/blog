<script setup>
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articles, profile } from '../../content/index.js'
import { useThemes } from '../../core/themes.js'
import { useUtcClock } from '../../core/useClock.js'
import { copyText } from '../../core/clipboard.js'
import { readPref, writePref } from '../../core/prefs.js'
import { tone } from '../../core/audio.js'
import { createRadar } from './radar.js'
import { LAB_MODULES, MODULE_ALIASES } from './labs.js'
import CommandLine from './components/CommandLine.vue'
import ArticlesView from './components/ArticlesView.vue'
import SystemsView from './components/SystemsView.vue'
import LabView from './components/LabView.vue'
import AboutView from './components/AboutView.vue'
import './theme.css'

/*
 * Forme 4 — « Mission Control »
 * Poste de contrôle de vol : barre de télémétrie, pont de commandement,
 * radar d'arrière-plan et terminal de mission (Ctrl/⌘ + K).
 */

const route = useRoute()
const router = useRouter()
const { themes, active, archive, setTheme, number } = useThemes()
const root = document.documentElement

/* ---------- Préférences ---------- */
const sfxOn = ref(readPref('ms:sfx', '1') === '1')
const radarOn = ref(readPref('ms:radar', '1') === '1')
watch(sfxOn, (v) => writePref('ms:sfx', v ? '1' : '0'))

/* ---------- Son ---------- */
function beep(freq = 850, duration = 0.04) {
  if (!sfxOn.value) return
  tone({ freq, type: 'triangle', duration, gain: 0.02 })
}

/* ---------- Notifications ---------- */
const toast = reactive({ msg: '', show: false })
let toastTimer = 0
function showToast(msg) {
  toast.msg = msg
  toast.show = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.show = false), 2600)
}

provide('mission', { beep, showToast })

/* ---------- Radar ---------- */
const radarCanvas = ref(null)
let radar = null
watch(radarOn, (on) => {
  writePref('ms:radar', on ? '1' : '0')
  if (!radar) return
  if (on) radar.start()
  else radar.stop()
})
function toggleRadar() {
  radarOn.value = !radarOn.value
  beep(radarOn.value ? 1000 : 600, 0.05)
  showToast(radarOn.value ? 'Radar orbital activé' : 'Radar orbital coupé')
}
function toggleSfx() {
  sfxOn.value = !sfxOn.value
  showToast(sfxOn.value ? 'Audio de mission activé' : 'Audio coupé')
  if (sfxOn.value) beep(1100, 0.06)
}

/* ---------- Sections ---------- */
const view = computed(
  () => ({ projects: 'systems', lab: 'lab', arena: 'lab', about: 'about' })[route.name] ?? 'home',
)

/** Un module inconnu (venu d'une autre forme) est rapproché du plus proche d'ici */
const labModule = computed(() => {
  const asked = route.params.module
  if (LAB_MODULES.some((m) => m.id === asked)) return asked
  return MODULE_ALIASES[asked] ?? 'mcp'
})
const lastLab = ref(labModule.value)
watch(labModule, (m) => (lastLab.value = m))

const TABS = computed(() => [
  { view: 'home', code: 'LOG 01', label: 'MONOGRAPHIES DE RECHERCHE', to: { name: 'home' } },
  { view: 'systems', code: 'LOG 02', label: 'GITHUB & ARTEFACTS SWARM', to: { name: 'projects' } },
  { view: 'lab', code: 'LOG 03', label: 'LABO ORBITAL & PQC', to: { name: 'lab', params: { module: lastLab.value } } },
  { view: 'about', code: 'LOG 04', label: 'STRATÉGIE 2050', to: { name: 'about' } },
])

const top = ref(null)
watch(view, () => {
  beep(750, 0.05)
  const el = top.value
  if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
})

/* ---------- Articles ---------- */
const filter = ref('all')
const selected = computed(
  () => (route.name === 'article' ? articles.find((a) => a.slug === route.params.slug) : null) ?? articles[0] ?? null,
)
watch(
  () => selected.value?.slug,
  (slug, previous) => previous && slug !== previous && beep(850, 0.04),
)

function selectArticle(slug) {
  router.push({ name: 'article', params: { slug } })
}
function openLab(module) {
  router.push({ name: 'lab', params: { module: MODULE_ALIASES[module] ?? module } })
}
async function copyBibtex() {
  if (!selected.value) return
  showToast((await copyText(selected.value.bibtex)) ? 'BibTeX copié' : 'La copie a échoué')
}

/* ---------- Terminal de mission ---------- */
const cliOpen = ref(false)

function resolveCommand(raw) {
  const [verb, ...rest] = raw.toLowerCase().split(/\s+/)
  const arg = rest.join(' ')

  switch (verb) {
    case 'help':
      return {
        lines: [
          'logs            liste les monographies',
          'open <n|slug>   ouvre une monographie',
          'swarm           labo 3.1 — essaim MCP',
          'pqc             labo 3.2 — réseau Kyber',
          'orbit           labo 3.3 — télémétrie orbitale',
          'systems         répertoire des systèmes',
          'formes          liste les formes du blog',
          'forme <id>      bascule vers une forme',
          'telemetry       état de la mission',
          'clear           efface le terminal',
        ],
      }

    case 'logs':
      return { lines: articles.map((a, i) => `${String(i + 1).padStart(2, '0')}  ${a.slug}  —  ${a.title}`) }

    case 'open': {
      if (!arg) return { lines: ['Usage : open <numéro ou slug>'], tone: 'err' }
      const byIndex = Number(arg)
      const found = Number.isInteger(byIndex) ? articles[byIndex - 1] : articles.find((a) => a.slug === arg)
      if (!found) return { lines: [`Monographie introuvable : ${arg}`], tone: 'err' }
      selectArticle(found.slug)
      cliOpen.value = false
      return { lines: [`Ouverture : ${found.title}`] }
    }

    case 'swarm':
    case 'pqc':
    case 'orbit': {
      const module = { swarm: 'mcp', pqc: 'pqc', orbit: 'hologram' }[verb]
      router.push({ name: 'lab', params: { module } })
      cliOpen.value = false
      return { lines: [`Ouverture du module ${module.toUpperCase()}.`] }
    }

    case 'systems':
      router.push({ name: 'projects' })
      cliOpen.value = false
      return { lines: ['Ouverture du répertoire des systèmes.'] }

    case 'formes':
      return { lines: themes.map((t) => `${number(t)}. ${t.id}${t.id === active.value.id ? '  ← active' : ''}  —  ${t.name}`) }

    case 'forme': {
      const target = themes.find((t) => t.id === arg)
      if (!target) return { lines: [`Forme inconnue : ${arg || '(vide)'}. Tapez « formes ».`], tone: 'err' }
      if (!archive) return { lines: ['Le changement de forme est désactivé sur ce site.'], tone: 'err' }
      cliOpen.value = false
      setTheme(target.id)
      return { lines: [`Bascule vers « ${target.name} ».`] }
    }

    case 'telemetry':
      return {
        lines: [
          `Centre de contrôle : ${profile.city}`,
          `Monographies en ligne : ${articles.length}`,
          `Forme active : ${active.value.name} (${number(active.value)}/${themes.length})`,
          'Protocole KEM : Kyber-1024 — statut nominal',
        ],
      }

    case 'clear':
      return { clear: true, lines: [] }

    default:
      return { lines: [`Commande non reconnue : ${verb}. Tapez « help ».`], tone: 'err' }
  }
}

function onKey(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    cliOpen.value = !cliOpen.value
  } else if (event.key === 'Escape') {
    cliOpen.value = false
  }
}

/* ---------- Divers ---------- */
const utc = useUtcClock(' UTC')
const others = computed(() => themes.filter((t) => t.id !== active.value.id))
const nameParts = computed(() => {
  const parts = profile.name.split(' ')
  return { head: parts.slice(0, -1).join(' '), tail: parts[parts.length - 1] }
})

onMounted(() => {
  document.title = 'Ousmane Ba — AI Research, Cyber-Physical Systems & Security'
  root.classList.add('dark')
  window.addEventListener('keydown', onKey)
  if (radarCanvas.value) {
    radar = createRadar(radarCanvas.value)
    if (radarOn.value) radar.start()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(toastTimer)
  radar?.dispose()
  root.classList.remove('dark')
})
</script>

<template>
  <div class="theme-mission relative flex min-h-screen flex-col font-grotesk antialiased">
    <canvas v-show="radarOn" ref="radarCanvas" class="ms-radar" aria-hidden="true" />

    <!-- Notification -->
    <div
      role="status"
      aria-live="polite"
      class="ms-card pointer-events-none fixed bottom-6 right-6 z-[80] flex items-center gap-3 border-orange-500/60 px-5 py-3 font-techmono text-xs text-orange-400 transition-all duration-300"
      :class="toast.show ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'"
    >
      <span class="h-2.5 w-2.5 bg-orange-500" :class="toast.show ? 'animate-ping' : ''" />
      <span>{{ toast.msg }}</span>
    </div>

    <CommandLine :open="cliOpen" :resolve="resolveCommand" @close="cliOpen = false" />

    <!-- Barre de télémétrie -->
    <div class="sticky top-0 z-50 border-b border-orange-500/30 bg-black/90 font-techmono text-xs backdrop-blur-xl">
      <div class="mx-auto flex min-h-[3rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div class="no-scrollbar flex min-w-0 items-center gap-4 overflow-x-auto py-1">
          <span class="flex shrink-0 items-center gap-2">
            <span class="h-2.5 w-2.5 animate-pulse bg-orange-500" />
            <span class="font-orbitron font-bold tracking-widest text-orange-400">MISSION_ID: OUSMANE_BA_2050</span>
          </span>
          <span class="text-slate-700">|</span>
          <span class="shrink-0 text-amber-400">SECTEUR: DAKAR_ORBIT_01</span>
          <span class="hidden text-slate-700 sm:inline">|</span>
          <span class="hidden shrink-0 text-sky-400 sm:inline">STATUS: NOMINAL</span>
          <span class="hidden text-slate-700 md:inline">|</span>
          <span class="hidden shrink-0 text-slate-300 md:inline">MET: <strong class="text-orange-300">{{ utc }}</strong></span>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <button type="button" class="ms-btn px-3 py-1.5" :aria-pressed="sfxOn" title="Audio de mission" @click="toggleSfx">
            <span aria-hidden="true">{{ sfxOn ? '🔊' : '🔇' }}</span>
            <span class="hidden sm:inline">AUDIO</span>
          </button>
          <button type="button" class="ms-btn px-3 py-1.5" :aria-pressed="radarOn" title="Radar orbital" @click="toggleRadar">
            RADAR
          </button>
          <button type="button" class="ms-btn px-3 py-1.5" title="Terminal de mission (Ctrl+K)" @click="cliOpen = true">
            CLI [^K]
          </button>
        </div>
      </div>
    </div>

    <div class="relative z-[1] mx-auto w-full max-w-7xl flex-1 space-y-12 px-4 py-10 sm:px-6">
      <!-- Pont de commandement -->
      <header class="ms-card relative overflow-hidden p-6 sm:p-10 lg:p-12">
        <div class="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" aria-hidden="true" />

        <div class="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div class="space-y-6 lg:col-span-8">
            <div class="inline-flex items-center gap-2 border border-orange-500/40 bg-orange-500/10 px-3 py-1 font-techmono text-xs text-orange-300">
              <span class="h-1.5 w-1.5 bg-orange-500" aria-hidden="true" />
              {{ profile.focus.toUpperCase() }}
            </div>

            <h1 class="font-orbitron text-4xl font-black uppercase tracking-tight text-white sm:text-6xl lg:text-7xl">
              {{ nameParts.head }}
              <span class="ms-glow bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400 bg-clip-text text-transparent">
                {{ nameParts.tail }}
              </span>
            </h1>

            <p class="max-w-2xl font-grotesk text-base font-light leading-relaxed text-slate-300 sm:text-lg">
              {{ profile.tagline.fr }}
            </p>

            <div class="flex flex-wrap gap-3 pt-1">
              <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="ms-btn ms-btn-on">
                GITHUB @{{ profile.handle }} ↗
              </a>
              <a :href="profile.links.linkedin" target="_blank" rel="noopener noreferrer" class="ms-btn">LINKEDIN HUSARY ↗</a>
              <a :href="`mailto:${profile.links.email}`" class="ms-btn">CONTACT</a>
            </div>
          </div>

          <!-- Télémétrie : les chiffres clés, cliquables -->
          <div class="ms-card space-y-4 p-6 font-techmono text-xs lg:col-span-4">
            <div class="flex items-center justify-between border-b border-orange-500/30 pb-3">
              <span class="font-orbitron font-bold text-orange-400">ORBITAL_TELEMETRY</span>
              <span class="font-bold text-emerald-400">ONLINE</span>
            </div>
            <div class="space-y-3">
              <button
                v-for="h in profile.highlights"
                :key="h.label"
                type="button"
                class="flex w-full items-baseline justify-between gap-3 text-left transition hover:text-orange-300"
                :title="`Filtrer les monographies : ${h.label}`"
                @click="filter = h.category; view !== 'home' && router.push({ name: 'home' })"
              >
                <span class="text-slate-500">{{ h.label }}</span>
                <span class="shrink-0 font-bold text-orange-400">{{ h.value }}</span>
              </button>
              <div class="flex justify-between border-t border-orange-500/20 pt-3">
                <span class="text-slate-500">Centre de contrôle</span>
                <span class="text-sky-300">{{ profile.city }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Onglets -->
        <nav class="mt-8 flex flex-wrap gap-3 border-t border-orange-500/30 pt-6" aria-label="Journaux de mission">
          <RouterLink
            v-for="t in TABS"
            :key="t.view"
            :to="t.to"
            class="ms-btn"
            :class="view === t.view ? 'ms-btn-on' : ''"
            :aria-current="view === t.view ? 'page' : undefined"
          >
            [{{ t.code }}] {{ t.label }}
          </RouterLink>
        </nav>
      </header>

      <div ref="top" class="scroll-mt-16" />

      <ArticlesView
        v-show="view === 'home'"
        v-model:filter="filter"
        :selected="selected"
        @select="selectArticle"
        @copy-bibtex="copyBibtex"
        @open-lab="openLab"
      />
      <SystemsView v-if="view === 'systems'" />
      <LabView v-if="view === 'lab'" :module="labModule" />
      <AboutView v-if="view === 'about'" />
    </div>

    <!-- Pied -->
    <footer class="relative z-[1] mt-12 border-t border-orange-500/30 py-8 font-techmono text-xs text-slate-500">
      <div class="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center sm:px-6">
        <div>{{ profile.name.toUpperCase() }} // MISSION CONTROL {{ profile.city.toUpperCase() }} // 2026-2050 FLIGHT READY</div>
        <div v-if="archive" class="flex flex-wrap items-center justify-center gap-2">
          <span>FORME {{ number(active) }}/{{ themes.length }} · {{ active.name.toUpperCase() }}</span>
          <button v-for="t in others" :key="t.id" type="button" class="ms-btn px-3 py-1.5" :title="t.summary" @click="setTheme(t.id)">
            {{ number(t) }}. {{ t.name }}
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>
