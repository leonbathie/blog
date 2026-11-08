<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import katex from 'katex'
import { articles, profile } from '../../content/index.js'
import { useThemes } from '../../core/themes.js'
import { useUtcClock } from '../../core/useClock.js'
import { copyText } from '../../core/clipboard.js'
import { readPref, writePref } from '../../core/prefs.js'
import { createSfx } from './sfx.js'
import { LAB_MODULES } from './labs.js'
import ParticleOverlay from './components/ParticleOverlay.vue'
import ArcadeStage from './components/ArcadeStage.vue'
import CommandPalette from './components/CommandPalette.vue'
import ArticlesView from './components/ArticlesView.vue'
import SystemsView from './components/SystemsView.vue'
import PlaygroundView from './components/PlaygroundView.vue'
import AboutView from './components/AboutView.vue'
import './theme.css'

/*
 * Forme 1 — « Monographie »
 * Carnet de recherche éditorial : papier / obsidienne, lecteur d'articles,
 * laboratoire interactif (3 simulateurs) et mini-jeu 8-bit.
 */

const route = useRoute()
const router = useRouter()
const { themes, active, archive, setTheme, number } = useThemes()
const root = document.documentElement

/* ---------- Préférences du visiteur ---------- */
const dark = ref(readPref('mono:dark', '1') === '1')
const sfxOn = ref(readPref('mono:sfx', '1') === '1')
const lang = ref('fr')
watch(
  dark,
  (value) => {
    root.classList.toggle('dark', value)
    writePref('mono:dark', value ? '1' : '0')
  },
  { immediate: true },
)
watch(sfxOn, (value) => writePref('mono:sfx', value ? '1' : '0'))
const sfx = createSfx(sfxOn)

/* ---------- Notifications ---------- */
const toast = reactive({ msg: '', show: false })
let toastTimer = 0
function showToast(msg) {
  toast.msg = msg
  toast.show = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.show = false), 2600)
}

/* ---------- HUD arcade : score, jetons, turbo ---------- */
const score = ref(4850)
const coins = ref(24)
const overlay = ref(null)
const firstName = profile.name.split(' ')[0].toUpperCase()

function addScore(points = 200, tokens = 1) {
  score.value += points
  coins.value += tokens
}
function coinBurst(x, y, count = 4, label = '+200') {
  sfx.blip()
  addScore(200 * count, count)
  overlay.value?.burst(x, y, count, label)
}

let turboTimer = 0
function triggerTurbo() {
  sfx.fanfare()
  root.classList.add('mono-turbo')
  coinBurst(window.innerWidth / 2, 120, 8, '★ TURBO ★')
  showToast('⚡ MODE TURBO : le labo tourne en surcadençage !')
  window.clearTimeout(turboTimer)
  turboTimer = window.setTimeout(() => root.classList.remove('mono-turbo'), 4200)
}
function toggleSfx() {
  sfxOn.value = !sfxOn.value
  showToast(sfxOn.value ? 'Bruitages 8-bit activés !' : 'Bruitages 8-bit coupés')
  sfx.blip()
}

provide('mono', { sfx, addScore, coinBurst, showToast })

/* ---------- Sections (pilotées par l'URL) ---------- */
const view = computed(() => ({ projects: 'systems', lab: 'playground', about: 'about' })[route.name] ?? 'home')
const labModule = computed(() =>
  LAB_MODULES.some((m) => m.id === route.params.module) ? route.params.module : 'weibull',
)
const lastLabModule = ref(labModule.value)
watch(labModule, (module) => (lastLabModule.value = module))

const navItems = computed(() => [
  { view: 'home', label: '01. MONOGRAPHIES & ARTICLES', to: { name: 'home' } },
  { view: 'systems', label: '02. ARTEFACTS & CLUSTERS', to: { name: 'projects' } },
  {
    view: 'playground',
    label: `03. LABORATOIRE INTERACTIF (${LAB_MODULES.length} SIMULATEURS)`,
    to: { name: 'lab', params: { module: lastLabModule.value } },
    dot: true,
  },
  { view: 'about', label: '04. BIO & ÉCOSYSTÈME', to: { name: 'about' } },
])

const viewsTop = ref(null)
watch(view, () => {
  sfx.whoosh()
  // Si l'on était descendu dans un long article, on remonte au début de la nouvelle section
  const el = viewsTop.value
  if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
})

/* ---------- Articles ---------- */
const filter = ref('all')
const query = ref('')
const selected = computed(
  () => (route.name === 'article' ? articles.find((a) => a.slug === route.params.slug) : null) ?? articles[0] ?? null,
)
watch(
  () => selected.value?.slug,
  (slug, previous) => {
    if (previous && slug !== previous) {
      sfx.blip()
      addScore(100, 1)
    }
  },
)

function selectArticle(slug) {
  router.push({ name: 'article', params: { slug } })
}
function openLab(module) {
  router.push({ name: 'lab', params: { module } })
}
async function copyBibtex() {
  if (!selected.value) return
  const ok = await copyText(selected.value.bibtex)
  showToast(ok ? 'Citation BibTeX copiée dans le presse-papiers' : 'Erreur lors de la copie')
}

/* ---------- Chiffres clés (puces de données) ---------- */
const CARD_ICONS = ['🎙️', '⚙️', '🌍', '🔐']
const NOTE_COLORS = ['text-emerald-500', 'text-sky-500', 'text-mono-accent', 'text-purple-400']

function hitCard(event, highlight) {
  const el = event.currentTarget
  el.classList.remove('mono-bump')
  void el.offsetWidth
  el.classList.add('mono-bump')
  el.addEventListener('animationend', () => el.classList.remove('mono-bump'), { once: true })
  const rect = el.getBoundingClientRect()
  coinBurst(rect.left + rect.width / 2, rect.top + 10, 2, highlight.value)
  filter.value = highlight.category
  query.value = ''
  if (view.value !== 'home') router.push({ name: 'home' })
}

/* ---------- Mini-jeu (route #/arene) ---------- */
const arcadeOpen = ref(true)
const arcade = ref(null)
function scrollToArcade() {
  arcadeOpen.value = true
  nextTick(() => arcade.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}
watch(
  () => route.name,
  (name) => {
    if (name === 'arena') scrollToArcade()
  },
)

/* ---------- Palette de commandes (Ctrl+K) ---------- */
const paletteOpen = ref(false)
const commands = computed(() => [
  ...articles.map((a) => ({ label: `Lire : ${a.title}`, run: () => selectArticle(a.slug) })),
  ...LAB_MODULES.map((m) => ({ label: m.palette, run: () => openLab(m.id) })),
  { label: "Action : Copier la citation BibTeX de l'article actif", run: copyBibtex },
  { label: 'Action : Basculer le thème (Paper / Obsidian)', run: () => (dark.value = !dark.value) },
  { label: 'Action : Ouvrir le mini-jeu 8-bit', run: () => router.push({ name: 'arena' }) },
  ...(archive
    ? themes
        .filter((t) => t.id !== active.value.id)
        .map((t) => ({ label: `Forme : passer à « ${t.name} » (forme ${number(t)})`, run: () => setTheme(t.id) }))
    : []),
])

function onKey(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    paletteOpen.value = !paletteOpen.value
  } else if (event.key === 'Escape') {
    paletteOpen.value = false
  }
}

/* ---------- Progression de lecture & horloge ---------- */
const progress = ref(0)
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0
}
const utc = useUtcClock(' GMT')

const otherThemes = computed(() => themes.filter((t) => t.id !== active.value.id))

onMounted(() => {
  document.title = 'Ousmane Ba — AI Research, Cyber-Physical Systems & Security'
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
  onScroll()
  if (route.name === 'arena') scrollToArcade()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  window.removeEventListener('keydown', onKey)
  window.clearTimeout(toastTimer)
  window.clearTimeout(turboTimer)
  root.classList.remove('dark', 'mono-turbo')
})
</script>

<template>
  <div class="theme-monographie flex min-h-screen flex-col bg-mono-page font-sans text-mono-ink antialiased">
    <ParticleOverlay ref="overlay" />

    <!-- Progression de lecture -->
    <div class="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
      <div
        class="h-full bg-gradient-to-r from-amber-400 via-mono-accent to-emerald-400 transition-[width] duration-150 ease-out"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <!-- Notification -->
    <div
      role="status"
      aria-live="polite"
      class="pointer-events-none fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded border border-mono-accent bg-zinc-900 px-4 py-2.5 font-mono text-xs text-zinc-100 shadow-lg transition-all duration-300 dark:bg-zinc-100 dark:text-zinc-900"
      :class="toast.show ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'"
    >
      <span class="h-2 w-2 rounded-full bg-emerald-500" />
      <span>{{ toast.msg }}</span>
    </div>

    <CommandPalette :open="paletteOpen" :commands="commands" @close="paletteOpen = false" />

    <!-- Barre d'état du labo -->
    <div class="sticky top-0 z-50 border-b border-mono-line bg-mono-page/95 font-mono text-xs backdrop-blur-md">
      <div class="mono-wrap flex min-h-[2.5rem] items-center justify-between gap-2 py-1">
        <div class="no-scrollbar flex min-w-0 items-center gap-3 overflow-x-auto py-1 sm:gap-4">
          <span class="flex shrink-0 items-center gap-1.5 font-pixel text-[9px] tracking-tighter text-amber-500">
            <span>★ {{ firstName }}</span>
            <span class="text-mono-ink">{{ String(score).padStart(6, '0') }}</span>
          </span>
          <span class="text-mono-muted/50">|</span>
          <button
            type="button"
            class="flex shrink-0 items-center gap-1 font-pixel text-[9px] text-amber-500 transition hover:scale-105"
            title="Cliquez pour un bonus de jetons !"
            @click="coinBurst($event.clientX, 40, 5)"
          >
            <span class="inline-block animate-bounce">🪙</span>
            <span>x</span>
            <span class="text-mono-ink">{{ String(coins).padStart(2, '0') }}</span>
          </button>
          <span class="hidden text-mono-muted/50 sm:inline">|</span>
          <span class="hidden shrink-0 font-pixel text-[9px] text-emerald-500 sm:inline">ZONE 221 · DKR</span>
          <span class="hidden text-mono-muted/50 md:inline">|</span>
          <span class="hidden shrink-0 text-mono-muted md:inline">UTC: <strong class="text-mono-ink">{{ utc }}</strong></span>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-pixel text-[10px] text-amber-500 transition-colors hover:bg-amber-500 hover:text-zinc-950"
            title="Activer / couper les bruitages 8-bit"
            :aria-pressed="sfxOn"
            @click="toggleSfx"
          >
            <span>{{ sfxOn ? '🔊' : '🔇' }}</span>
            <span class="hidden sm:inline">8-BIT SFX</span>
          </button>
          <button
            type="button"
            class="hidden items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-pixel text-[10px] text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-zinc-950 sm:flex"
            title="Activer le mode turbo !"
            @click="triggerTurbo"
          >
            <span>⚡</span><span>TURBO</span>
          </button>
          <button
            type="button"
            class="rounded border border-mono-line px-2 py-0.5 text-[11px] text-mono-muted transition-colors hover:border-mono-accent"
            title="Palette de commandes (Ctrl+K)"
            @click="paletteOpen = true"
          >
            ⌘K
          </button>
          <button
            type="button"
            class="rounded border border-mono-line px-2 py-0.5 text-[11px] uppercase tracking-wider transition-colors hover:border-mono-accent"
            @click="lang = lang === 'fr' ? 'en' : 'fr'"
          >
            FR / EN
          </button>
          <button
            type="button"
            class="inline-flex min-h-[1.6rem] min-w-[1.75rem] items-center justify-center rounded border border-mono-line p-1 transition-colors hover:border-mono-accent"
            title="Basculer le thème (Paper / Obsidian)"
            :aria-label="dark ? 'Passer en thème clair' : 'Passer en thème sombre'"
            @click="dark = !dark"
          >
            <svg v-if="dark" class="h-3.5 w-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="h-3.5 w-3.5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="mono-wrap flex-1 pb-10 pt-10 sm:pt-12 md:pt-[4.5rem]">
      <!-- En-tête -->
      <header class="relative border-b border-mono-line pb-6">
        <div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
          <div class="max-w-[780px]">
            <div class="mono-kicker flex flex-wrap items-center gap-2 font-mono uppercase leading-relaxed text-mono-accent">
              <span>// RESEARCH LOGS &amp; SYSTEMS ARCHITECTURE</span>
              <span class="rounded border border-mono-accent/20 bg-mono-accent/10 px-1.5 py-0.5 text-[10px] text-mono-accent">MONOGRAPH-v2.4</span>
            </div>
            <h1 class="mono-title font-serif font-medium text-mono-ink">{{ profile.name }}</h1>
            <p class="mono-subtitle">{{ profile.tagline[lang] }}</p>
          </div>

          <div class="flex flex-wrap gap-2 font-mono text-xs md:max-w-[210px] md:pt-12">
            <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="mono-link-pill">
              <span>GitHub</span><span class="text-mono-muted">/{{ profile.handle }}</span><span class="text-mono-accent">↗</span>
            </a>
            <a :href="profile.links.linkedin" target="_blank" rel="noopener noreferrer" class="mono-link-pill">
              <span>LinkedIn</span><span class="text-mono-muted">/husary</span><span class="text-mono-accent">↗</span>
            </a>
            <a :href="`mailto:${profile.links.email}`" class="mono-link-pill">
              <span>Contact</span><span class="text-mono-accent">✉</span>
            </a>
          </div>
        </div>

        <ArcadeStage ref="arcade" v-model:open="arcadeOpen" />

        <!-- Chiffres clés : cliquer filtre les articles du domaine -->
        <div class="mt-6 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-4">
          <button
            v-for="(h, i) in profile.highlights"
            :key="h.label"
            type="button"
            class="mono-chip-card relative select-none overflow-hidden text-left"
            :title="`Voir les articles liés : ${h.label}`"
            @click="hitCard($event, h)"
          >
            <span class="mb-1 flex items-center justify-between text-[0.57rem] text-mono-accent">
              <span>◆ DATA {{ String(i + 1).padStart(2, '0') }}</span>
              <span aria-hidden="true">{{ CARD_ICONS[i % CARD_ICONS.length] }}</span>
            </span>
            <span class="block text-[10px] uppercase text-mono-muted">{{ h.label }}</span>
            <span class="mt-0.5 block break-words text-base font-semibold text-mono-ink sm:text-lg">
              {{ h.value }}
              <span class="text-[10px] font-normal" :class="NOTE_COLORS[i % NOTE_COLORS.length]">{{ h.note }}</span>
            </span>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="mono-nav flex flex-wrap gap-1.5 border-b border-mono-line pb-3 font-mono" aria-label="Sections du blog">
          <RouterLink
            v-for="item in navItems"
            :key="item.view"
            :to="item.to"
            class="mono-nav-btn flex items-center gap-1.5 font-medium transition"
            :class="view === item.view ? 'bg-mono-ink text-mono-page' : 'text-mono-muted hover:bg-mono-surface hover:text-mono-ink'"
            :aria-current="view === item.view ? 'page' : undefined"
          >
            <span v-if="item.dot" class="h-1.5 w-1.5 shrink-0 rounded-full bg-mono-accent" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </header>

      <div ref="viewsTop" class="scroll-mt-14" />

      <ArticlesView
        v-show="view === 'home'"
        v-model:filter="filter"
        v-model:query="query"
        :selected="selected"
        @select="selectArticle"
        @copy-bibtex="copyBibtex"
        @open-lab="openLab"
      />
      <SystemsView v-show="view === 'systems'" />
      <PlaygroundView v-show="view === 'playground'" :module="labModule" />
      <AboutView v-show="view === 'about'" />
    </div>

    <!-- Pied de page -->
    <footer class="mt-12 border-t border-mono-line py-6 font-mono text-xs text-mono-muted">
      <div class="mono-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>{{ profile.name.toUpperCase() }} // RESEARCH &amp; ENGINEERING MONOGRAPHS</div>
        <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>LATEX ENGINE: KATEX v{{ katex.version }}</span>
          <span>•</span>
          <span>{{ profile.city.toUpperCase() }}, {{ profile.country.toUpperCase() }}</span>
        </div>
      </div>
      <div v-if="archive" class="mono-wrap mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <span>FORME {{ number(active) }}/{{ themes.length }} · {{ active.name.toUpperCase() }}</span>
        <span class="text-mono-muted/60">— voir aussi :</span>
        <button
          v-for="t in otherThemes"
          :key="t.id"
          type="button"
          class="rounded-full border border-mono-line px-3 py-1 transition hover:border-mono-accent hover:text-mono-accent"
          :title="t.summary"
          @click="setTheme(t.id)"
        >
          {{ number(t) }}. {{ t.name }}
        </button>
      </div>
    </footer>
  </div>
</template>
