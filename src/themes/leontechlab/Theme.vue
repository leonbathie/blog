<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemes } from '../../core/themes.js'
import { copyText } from '../../core/clipboard.js'
import { createHero, LAYOUTS } from './hero.js'
import { dateHorloge, heureHorloge, moisCourt } from './format.js'
import { t, themeLabel, useLeon } from './i18n.js'
import ArticlesView from './components/ArticlesView.vue'
import ProjectsView from './components/ProjectsView.vue'
import LabView from './components/LabView.vue'
import AboutView from './components/AboutView.vue'
import ProfileAvatar from './components/ProfileAvatar.vue'
import CmdPrompt from './components/CmdPrompt.vue'
import './theme.css'

/*
 * Forme 6 — « LeonTechLab »
 * Console rétro : écran à phosphore vert encadré, barre d'état et horloge,
 * bandeau lunaire en pixel art, navigation « [ crochets ] », trois colonnes
 * de panneaux « :: Titre :: », titres d'articles cyan, invite de commande.
 * En français ou en anglais, selon la langue de l'appareil (bouton FR | EN).
 *
 * L'écusson du bandeau est un dessin original : on ne reprend pas l'emblème
 * d'une agence spatiale réelle, qui laisserait croire à une affiliation.
 */

const route = useRoute()
const router = useRouter()
const { themes, active, archive, setTheme, number } = useThemes()
const { lang, setLang, content } = useLeon()
const root = document.documentElement

const profile = computed(() => content.value.profile)
const list = computed(() => content.value.articles)

/* ---------- Notifications ---------- */
const toast = reactive({ msg: '', show: false })
let toastTimer = 0
function showToast(msg) {
  toast.msg = msg
  toast.show = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.show = false), 2600)
}

/* ---------- Bandeau ---------- */
// Même seuil que le préfixe `sm:` de Tailwind, qui place le titre par-dessus.
const compactQuery = window.matchMedia('(max-width: 639px)')
// Proportions avant le premier rendu ; hero.js fixe ensuite la taille exacte.
const heroInit = compactQuery.matches ? LAYOUTS.compact : LAYOUTS.wide
const heroCanvas = ref(null)
let hero = null
let heroSeen = null // l'animation s'arrête quand le bandeau sort de l'écran
const onCompactChange = (e) => hero?.setCompact(e.matches)
function fireLander() {
  const ok = Boolean(hero?.fire())
  if (ok) showToast(t('hero.launched'))
  return ok
}
/** Depuis l'invite de commande : on remonte voir le bandeau, puis on décolle */
function launchFromCmd() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  return fireLander()
}
provide('leon', { toast: showToast, launch: launchFromCmd })

/* ---------- Horloge ---------- */
const now = ref(new Date())
let clockTimer = 0
const clockDate = computed(() => dateHorloge(now.value, lang.value))
const clockTime = computed(() => heureHorloge(now.value))

/* ---------- Langue ---------- */
const LANGS = [
  { id: 'fr', label: 'FR', name: 'français' },
  { id: 'en', label: 'EN', name: 'English' },
]
function chooseLang(id) {
  if (id === lang.value) return
  setLang(id)
  showToast(t('toast.lang'))
}
watch(
  lang,
  (value) => {
    root.lang = value
    document.title = `LeonTechLab — ${profile.value.name} (@${profile.value.handle}) | ${t('status.lab')}`
  },
  { immediate: true },
)

/* ---------- Sections ---------- */
const view = computed(
  () => ({ projects: 'projects', lab: 'lab', arena: 'lab', about: 'about' })[route.name] ?? 'articles',
)
const reading = computed(() => route.name === 'article')
/** L'accueil montre tous les articles ; la page « Articles » ajoute recherche et filtres. */
const listMode = computed(() => (route.name === 'articles' ? 'list' : 'home'))
const contact = computed(() => route.name === 'about' && route.hash === '#contact')

const LAB_IDS = ['glitch', 'pulaar', 'weibull']
const labModule = computed(() => (LAB_IDS.includes(route.params.module) ? route.params.module : 'glitch'))

const NAV = computed(() => [
  { key: 'home', to: { name: 'home' }, hotkey: '1' },
  { key: 'articles', to: { name: 'articles' }, hotkey: '2' },
  { key: 'projects', to: { name: 'projects' }, hotkey: '3' },
  { key: 'research', to: { name: 'lab', params: { module: labModule.value } }, hotkey: '4' },
  { key: 'github', href: profile.value.links.github },
  { key: 'about', to: { name: 'about' }, hotkey: '5' },
  { key: 'contact', to: { name: 'about', hash: '#contact' }, hotkey: '6' },
])
function navActive(key) {
  switch (key) {
    case 'home':
      return route.name === 'home'
    case 'articles':
      return route.name === 'articles' || reading.value
    case 'projects':
      return view.value === 'projects'
    case 'research':
      return view.value === 'lab'
    case 'about':
      return view.value === 'about' && !contact.value
    case 'contact':
      return contact.value
    default:
      return false
  }
}

/* ---------- Articles ---------- */
const filter = ref('all')
const query = ref('')
const selected = computed(
  () => (reading.value ? list.value.find((a) => a.slug === route.params.slug) : null) ?? list.value[0] ?? null,
)
function selectArticle(slug) {
  router.push({ name: 'article', params: { slug } })
}
function openLab(module) {
  router.push({ name: 'lab', params: { module: LAB_IDS.includes(module) ? module : 'glitch' } })
}
async function copyBibtex() {
  if (!selected.value) return
  showToast((await copyText(selected.value.bibtex)) ? t('toast.bibtexOk') : t('toast.bibtexFail'))
}
function openArchives(cat = 'all') {
  filter.value = cat
  query.value = ''
  router.push({ name: 'articles' })
}

/* ---------- Menu principal (colonne de gauche) ---------- */
const MENU = computed(() => [
  { key: 'home', label: t('nav.home'), to: { name: 'home' } },
  { key: 'articles', label: t('nav.articles'), cat: 'all' },
  { key: 'projects', label: t('nav.projects'), to: { name: 'projects' } },
  { key: 'research', label: t('menu.lab'), to: { name: 'lab', params: { module: labModule.value } } },
  { key: 'cat:security', label: t('menu.security'), cat: 'security' },
  { key: 'cat:industrial', label: t('menu.industrial'), cat: 'industrial' },
  { key: 'cat:speech-ai', label: t('menu.speech'), cat: 'speech-ai' },
  { key: 'about', label: t('nav.about'), to: { name: 'about' } },
  { key: 'contact', label: t('nav.contact'), to: { name: 'about', hash: '#contact' } },
])
function menuActive(item) {
  if (item.cat) return route.name === 'articles' && filter.value === item.cat
  return navActive(item.key)
}
function pickMenu(item) {
  if (!item.cat) return router.push(item.to)
  openArchives(item.cat)
  if (item.cat !== 'all') {
    const label = content.value.categories.find((c) => c.id === item.cat)?.label ?? item.cat
    showToast(t('toast.domain', { x: label }))
  }
}

/* ---------- Outils ---------- */
const searchInput = ref(null)
const searchText = ref('')
function submitSearch() {
  const q = searchText.value.trim()
  if (!q) return
  filter.value = 'all'
  query.value = q
  searchText.value = ''
  router.push({ name: 'articles' })
}
function randomArticle() {
  const pool = reading.value ? list.value.filter((a) => a.slug !== selected.value?.slug) : list.value
  const pick = pool[Math.floor(Math.random() * pool.length)]
  if (!pick) return
  selectArticle(pick.slug)
  showToast(t('toast.random'))
}

/* ---------- Invite de commande ---------- */
const cmdOpen = ref(false)
const cmdButton = ref(null)
function toggleCmd(open = !cmdOpen.value) {
  cmdOpen.value = open
  if (!open) nextTick(() => cmdButton.value?.focus({ preventScroll: true }))
}

/* ---------- Colonne de droite ---------- */
const citation = computed(() => {
  const items = t('quote.items')
  return items[Math.floor(Date.now() / 86_400_000) % items.length]
})

const LIENS = computed(() => [
  { label: 'GitHub', url: profile.value.links.github },
  { label: 'LinkedIn', url: profile.value.links.linkedin },
  { label: 'Hugging Face', url: 'https://huggingface.co' },
  { label: 'arXiv', url: 'https://arxiv.org' },
  { label: 'Anthropic', url: 'https://www.anthropic.com' },
  { label: 'DeepMind', url: 'https://deepmind.google' },
  { label: 'OpenAI', url: 'https://openai.com' },
  { label: 'Scholar', url: 'https://scholar.google.com' },
])

/* Lettre d'information : sans serveur, la demande part de la messagerie du visiteur */
const email = ref('')
function subscribe() {
  const subject = encodeURIComponent(t('newsletter.subject'))
  const body = encodeURIComponent(t('newsletter.body', { name: profile.value.name, email: email.value.trim() }))
  window.location.href = `mailto:${profile.value.links.email}?subject=${subject}&body=${body}`
  showToast(t('toast.mail'))
}

const stats = computed(() => {
  const oldest = list.value[list.value.length - 1]
  return [
    { label: t('counter.articles'), value: list.value.length },
    { label: t('counter.repos'), value: profile.value.githubRepoCount },
    { label: t('counter.forms'), value: themes.length },
    { label: t('counter.since'), value: oldest ? moisCourt(oldest.date, lang.value) : '—' },
  ]
})

const others = computed(() => themes.filter((th) => th.id !== active.value.id))

/* ---------- Aide et raccourcis clavier ---------- */
const help = ref(false)
const helpClose = ref(null)
let helpReturn = null
watch(help, async (open) => {
  if (open) {
    helpReturn = document.activeElement
    await nextTick()
    helpClose.value?.focus()
  } else {
    helpReturn?.focus?.()
    helpReturn = null
  }
})

function onKey(e) {
  if (e.key === 'F1') {
    e.preventDefault()
    help.value = !help.value
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleCmd()
    return
  }
  const el = e.target
  const typing = el instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
  if (e.key === 'Escape') {
    if (help.value) help.value = false
    else if (cmdOpen.value) toggleCmd(false)
    else if (typing) el.blur()
    else if (reading.value) router.push({ name: 'articles' })
    else if (route.name !== 'home') router.push({ name: 'home' })
    return
  }
  if (typing || help.value || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key === '/') {
    e.preventDefault()
    ;(document.getElementById('leon-list-q') ?? searchInput.value)?.focus()
    return
  }
  const item = NAV.value.find((n) => n.hotkey === e.key)
  if (item) router.push(item.to)
}

/* ---------- Barre d'onglets : l'onglet courant reste visible ---------- */
const navBar = ref(null)
function revealActiveTab() {
  const nav = navBar.value
  const link = nav?.querySelector('.leon-nav-link-on')
  if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return
  const box = nav.getBoundingClientRect()
  const tab = link.getBoundingClientRect()
  // Défilement horizontal de la barre seule : scrollIntoView bougerait aussi la page.
  nav.scrollBy({ left: tab.left - box.left - (box.width - tab.width) / 2, behavior: 'smooth' })
}

/*
 * Sur téléphone, le bandeau occupe près de la moitié de l'écran. Sur une page
 * intérieure, on défile donc jusqu'à la barre d'onglets : le contenu apparaît
 * tout de suite, et le bandeau reste à portée en remontant.
 */
const heroBox = ref(null)
function contentTop() {
  if (route.name === 'home' || !compactQuery.matches || !heroBox.value) return 0
  return Math.round(heroBox.value.getBoundingClientRect().bottom + window.scrollY)
}
watch(
  () => `${String(route.name)}|${route.params.slug ?? ''}|${route.hash}`,
  async () => {
    if (!route.hash) window.scrollTo({ top: contentTop(), behavior: 'smooth' })
    await nextTick()
    revealActiveTab()
  },
)
watch(lang, () => nextTick(revealActiveTab))

/* ---------- Cycle de vie ---------- */
onMounted(() => {
  root.classList.add('dark')
  clockTimer = window.setInterval(() => (now.value = new Date()), 1000)
  compactQuery.addEventListener('change', onCompactChange)
  window.addEventListener('keydown', onKey)
  if (heroCanvas.value) {
    hero = createHero(heroCanvas.value, { compact: compactQuery.matches })
    hero.start()
    // Sur téléphone, on lit sous le bandeau : inutile de l'animer hors de vue.
    if ('IntersectionObserver' in window) {
      heroSeen = new IntersectionObserver(([entry]) => (entry.isIntersecting ? hero?.start() : hero?.stop()))
      heroSeen.observe(heroCanvas.value)
    }
  }
  // Arrivée directe sur une page intérieure (lien partagé) : même logique,
  // sauf si le navigateur a déjà restauré une position de lecture.
  if (!route.hash && window.scrollY === 0) window.scrollTo({ top: contentTop() })
  revealActiveTab()
})

onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
  window.clearTimeout(toastTimer)
  compactQuery.removeEventListener('change', onCompactChange)
  window.removeEventListener('keydown', onKey)
  heroSeen?.disconnect()
  hero?.dispose()
  root.classList.remove('dark')
  root.lang = 'fr' // les autres formes sont en français
})
</script>

<template>
  <div class="theme-leon antialiased">
    <!-- Notification -->
    <div
      role="status"
      aria-live="polite"
      class="leon-panel pointer-events-none fixed bottom-4 right-4 z-[80] max-w-[calc(100vw-2rem)] px-3 py-1 text-[1.05rem] text-leon-green transition-all duration-300"
      :class="toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'"
    >
      [SYS] {{ toast.msg }}
    </div>

    <!-- Invite de commande -->
    <CmdPrompt :open="cmdOpen" @close="toggleCmd(false)" />

    <!-- Aide (F1) -->
    <div
      v-if="help"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leon-help-title"
      @click.self="help = false"
    >
      <div class="leon-panel w-full max-w-md">
        <h2 id="leon-help-title" class="leon-panel-head">{{ t('help.title') }}</h2>
        <div class="leon-panel-body text-[1.1rem]">
          <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
            <template v-for="[key, what] in t('help.keys')" :key="key">
              <dt class="text-leon-gold">[ {{ key }} ]</dt>
              <dd class="text-leon-ink/85">{{ what }}</dd>
            </template>
          </dl>
          <p class="mt-3 text-leon-dim">{{ t('help.tip') }}</p>
          <div class="mt-3 text-right">
            <button ref="helpClose" type="button" class="leon-btn" @click="help = false">{{ t('help.close') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="leon-screen">
      <!-- 1. Barre d'état -->
      <header class="leon-status">
        <span class="min-w-0 overflow-hidden text-ellipsis">
          [LeonTechLab v1.1<span class="hidden sm:inline"> &nbsp;—&nbsp; {{ profile.name }} / {{ t('status.lab') }}</span>
        </span>
        <span class="flex shrink-0 items-center gap-2">
          <span class="leon-lang" role="group" :aria-label="t('status.lang')">
            <button
              v-for="l in LANGS"
              :key="l.id"
              type="button"
              class="leon-lang-btn"
              :class="l.id === lang ? 'leon-lang-on' : ''"
              :aria-pressed="l.id === lang"
              :lang="l.id"
              :title="t('status.switchTo', { name: l.name })"
              @click="chooseLang(l.id)"
            >
              {{ l.label }}
            </button>
          </span>
          <span class="text-leon-gold">[ <span class="hidden sm:inline">{{ clockDate }} &nbsp;</span>{{ clockTime }} ]</span>
        </span>
      </header>

      <!-- 2. Bandeau lunaire -->
      <section ref="heroBox" class="leon-hero" :aria-label="t('hero.label')">
        <button
          type="button"
          class="block w-full cursor-pointer"
          :title="t('hero.launchTitle')"
          :aria-label="t('hero.launch')"
          @click="fireLander"
        >
          <canvas ref="heroCanvas" :width="heroInit.w" :height="heroInit.h" class="leon-hero-canvas" aria-hidden="true" />
        </button>

        <!-- Titre superposé : entre l'écusson et le sol lunaire -->
        <div
          class="pointer-events-none absolute bottom-[33%] left-[3%] right-[3%] top-[33%] flex flex-col items-center justify-center text-center sm:inset-y-0 sm:left-[22%] sm:right-[37%]"
        >
          <component :is="reading ? 'p' : 'h1'" class="leon-title text-[1.4rem] leading-none sm:text-[clamp(1.1rem,2.9vw,2.6rem)]">
            LeonTechLab
          </component>
          <p class="leon-subtitle mt-2 text-[1.08rem] leading-none sm:mt-3 sm:text-[clamp(1rem,1.6vw,1.45rem)]">
            {{ t('hero.subtitle') }}
          </p>
          <p class="mt-2 hidden italic leading-tight text-leon-bright-gold sm:block sm:text-[clamp(0.95rem,1.3vw,1.25rem)]">
            {{ t('hero.quote') }}
          </p>
          <p class="mt-2 text-[1rem] leading-none text-leon-green sm:text-[clamp(0.95rem,1.15vw,1.1rem)]">
            {{ t('hero.by') }} {{ profile.name }} <span class="text-leon-dim">·</span> @{{ profile.handle }}
          </p>
        </div>
      </section>

      <!-- 3. Barre de navigation -->
      <nav ref="navBar" class="leon-nav" :aria-label="t('nav.label')">
        <template v-for="item in NAV" :key="item.key">
          <a v-if="item.href" :href="item.href" target="_blank" rel="noopener noreferrer" class="leon-nav-link">
            {{ t(`nav.${item.key}`) }}<span class="sr-only"> {{ t('nav.newTab') }}</span>
          </a>
          <RouterLink
            v-else
            :to="item.to"
            class="leon-nav-link"
            :class="navActive(item.key) ? 'leon-nav-link-on' : ''"
            :aria-current="navActive(item.key) ? 'page' : undefined"
          >
            {{ t(`nav.${item.key}`) }}
          </RouterLink>
        </template>
      </nav>

      <!-- 4. Trois colonnes ; sur téléphone une seule, le contenu d'abord -->
      <div class="grid flex-1 grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-[220px_minmax(0,1fr)_236px] lg:gap-2.5 lg:p-2.5">
        <!-- Colonne de gauche -->
        <aside class="order-3 space-y-2 lg:order-none">
          <section class="leon-panel hidden lg:block">
            <h2 class="leon-panel-head">{{ t('menu.title') }}</h2>
            <ul class="py-1">
              <li v-for="item in MENU" :key="item.key">
                <button
                  type="button"
                  class="leon-menu-item"
                  :class="menuActive(item) ? 'leon-menu-item-on' : ''"
                  :aria-current="menuActive(item) ? 'page' : undefined"
                  @click="pickMenu(item)"
                >
                  <span class="min-w-0 leading-tight">{{ item.label }}</span>
                </button>
              </li>
            </ul>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">{{ t('tools.title') }}</h2>
            <div class="py-1">
              <form class="leon-menu-item leon-menu-form" role="search" @submit.prevent="submitSearch">
                <label for="leon-search" class="shrink-0">{{ t('tools.search') }}&nbsp;:</label>
                <input
                  id="leon-search"
                  ref="searchInput"
                  v-model="searchText"
                  type="search"
                  enterkeyhint="search"
                  placeholder="_"
                  class="leon-field"
                  autocomplete="off"
                  :aria-label="t('tools.searchLabel')"
                />
              </form>
              <button type="button" class="leon-menu-item" @click="openArchives()">{{ t('tools.archives') }}</button>
              <button type="button" class="leon-menu-item" @click="randomArticle">{{ t('tools.random') }}</button>
              <button type="button" class="leon-menu-item" @click="toggleCmd(true)">{{ t('tools.cmd') }} (Ctrl+K)</button>
              <button type="button" class="leon-menu-item" @click="help = true">{{ t('tools.help') }}</button>
            </div>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">{{ t('counter.title') }}</h2>
            <ul class="leon-panel-body text-[1.08rem] leading-tight">
              <li v-for="s in stats" :key="s.label" class="flex justify-between gap-2">
                <span class="text-leon-ink/85">{{ s.label }}</span>
                <span class="text-leon-green">: {{ s.value }}</span>
              </li>
            </ul>
          </section>
        </aside>

        <!-- Colonne centrale -->
        <main class="order-1 min-w-0 sm:col-span-2 lg:order-none lg:col-span-1">
          <ArticlesView
            v-if="view === 'articles'"
            v-model:filter="filter"
            v-model:query="query"
            :mode="listMode"
            :selected="selected"
            :reading="reading"
            @copy-bibtex="copyBibtex"
            @open-lab="openLab"
            @close="router.push({ name: 'articles' })"
          />
          <ProjectsView v-else-if="view === 'projects'" />
          <LabView v-else-if="view === 'lab'" :module="labModule" />
          <AboutView v-else-if="view === 'about'" :contact="contact" />
        </main>

        <!-- Colonne de droite -->
        <aside class="order-2 space-y-2 lg:order-none">
          <section class="leon-panel">
            <h2 class="leon-panel-head">{{ t('profile.title') }}</h2>
            <div class="leon-panel-body flex gap-3">
              <ProfileAvatar :size="64" />
              <div class="min-w-0 text-[1.06rem] leading-tight">
                <p class="text-[1.2rem] leading-tight text-leon-gold">{{ profile.name }}</p>
                <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="text-leon-green hover:text-leon-bright">
                  @{{ profile.handle }}
                </a>
                <p class="text-leon-ink/85">{{ profile.role }}</p>
                <p class="text-leon-dim">{{ profile.city }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-x-1 px-2 pb-2">
              <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="leon-btn">GitHub</a>
              <a :href="profile.links.linkedin" target="_blank" rel="noopener noreferrer" class="leon-btn">LinkedIn</a>
              <RouterLink :to="{ name: 'about' }" class="leon-btn">{{ t('profile.career') }}</RouterLink>
            </div>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">{{ t('quote.title') }}</h2>
            <blockquote class="leon-panel-body text-[1.08rem] leading-tight">
              <p class="italic text-leon-ink/90">{{ t('quote.open') }}{{ citation[0] }}{{ t('quote.close') }}</p>
              <footer class="mt-1 text-right text-leon-gold">— {{ citation[1] }}</footer>
            </blockquote>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">{{ t('newsletter.title') }}</h2>
            <form class="leon-panel-body text-[1.06rem]" @submit.prevent="subscribe">
              <p class="leading-tight text-leon-ink/85">{{ t('newsletter.text') }}</p>
              <label for="leon-email" class="sr-only">{{ t('newsletter.label') }}</label>
              <input
                id="leon-email"
                v-model="email"
                type="email"
                class="leon-field mt-2"
                :placeholder="t('newsletter.placeholder')"
                autocomplete="email"
                required
              />
              <div class="mt-2 text-center">
                <button type="submit" class="leon-btn leon-btn-gold">{{ t('newsletter.button') }}</button>
              </div>
            </form>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">{{ t('links.title') }}</h2>
            <ul class="leon-panel-body grid grid-cols-2 gap-x-3 gap-y-0.5 text-[1.06rem]">
              <li v-for="(l, i) in LIENS" :key="l.label" class="min-w-0" :class="i % 2 === 0 ? 'border-r border-leon-green/40 pr-2' : ''">
                <a :href="l.url" target="_blank" rel="noopener noreferrer" class="block truncate text-leon-green hover:text-leon-bright">
                  {{ l.label }}
                </a>
              </li>
            </ul>
          </section>

          <section v-if="archive" class="leon-panel">
            <h2 class="leon-panel-head">{{ t('forms.title') }}</h2>
            <div class="leon-panel-body text-[1.06rem]">
              <p class="text-leon-dim">{{ number(active) }}/{{ themes.length }} — {{ themeLabel(active).name }}</p>
              <ul class="mt-1">
                <li v-for="th in others" :key="th.id">
                  <button type="button" class="leon-btn leon-btn-wrap w-full" :title="themeLabel(th).summary" @click="setTheme(th.id)">
                    {{ number(th) }}. {{ themeLabel(th).name }}
                  </button>
                </li>
              </ul>
            </div>
          </section>
        </aside>
      </div>

      <!-- 5. Barre d'état basse -->
      <footer class="leon-status leon-status-bottom">
        <span class="min-w-0 overflow-hidden text-ellipsis">
          <span class="hidden sm:inline">{{ t('footer.motto') }}</span>
          <span class="sm:hidden">{{ t('footer.short', { name: profile.name }) }}</span>
        </span>
        <span class="hidden shrink-0 gap-3 md:flex">
          <button type="button" class="hover:text-leon-bright" @click="router.push({ name: 'home' })">{{ t('footer.esc') }}</button>
          <button type="button" class="hover:text-leon-bright" @click="help = true">{{ t('footer.f1') }}</button>
          <button type="button" class="hover:text-leon-bright" @click="toggleCmd(true)">{{ t('footer.cmd') }}</button>
        </span>
        <button
          ref="cmdButton"
          type="button"
          class="leon-prompt shrink-0 text-leon-ink"
          :aria-label="t('footer.prompt')"
          :aria-expanded="cmdOpen"
          @click="toggleCmd()"
        >
          C:\&gt;<span class="leon-cursor" aria-hidden="true" />
        </button>
      </footer>
    </div>
  </div>
</template>
