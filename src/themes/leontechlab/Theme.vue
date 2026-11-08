<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articles, categories, profile } from '../../content/index.js'
import { useThemes } from '../../core/themes.js'
import { copyText } from '../../core/clipboard.js'
import { createHero, LAYOUTS } from './hero.js'
import { dateHorloge, heureHorloge, moisCourt } from './format.js'
import ArticlesView from './components/ArticlesView.vue'
import ProjectsView from './components/ProjectsView.vue'
import LabView from './components/LabView.vue'
import AboutView from './components/AboutView.vue'
import ProfileAvatar from './components/ProfileAvatar.vue'
import './theme.css'

/*
 * Forme 6 — « LeonTechLab »
 * Console rétro : écran à phosphore vert encadré, barre d'état et horloge,
 * bandeau lunaire en pixel art, navigation « [ crochets ] », trois colonnes
 * de panneaux « :: Titre :: », titres d'articles cyan.
 *
 * L'écusson du bandeau est un dessin original : on ne reprend pas l'emblème
 * d'une agence spatiale réelle, qui laisserait croire à une affiliation.
 */

const route = useRoute()
const router = useRouter()
const { themes, active, archive, setTheme, number } = useThemes()
const root = document.documentElement

/* ---------- Notifications ---------- */
const toast = reactive({ msg: '', show: false })
let toastTimer = 0
function showToast(msg) {
  toast.msg = msg
  toast.show = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.show = false), 2600)
}
provide('leon', { toast: showToast })

/* ---------- Bandeau ---------- */
// Même seuil que le préfixe `sm:` de Tailwind, qui place le titre par-dessus.
const compactQuery = window.matchMedia('(max-width: 639px)')
// Taille initiale seulement : c'est hero.js qui redimensionne ensuite le canevas.
// Lier ces attributs à une valeur réactive effacerait l'image à chaque bascule.
const heroInit = compactQuery.matches ? LAYOUTS.compact : LAYOUTS.wide
const heroCanvas = ref(null)
let hero = null
let heroSeen = null // l'animation s'arrête quand le bandeau sort de l'écran
const onCompactChange = (e) => hero?.setCompact(e.matches)
function fireLander() {
  if (hero?.fire()) showToast("Décollage de l'étage de remontée !")
}

/* ---------- Horloge ---------- */
const clockDate = ref('')
const clockTime = ref('')
let clockTimer = 0
function tickClock() {
  const d = new Date()
  clockDate.value = dateHorloge(d)
  clockTime.value = heureHorloge(d)
}

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
  { key: 'home', label: 'Accueil', to: { name: 'home' }, hotkey: '1' },
  { key: 'articles', label: 'Articles', to: { name: 'articles' }, hotkey: '2' },
  { key: 'projects', label: 'Projets', to: { name: 'projects' }, hotkey: '3' },
  { key: 'lab', label: 'Recherche', to: { name: 'lab', params: { module: labModule.value } }, hotkey: '4' },
  { key: 'github', label: 'GitHub', href: profile.links.github },
  { key: 'about', label: 'À propos', to: { name: 'about' }, hotkey: '5' },
  { key: 'contact', label: 'Contact', to: { name: 'about', hash: '#contact' }, hotkey: '6' },
])
function navActive(key) {
  switch (key) {
    case 'home':
      return route.name === 'home'
    case 'articles':
      return route.name === 'articles' || reading.value
    case 'projects':
    case 'lab':
      return view.value === key
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
  () => (reading.value ? articles.find((a) => a.slug === route.params.slug) : null) ?? articles[0] ?? null,
)
function selectArticle(slug) {
  router.push({ name: 'article', params: { slug } })
}
function openLab(module) {
  router.push({ name: 'lab', params: { module: LAB_IDS.includes(module) ? module : 'glitch' } })
}
async function copyBibtex() {
  if (!selected.value) return
  showToast((await copyText(selected.value.bibtex)) ? 'Citation BibTeX copiée' : 'La copie a échoué')
}
function openArchives(cat = 'all') {
  filter.value = cat
  query.value = ''
  router.push({ name: 'articles' })
}

/* ---------- Menu principal (colonne de gauche) ---------- */
const MENU = computed(() => [
  { key: 'home', label: 'Accueil', to: { name: 'home' } },
  { key: 'articles', label: 'Articles', cat: 'all' },
  { key: 'projects', label: 'Projets', to: { name: 'projects' } },
  { key: 'lab', label: 'Recherche & Cyber-Lab', to: { name: 'lab', params: { module: labModule.value } } },
  { key: 'cat:security', label: 'Cybersécurité & Hardware', cat: 'security' },
  { key: 'cat:industrial', label: 'GMAO & Industrie', cat: 'industrial' },
  { key: 'cat:speech-ai', label: 'IA en Afrique', cat: 'speech-ai' },
  { key: 'about', label: 'À propos', to: { name: 'about' } },
  { key: 'contact', label: 'Contact', to: { name: 'about', hash: '#contact' } },
])
function menuActive(item) {
  if (item.cat) return route.name === 'articles' && filter.value === item.cat
  return navActive(item.key)
}
function pickMenu(item) {
  if (!item.cat) return router.push(item.to)
  openArchives(item.cat)
  if (item.cat !== 'all') showToast(`Domaine : ${categories.find((c) => c.id === item.cat)?.label ?? item.cat}`)
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
  const pool = reading.value ? articles.filter((a) => a.slug !== selected.value?.slug) : articles
  const pick = pool[Math.floor(Math.random() * pool.length)]
  if (!pick) return
  selectArticle(pick.slug)
  showToast('Article tiré au sort')
}

/* ---------- Colonne de droite ---------- */
const CITATIONS = [
  { text: 'La technologie au service d’un monde meilleur.', by: 'LeonTechLab' },
  { text: 'Build Knowledge. Build a Better Future.', by: 'LeonTechLab' },
  { text: 'Dream it. Build it. Share it.', by: 'LeonTechLab' },
  { text: 'Construire un pont entre la science, l’innovation et notre patrimoine.', by: profile.name },
]
const citation = CITATIONS[Math.floor(Date.now() / 86_400_000) % CITATIONS.length]

const LIENS = [
  { label: 'GitHub', url: profile.links.github },
  { label: 'LinkedIn', url: profile.links.linkedin },
  { label: 'Hugging Face', url: 'https://huggingface.co' },
  { label: 'arXiv', url: 'https://arxiv.org' },
  { label: 'Anthropic', url: 'https://www.anthropic.com' },
  { label: 'DeepMind', url: 'https://deepmind.google' },
  { label: 'OpenAI', url: 'https://openai.com' },
  { label: 'Scholar', url: 'https://scholar.google.com' },
]

/* Lettre d'information : sans serveur, la demande part de la messagerie du visiteur */
const email = ref('')
function subscribe() {
  const subject = encodeURIComponent('Abonnement aux articles LeonTechLab')
  const body = encodeURIComponent(
    `Bonjour ${profile.name},\n\nJe souhaite être prévenu(e) des nouveaux articles de LeonTechLab.\nMon adresse : ${email.value.trim()}\n`,
  )
  window.location.href = `mailto:${profile.links.email}?subject=${subject}&body=${body}`
  showToast('Ouverture de votre messagerie…')
}

const oldest = articles[articles.length - 1]
const stats = [
  { label: 'Articles', value: articles.length },
  { label: 'Dépôts', value: profile.githubRepoCount },
  { label: 'Formes', value: themes.length },
  { label: 'Depuis', value: oldest ? moisCourt(oldest.date) : '—' },
]

const others = computed(() => themes.filter((t) => t.id !== active.value.id))

/* ---------- Aide et raccourcis clavier ---------- */
const help = ref(false)
const helpClose = ref(null)
let helpReturn = null
const SHORTCUTS = [
  ['1 … 6', 'Accueil, Articles, Projets, Recherche, À propos, Contact'],
  ['/', 'Rechercher un article'],
  ['Échap', 'Fermer, revenir à la liste puis à l’accueil'],
  ['F1', 'Cette aide'],
]
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
  const el = e.target
  const typing = el instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
  if (e.key === 'Escape') {
    if (help.value) help.value = false
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

/* ---------- Cycle de vie ---------- */
onMounted(() => {
  document.title = `LeonTechLab — ${profile.name} (@${profile.handle}) | AI Research Lab`
  root.classList.add('dark')
  tickClock()
  clockTimer = window.setInterval(tickClock, 1000)
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
        <h2 id="leon-help-title" class="leon-panel-head">Aide — raccourcis clavier</h2>
        <div class="leon-panel-body text-[1.1rem]">
          <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
            <template v-for="[key, what] in SHORTCUTS" :key="key">
              <dt class="text-leon-gold">[ {{ key }} ]</dt>
              <dd class="text-leon-ink/85">{{ what }}</dd>
            </template>
          </dl>
          <p class="mt-3 text-leon-dim">Un clic sur le bandeau fait décoller le module lunaire.</p>
          <div class="mt-3 text-right">
            <button ref="helpClose" type="button" class="leon-btn" @click="help = false">Fermer</button>
          </div>
        </div>
      </div>
    </div>

    <div class="leon-screen">
      <!-- 1. Barre d'état -->
      <header class="leon-status">
        <span class="min-w-0 overflow-hidden text-ellipsis">
          [LeonTechLab v1.0<span class="hidden sm:inline"> &nbsp;—&nbsp; {{ profile.name }} / AI Research Lab</span>
        </span>
        <span class="shrink-0 text-leon-gold">
          [ <span class="hidden sm:inline">{{ clockDate }} &nbsp;</span>{{ clockTime }} ]
        </span>
      </header>

      <!-- 2. Bandeau lunaire -->
      <section ref="heroBox" class="leon-hero" aria-label="Bandeau LeonTechLab">
        <button
          type="button"
          class="block w-full cursor-pointer"
          title="Cliquez pour faire décoller le module lunaire"
          aria-label="Faire décoller le module lunaire"
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
            Research • Innovation • Knowledge
          </p>
          <p class="mt-2 hidden italic leading-tight text-leon-bright-gold sm:block sm:text-[clamp(0.95rem,1.3vw,1.25rem)]">
            "Exploring the frontiers of Artificial Intelligence..."
          </p>
          <p class="mt-2 text-[1rem] leading-none text-leon-green sm:text-[clamp(0.95rem,1.15vw,1.1rem)]">
            par {{ profile.name }} <span class="text-leon-dim">·</span> @{{ profile.handle }}
          </p>
        </div>
      </section>

      <!-- 3. Barre de navigation -->
      <nav ref="navBar" class="leon-nav" aria-label="Navigation principale">
        <template v-for="item in NAV" :key="item.key">
          <a v-if="item.href" :href="item.href" target="_blank" rel="noopener noreferrer" class="leon-nav-link">
            {{ item.label }}<span class="sr-only"> (nouvel onglet)</span>
          </a>
          <RouterLink
            v-else
            :to="item.to"
            class="leon-nav-link"
            :class="navActive(item.key) ? 'leon-nav-link-on' : ''"
            :aria-current="navActive(item.key) ? 'page' : undefined"
          >
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>

      <!-- 4. Trois colonnes ; sur téléphone une seule, le contenu d'abord -->
      <div class="grid flex-1 grid-cols-1 gap-2 p-2 sm:grid-cols-2 lg:grid-cols-[220px_minmax(0,1fr)_236px] lg:gap-2.5 lg:p-2.5">
        <!-- Colonne de gauche -->
        <aside class="order-3 space-y-2 lg:order-none">
          <section class="leon-panel hidden lg:block">
            <h2 class="leon-panel-head">Menu Principal</h2>
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
            <h2 class="leon-panel-head">Outils</h2>
            <div class="py-1">
              <form class="leon-menu-item leon-menu-form" role="search" @submit.prevent="submitSearch">
                <label for="leon-search" class="shrink-0">Recherche&nbsp;:</label>
                <input
                  id="leon-search"
                  ref="searchInput"
                  v-model="searchText"
                  type="search"
                  enterkeyhint="search"
                  placeholder="_"
                  class="leon-field"
                  autocomplete="off"
                />
              </form>
              <button type="button" class="leon-menu-item" @click="openArchives()">Archives</button>
              <button type="button" class="leon-menu-item" @click="randomArticle">Article au hasard</button>
              <button type="button" class="leon-menu-item" @click="help = true">Aide (F1)</button>
            </div>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">Compteur</h2>
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
            <h2 class="leon-panel-head">Profil</h2>
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
              <RouterLink :to="{ name: 'about' }" class="leon-btn">Parcours</RouterLink>
            </div>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">Citation</h2>
            <blockquote class="leon-panel-body text-[1.08rem] leading-tight">
              <p class="italic text-leon-ink/90">« {{ citation.text }} »</p>
              <footer class="mt-1 text-right text-leon-gold">— {{ citation.by }}</footer>
            </blockquote>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">Newsletter</h2>
            <form class="leon-panel-body text-[1.06rem]" @submit.prevent="subscribe">
              <p class="leading-tight text-leon-ink/85">Recevez les nouveaux articles par courriel&nbsp;:</p>
              <label for="leon-email" class="sr-only">Votre adresse de courriel</label>
              <input
                id="leon-email"
                v-model="email"
                type="email"
                class="leon-field mt-2"
                placeholder="[ Votre email... ]"
                autocomplete="email"
                required
              />
              <div class="mt-2 text-center">
                <button type="submit" class="leon-btn leon-btn-gold">S'abonner</button>
              </div>
            </form>
          </section>

          <section class="leon-panel">
            <h2 class="leon-panel-head">Liens</h2>
            <ul class="leon-panel-body grid grid-cols-2 gap-x-3 gap-y-0.5 text-[1.06rem]">
              <li v-for="(l, i) in LIENS" :key="l.label" class="min-w-0" :class="i % 2 === 0 ? 'border-r border-leon-green/40 pr-2' : ''">
                <a :href="l.url" target="_blank" rel="noopener noreferrer" class="block truncate text-leon-green hover:text-leon-bright">
                  {{ l.label }}
                </a>
              </li>
            </ul>
          </section>

          <section v-if="archive" class="leon-panel">
            <h2 class="leon-panel-head">Formes du blog</h2>
            <div class="leon-panel-body text-[1.06rem]">
              <p class="text-leon-dim">{{ number(active) }}/{{ themes.length }} — {{ active.name }}</p>
              <ul class="mt-1">
                <li v-for="t in others" :key="t.id">
                  <button type="button" class="leon-btn leon-btn-wrap w-full" :title="t.summary" @click="setTheme(t.id)">
                    {{ number(t) }}. {{ t.name }}
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
          <span class="hidden sm:inline">LeonTechLab - Build Knowledge. Build a Better Future.</span>
          <span class="sm:hidden">© LeonTechLab — {{ profile.name }}</span>
        </span>
        <span class="hidden shrink-0 gap-3 md:flex">
          <button type="button" class="hover:text-leon-bright" @click="router.push({ name: 'home' })">[ ESC ] : Menu</button>
          <button type="button" class="hover:text-leon-bright" @click="help = true">[ F1 ] : Aide</button>
        </span>
        <span class="shrink-0 text-leon-ink" aria-hidden="true">C:\&gt;<span class="leon-cursor" /></span>
      </footer>
    </div>
  </div>
</template>
