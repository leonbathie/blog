<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { lang, setLang } from '../../core/i18n.js'
import { useThemes } from '../../core/themes.js'
import { contentIn } from '../../content/index.js'
import { themeLabel } from '../leontechlab/i18n.js'
import bannerPhoto from './banner.webp'
import { DEFAULT_ERA, ERAS, eraIn, fill, FRAME, ICONS, LABELS, techsIn } from './eras.js'
import Timeline from './components/Timeline.vue'
import EraPreview from './components/EraPreview.vue'
import PageHome from './components/PageHome.vue'
import PageArticles from './components/PageArticles.vue'
import PageProjects from './components/PageProjects.vue'
import PageLab from './components/PageLab.vue'
import PageAbout from './components/PageAbout.vue'
import './theme.css'

/*
 * Forme 7 — « Évolution 1991 → 2050 »
 * Machine à remonter le Web : un bandeau en pixel art, une frise de sept
 * époques, et la même page du blog affichée dans le navigateur de l'époque
 * choisie (Netscape, Firefox, Chrome, Arc, puis les interfaces de 2030 à
 * 2050), avec à côté les vignettes des six autres époques. Toutes les
 * adresses du blog (#/recherche/…, #/labo/…) marchent dans chaque époque.
 */

const route = useRoute()
const router = useRouter()
const { themes, active, archive, setTheme, number } = useThemes()
const root = document.documentElement
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

const F = computed(() => FRAME[lang.value] ?? FRAME.fr)
const profile = computed(() => contentIn(lang.value).profile)
/** « Ousmane BA » : le nom de famille en capitales, comme sur la maquette */
const signature = computed(() => {
  const parts = profile.value.name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts.slice(0, -1).join(' ')} ${parts.at(-1).toUpperCase()}` : profile.value.name
})
const DOMAINS = ['AI', 'Engineering', 'African Languages', 'Space & Science', 'Maintenance & GMAO']
const year = new Date().getFullYear()

/* ---------- Stockage local, tolérant à un stockage bloqué ---------- */
function read(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* navigation privée : le choix vaut pour la visite */
  }
}

/* ---------- Notifications ---------- */
const toast = reactive({ msg: '', show: false })
let toastTimer = 0
function showToast(msg) {
  toast.msg = msg
  toast.show = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.show = false), 2400)
}
provide('evo', { toast: showToast })

/* ---------- Époque ---------- */
const saved = read('evo:era')
const eraId = ref(ERAS.some((e) => e.id === saved) ? saved : DEFAULT_ERA)
const eras = computed(() => ERAS.map((e) => eraIn(e, lang.value)))
const era = computed(() => eras.value.find((e) => e.id === eraId.value) ?? eras.value[0])
const others = computed(() => eras.value.filter((e) => e.id !== eraId.value))
const L = computed(() => LABELS[era.value.lang])

const windowBox = ref(null)
/** Ramène la fenêtre en vue si son haut est sorti de l'écran (ou loin en dessous) */
function revealWindow() {
  const box = windowBox.value
  if (!box) return
  const top = box.getBoundingClientRect().top
  if (top >= 0 && top < window.innerHeight * 0.5) return
  box.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' })
}
function chooseEra(id, { reveal = false } = {}) {
  if (id !== eraId.value) eraId.value = id
  if (reveal) nextTick(revealWindow)
}
watch(eraId, (id) => {
  write('evo:era', id)
  simulateLoad()
})

/* ---------- Langue : le cadre suit l'appareil ; voir eraIn() pour les fenêtres ---------- */
const LANG_BUTTONS = [
  { id: 'fr', label: 'FR', name: 'Français' },
  { id: 'en', label: 'EN', name: 'English' },
]
function chooseLang(id) {
  if (id === lang.value) return
  setLang(id)
  showToast(FRAME[id].langSet)
}

/* ---------- Section affichée dans la fenêtre ---------- */
const PAGES = { home: PageHome, articles: PageArticles, projects: PageProjects, lab: PageLab, about: PageAbout }
const LAB_IDS = ['glitch', 'pulaar', 'weibull']
const labModule = computed(() => (LAB_IDS.includes(route.params.module) ? route.params.module : 'glitch'))
const section = computed(
  () => ({ articles: 'articles', article: 'articles', projects: 'projects', lab: 'lab', arena: 'lab', about: 'about' })[route.name] ?? 'home',
)
const slug = computed(() => (route.name === 'article' ? String(route.params.slug ?? '') : ''))

const visits = ref(1)
const reloads = ref(0)
const pageKey = computed(() => `${section.value}:${reloads.value}`)
const pageProps = computed(() => {
  const props = { era: era.value }
  if (section.value === 'home') props.visits = visits.value
  if (section.value === 'articles') props.slug = slug.value
  if (section.value === 'lab') props.module = labModule.value
  return props
})

const SECTION_TITLES = {
  en: { home: 'Research & Engineering', articles: 'Notes', projects: 'Projects', lab: 'Research Lab', about: 'About' },
  fr: { home: 'Recherche & Ingénierie', articles: 'Articles', projects: 'Projets', lab: 'Laboratoire', about: 'À propos' },
}
const article = computed(() => (slug.value ? (contentIn(era.value.lang).articles.find((a) => a.slug === slug.value) ?? null) : null))
const pageTitle = computed(() => `LeonTechLab - ${article.value?.title ?? SECTION_TITLES[era.value.lang][section.value]}`)

/* ---------- Barre d'adresse : le style d'URL de chaque époque ---------- */
const host = computed(() => era.value.url.match(/^[a-z][\w+.-]*:\/\/([^/]+)/i)?.[1] ?? 'leontechlab')
const address = computed(() => {
  const e = era.value
  const s = section.value
  const base = e.url.match(/^[a-z][\w+.-]*:\/\/[^/]+/i)?.[0] ?? e.url.replace(/\/$/, '')
  const hash = route.name === 'about' && route.hash === '#links' ? '#links' : ''
  if (e.chrome === 'win95') {
    const path = {
      home: 'index.html',
      articles: slug.value ? `notes/${slug.value}.html` : 'notes/index.html',
      projects: 'projects.html',
      lab: `research/${labModule.value}.html`,
      about: 'about.html',
    }[s]
    return `${base}/${path}${hash}`
  }
  if (e.chrome === 'fx') {
    const path = {
      home: '',
      articles: slug.value ? `archives/${slug.value}/` : 'archives/',
      projects: 'projects/',
      lab: `research/${labModule.value}/`,
      about: 'about/',
    }[s]
    return `${base}/${path}${hash}`
  }
  if (s === 'home') return e.url
  const en = e.lang === 'en'
  const seg = { articles: en ? 'notes' : 'articles', projects: en ? 'projects' : 'projets', lab: en ? 'lab' : 'labo', about: en ? 'about' : 'a-propos' }[s]
  const tail = s === 'articles' && slug.value ? `/${slug.value}` : s === 'lab' ? `/${labModule.value}` : ''
  return `${base}/${seg}${tail}${hash}`
})

/* ---------- Chargement simulé, Précédent / Suivant ---------- */
const loading = ref(false)
let loadTimer = 0
function simulateLoad() {
  if (reduced.matches) return
  loading.value = true
  window.clearTimeout(loadTimer)
  loadTimer = window.setTimeout(() => (loading.value = false), 650)
}
function stopLoad() {
  if (!loading.value) return
  window.clearTimeout(loadTimer)
  loading.value = false
  showToast(F.value.stopped)
}
function reload() {
  reloads.value += 1
  simulateLoad()
  showToast(F.value.reloaded)
}
const statusText = computed(() => {
  if (!loading.value) return L.value.status
  return era.value.lang === 'en' ? `Connect: Contacting host: ${host.value}...` : `Connexion à ${host.value}…`
})

const canBack = ref(false)
const canForward = ref(false)
function syncHistory() {
  const state = window.history.state
  canBack.value = Boolean(state?.back)
  canForward.value = Boolean(state?.forward)
}
const stopHistory = router.afterEach(() => nextTick(syncHistory))
const goBack = () => canBack.value && router.back()
const goForward = () => canForward.value && router.forward()
const goHome = () => router.push({ name: 'home' })

const BUTTONS = {
  en: { back: 'Back', forward: 'Forward', home: 'Home', reload: 'Reload', stop: 'Stop', find: 'Find' },
  fr: { back: 'Précédent', forward: 'Suivant', home: 'Accueil', reload: 'Actualiser', stop: 'Arrêter', find: 'Rechercher' },
}
const B = computed(() => BUTTONS[era.value.lang])

/* Barre des interfaces de 2030 à 2050 */
const HUD = { xr: 'MR · 90 Hz', agi: 'LEO · 12 agents', future: 'Dakar · 2050' }
const now = ref(new Date())
let clockTimer = 0
const clock = computed(() => now.value.toLocaleTimeString(era.value.lang === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }))

/* Changement de page dans la fenêtre : on remonte en haut de la fenêtre au besoin */
watch(
  () => `${String(route.name)}|${slug.value}`,
  () => {
    simulateLoad()
    // Le laboratoire défile lui-même jusqu'au module demandé.
    if (route.hash || (section.value === 'lab' && labModule.value !== 'glitch')) return
    nextTick(revealWindow)
  },
)

/* ---------- Titre de l'onglet et langue du document ---------- */
watch(
  [lang, pageTitle],
  () => {
    root.lang = lang.value
    const lead = article.value?.title ?? F.value.title
    document.title = `${lead} · ${era.value.years} — ${profile.value.name}`
  },
  { immediate: true },
)

/* ---------- Formes du blog ---------- */
const otherForms = computed(() => themes.filter((th) => th.id !== active.value.id))

/* ---------- Bandeau ---------- */
// La photo de la maquette, sans son texte incrusté : le titre reste du HTML, par-dessus.
// Sur téléphone, deux recadrages de la même image : l'ingénieur, puis le globe.
// Position de Dakar sur le globe filaire, en pourcentage de l'image (balise qui pulse).
const DAKAR = { left: '73.6%', top: '48.3%' }

/* ---------- Cycle de vie ---------- */
onMounted(() => {
  root.classList.add('dark')
  const n = (Number.parseInt(read('evo:visits') ?? '0', 10) || 0) + 1
  write('evo:visits', String(n))
  visits.value = n
  syncHistory()
  clockTimer = window.setInterval(() => (now.value = new Date()), 20_000)
})

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer)
  window.clearTimeout(loadTimer)
  window.clearInterval(clockTimer)
  stopHistory()
  root.classList.remove('dark')
  root.lang = 'fr' // les autres formes sont en français
})
</script>

<template>
  <div class="theme-evo antialiased">
    <!-- Notification -->
    <div role="status" aria-live="polite" class="evo-toast" :class="toast.show ? 'evo-toast-on' : ''">{{ toast.msg }}</div>

    <div class="evo-shell">
      <!-- 1. Bandeau : la photo (salle de contrôle, globe, satellite), titre par-dessus -->
      <header class="evo-banner" :aria-label="F.banner">
        <div class="evo-photo">
          <img class="evo-photo-wide" :src="bannerPhoto" alt="" width="2000" height="207" fetchpriority="high" decoding="async" />
          <img class="evo-photo-crop evo-photo-left" :src="bannerPhoto" alt="" aria-hidden="true" decoding="async" />
          <img class="evo-photo-crop evo-photo-right" :src="bannerPhoto" alt="" aria-hidden="true" decoding="async" />
          <span class="evo-beacon" :style="DAKAR" aria-hidden="true" />
        </div>
        <div class="evo-banner-text" lang="en">
          <p class="evo-title">LeonTechLab</p>
          <p class="evo-sub">{{ signature }} — AI Research &amp; Engineering</p>
          <p class="evo-tag">RESEARCH · BUILD · LEARN · INNOVATE</p>
          <span class="evo-rule" aria-hidden="true" />
        </div>
        <ul class="evo-domains" lang="en">
          <li v-for="d in DOMAINS" :key="d">{{ d }}</li>
        </ul>
      </header>

      <!-- 2. Frise des sept époques -->
      <Timeline v-model="eraId" :eras="eras" :label="F.eras" />

      <!-- 3. La page dans le navigateur de l'époque, et les autres époques -->
      <main class="evo-main">
        <section
          ref="windowBox"
          class="era-window evo-window"
          :data-era="era.id"
          :data-chrome="era.chrome"
          :lang="era.lang"
          :aria-label="fill(F.window, era)"
        >
          <!-- 1991-1999 : Netscape Navigator sous Windows 95 -->
          <div v-if="era.chrome === 'win95'" class="w95 w95-bevel shrink-0">
            <div class="w95-title">
              <span class="w95-logo" aria-hidden="true">N</span>
              <span class="min-w-0 flex-1 truncate">{{ pageTitle }} - {{ era.browser }}</span>
              <span class="flex shrink-0 gap-0.5" aria-hidden="true">
                <span class="w95-ctl w95-bevel">_</span><span class="w95-ctl w95-bevel">□</span><span class="w95-ctl w95-bevel">×</span>
              </span>
            </div>
            <div class="w95-menu flex flex-wrap px-1 py-0.5" aria-hidden="true">
              <span v-for="m in ['File', 'Edit', 'View', 'Go', 'Bookmarks', 'Options', 'Directory', 'Help']" :key="m" :class="m === 'Go' || m === 'Directory' ? 'max-sm:hidden' : ''">{{ m }}</span>
            </div>
            <div class="flex items-stretch gap-1 border-t border-[#808080] px-1 py-1">
              <div class="flex flex-1 flex-wrap gap-1" role="toolbar" :aria-label="F.tools">
                <button type="button" class="w95-btn w95-bevel" :disabled="!canBack" @click="goBack"><span aria-hidden="true">◀</span>{{ B.back }}</button>
                <button type="button" class="w95-btn w95-bevel" :disabled="!canForward" @click="goForward"><span aria-hidden="true">▶</span>{{ B.forward }}</button>
                <button type="button" class="w95-btn w95-bevel" @click="goHome"><span aria-hidden="true">⌂</span>{{ B.home }}</button>
                <button type="button" class="w95-btn w95-bevel" @click="reload"><span aria-hidden="true">↻</span>{{ B.reload }}</button>
                <RouterLink :to="{ name: 'articles' }" class="w95-btn w95-bevel evo-hide-sm">{{ B.find }}</RouterLink>
                <button type="button" class="w95-btn w95-bevel" :disabled="!loading" @click="stopLoad"><span aria-hidden="true" class="text-[#c00000]">■</span>{{ B.stop }}</button>
              </div>
              <span class="w95-throbber w95-sunken" :class="loading ? 'w95-throbber-on' : ''" aria-hidden="true">N</span>
            </div>
            <div class="flex items-center gap-2 border-t border-[#808080] px-1 py-1">
              <span class="shrink-0 font-bold">Location:</span>
              <span class="w95-sunken min-w-0 flex-1 truncate px-1 py-0.5 font-mono text-[0.8rem]">{{ address }}</span>
            </div>
            <div class="hidden flex-wrap gap-1 border-t border-[#808080] px-1 py-1 md:flex">
              <RouterLink :to="{ name: 'articles' }" class="w95-btn w95-bevel">What's New?</RouterLink>
              <RouterLink :to="{ name: 'lab', params: { module: 'pulaar' } }" class="w95-btn w95-bevel">What's Cool?</RouterLink>
              <RouterLink :to="{ name: 'about' }" class="w95-btn w95-bevel">Handbook</RouterLink>
              <RouterLink :to="{ name: 'projects' }" class="w95-btn w95-bevel">Net Directory</RouterLink>
              <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="w95-btn w95-bevel">Software</a>
            </div>
          </div>

          <!-- 2000-2009 : Firefox sous Windows XP -->
          <div v-else-if="era.chrome === 'fx'" class="fx-bar shrink-0">
            <div class="xp-title">
              <span class="fx-logo" aria-hidden="true" />
              <span class="min-w-0 flex-1 truncate">{{ pageTitle }} - {{ era.browser }}</span>
              <span class="flex shrink-0 gap-0.5" aria-hidden="true"><span class="xp-ctl">_</span><span class="xp-ctl">□</span><span class="xp-ctl xp-close">×</span></span>
            </div>
            <div class="w95-menu flex flex-wrap px-1 py-0.5" aria-hidden="true">
              <span v-for="m in ['File', 'Edit', 'View', 'History', 'Bookmarks', 'Tools', 'Help']" :key="m">{{ m }}</span>
            </div>
            <div class="flex items-center gap-1.5 px-2 py-1.5" role="toolbar" :aria-label="F.tools">
              <button type="button" class="fx-round fx-round-big" :disabled="!canBack" :aria-label="B.back" :title="B.back" @click="goBack">◀</button>
              <button type="button" class="fx-round" :disabled="!canForward" :aria-label="B.forward" :title="B.forward" @click="goForward">▶</button>
              <button type="button" class="fx-round" :aria-label="B.reload" :title="B.reload" @click="reload">↻</button>
              <button type="button" class="fx-round" :disabled="!loading" :aria-label="B.stop" :title="B.stop" @click="stopLoad">✕</button>
              <button type="button" class="fx-round evo-hide-xs" :aria-label="B.home" :title="B.home" @click="goHome">⌂</button>
              <span class="fx-url min-w-0">
                <span class="fx-favicon" aria-hidden="true">L</span>
                <span class="min-w-0 flex-1 truncate">{{ address }}</span>
                <span class="fx-rss" aria-hidden="true">RSS</span>
              </span>
            </div>
            <div class="hidden gap-4 px-3 pb-1 text-[0.74rem] sm:flex" aria-hidden="true">
              <span>☆ Most Visited</span><span>☆ Getting Started</span><span>▤ Latest Headlines</span>
            </div>
            <div class="flex items-end px-2 pt-0.5">
              <span class="fx-tab min-w-0 max-w-full">
                <span class="fx-favicon" aria-hidden="true">L</span>
                <span class="min-w-0 truncate">{{ pageTitle }}</span>
                <span v-if="loading" class="fx-spin" aria-hidden="true" />
                <span v-else class="text-[#64748b]" aria-hidden="true">×</span>
              </span>
            </div>
          </div>

          <!-- 2010-2029 : onglets modernes -->
          <div v-else-if="era.chrome === 'tab'" class="tab-bar shrink-0">
            <div class="flex items-end gap-2 px-2 pt-2">
              <span class="mb-2.5 flex shrink-0 gap-1.5" aria-hidden="true">
                <span class="tab-dot bg-[#ff5f57]" /><span class="tab-dot bg-[#febc2e]" /><span class="tab-dot bg-[#28c840]" />
              </span>
              <span class="tab-tab min-w-0">
                <span class="tab-favicon" aria-hidden="true">L</span>
                <span class="min-w-0 truncate">{{ pageTitle }}</span>
                <span class="era-muted" aria-hidden="true">×</span>
              </span>
              <span class="era-muted mb-1.5 text-lg leading-none" aria-hidden="true">+</span>
            </div>
            <div class="flex items-center gap-1 border-t border-[rgb(var(--era-line))] px-2 py-1.5" role="toolbar" :aria-label="F.tools">
              <button type="button" class="tab-btn" :disabled="!canBack" :aria-label="B.back" :title="B.back" @click="goBack">←</button>
              <button type="button" class="tab-btn" :disabled="!canForward" :aria-label="B.forward" :title="B.forward" @click="goForward">→</button>
              <button
                type="button"
                class="tab-btn"
                :aria-label="loading ? B.stop : B.reload"
                :title="loading ? B.stop : B.reload"
                @click="loading ? stopLoad() : reload()"
              >
                {{ loading ? '✕' : '↻' }}
              </button>
              <span class="tab-url min-w-0">
                <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M6 11h12v10H6z M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <span class="min-w-0 flex-1 truncate">{{ address }}</span>
              </span>
              <span class="tab-avatar" aria-hidden="true">OB</span>
            </div>
          </div>

          <!-- 2030-2050 : interfaces immersives -->
          <template v-else>
            <div class="hud-bar shrink-0">
              <span class="flex min-w-0 items-center gap-2"><span class="hud-led" aria-hidden="true" /><span class="truncate">{{ era.browser }}</span></span>
              <span class="hidden min-w-0 flex-1 truncate text-center md:block">{{ address }}</span>
              <span class="flex shrink-0 items-center gap-1" role="toolbar" :aria-label="F.tools">
                <button type="button" class="hud-btn" :disabled="!canBack" :aria-label="B.back" :title="B.back" @click="goBack">‹</button>
                <button type="button" class="hud-btn" :aria-label="B.home" :title="B.home" @click="goHome">⌂</button>
                <button type="button" class="hud-btn" :disabled="!canForward" :aria-label="B.forward" :title="B.forward" @click="goForward">›</button>
                <span class="ml-1 hidden whitespace-nowrap sm:inline">{{ HUD[era.id] }} · {{ clock }}</span>
              </span>
            </div>
            <p class="hud-url md:hidden">{{ address }}</p>
            <div class="hud-corners" aria-hidden="true" />
          </template>

          <!-- La page -->
          <div class="era-page" :class="era.chrome === 'win95' ? 'w95-sunken' : ''">
            <div v-if="loading && era.chrome !== 'win95'" class="evo-loadbar" aria-hidden="true" />
            <component :is="PAGES[section]" :key="pageKey" v-bind="pageProps" />
          </div>

          <!-- Barres d'état d'époque -->
          <div v-if="era.chrome === 'win95'" class="w95 w95-status shrink-0">
            <span class="w95-sunken min-w-0 flex-1 truncate px-1">{{ statusText }}</span>
            <span class="w95-sunken hidden px-1 sm:inline" aria-hidden="true">{{ host }}</span>
          </div>
          <div v-else-if="era.chrome === 'fx'" class="fx-status shrink-0">{{ loading ? `Transferring data from ${host}…` : 'Done' }}</div>
        </section>

        <aside class="evo-aside" :aria-label="F.others">
          <div class="evo-previews">
            <EraPreview v-for="e in others" :key="e.id" :era="e" :label="fill(F.show, e)" @select="chooseEra($event, { reveal: true })" />
          </div>
        </aside>
      </main>

      <!-- 4. Pied de page -->
      <footer class="evo-footer">
        <div class="flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <p class="text-[0.95rem] font-semibold">{{ F.footer }}</p>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span class="text-[0.82rem] text-[rgb(var(--evo-muted))]">{{ F.techs }}</span>
            <span v-for="[label, icon] in techsIn(lang)" :key="label" class="evo-tech">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path :d="ICONS[icon]" />
              </svg>
              {{ label }}
            </span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[rgb(var(--evo-line))] px-4 py-2.5 text-[0.8rem] text-[rgb(var(--evo-muted))]">
          <span class="evo-lang" role="group" :aria-label="F.lang">
            <button
              v-for="l in LANG_BUTTONS"
              :key="l.id"
              type="button"
              class="evo-lang-btn"
              :class="l.id === lang ? 'evo-lang-on' : ''"
              :aria-pressed="l.id === lang"
              :lang="l.id"
              :title="l.name"
              @click="chooseLang(l.id)"
            >
              {{ l.label }}
            </button>
          </span>
          <template v-if="archive">
            <span>{{ F.forms }} · {{ number(active) }}/{{ themes.length }}</span>
            <span class="flex flex-wrap gap-1.5">
              <button v-for="th in otherForms" :key="th.id" type="button" class="evo-form-btn" :title="themeLabel(th).summary" @click="setTheme(th.id)">
                {{ number(th) }}. {{ themeLabel(th).name }}
              </button>
            </span>
          </template>
          <span class="sm:ml-auto">
            © {{ year }} {{ profile.name }} ·
            <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="underline decoration-dotted underline-offset-2 hover:text-[#fbbf24]">github.com/{{ profile.handle }}</a>
          </span>
        </div>
      </footer>
    </div>
  </div>
</template>
