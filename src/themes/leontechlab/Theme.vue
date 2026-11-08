<script setup>
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articles, categories, profile } from '../../content/index.js'
import { useThemes } from '../../core/themes.js'
import { copyText } from '../../core/clipboard.js'
import { createHero, HERO_H, HERO_W } from './hero.js'
import ArticlesView from './components/ArticlesView.vue'
import ProjectsView from './components/ProjectsView.vue'
import LabView from './components/LabView.vue'
import AboutView from './components/AboutView.vue'
import './theme.css'

/*
 * Forme 6 — « LeonTechLab »
 * Portail rétro : terminal à phosphore vert, barre beige biseautée des
 * années 90, cadres néon et bandeau d'accueil en pixel art.
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

/* ---------- Bandeau d'accueil ---------- */
const heroCanvas = ref(null)
let hero = null
function fireRocket() {
  if (hero?.fire()) showToast('🚀 Allumage des propulseurs LeonTechLab !')
}

/* ---------- Horloge française ---------- */
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const clock = ref('')
let clockTimer = 0
function tickClock() {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  clock.value = `${JOURS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')} ${MOIS[d.getMonth()]} ${d.getFullYear()}   ${hh}:${mm}:${ss}`
}

/* ---------- Sections ---------- */
const view = computed(
  () => ({ projects: 'projects', lab: 'lab', arena: 'lab', about: 'about' })[route.name] ?? 'articles',
)
const reading = computed(() => route.name === 'article')

const LAB_IDS = ['glitch', 'pulaar', 'weibull']
const labModule = computed(() => (LAB_IDS.includes(route.params.module) ? route.params.module : 'glitch'))

/**
 * La maquette propose « Accueil » et « Articles », qui mènent au même endroit.
 * On les distingue sur l'état plutôt que sur la destination : Accueil = l'index,
 * Articles = un article ouvert. Sans ça, les deux onglets paraissaient enfoncés
 * en même temps.
 */
const NAV = computed(() => [
  { key: 'home', label: 'Accueil', to: { name: 'home' } },
  { key: 'reading', label: 'Articles', to: { name: 'article', params: { slug: selected.value?.slug ?? articles[0]?.slug } } },
  { key: 'projects', label: `Projets (GitHub ${profile.githubRepoCount})`, to: { name: 'projects' } },
  { key: 'lab', label: 'Recherche & Cyber-Lab', to: { name: 'lab', params: { module: labModule.value } } },
  { key: 'about', label: 'À propos', to: { name: 'about' } },
])
function navActive(item) {
  if (item.key === 'home') return view.value === 'articles' && !reading.value
  if (item.key === 'reading') return reading.value
  return item.key === view.value
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
function submitSearch() {
  const q = query.value.trim().toLowerCase()
  if (!q) return
  const hit = articles.find((a) => `${a.title} ${a.abstract} ${a.tag}`.toLowerCase().includes(q))
  if (hit) {
    selectArticle(hit.slug)
    showToast(`Résultat : ${hit.title}`)
  } else {
    showToast('Aucun article ne correspond')
  }
  query.value = ''
}

/* ---------- Barre latérale ---------- */
const DOMAINES = [
  { glyph: '▚', label: 'Intelligence Artificielle', cat: 'speech-ai' },
  { glyph: '◆', label: 'Machine Learning & ASR', cat: 'speech-ai' },
  { glyph: '▲', label: 'Cybersécurité & Hardware', cat: 'security' },
  { glyph: '✦', label: 'Espace & Sciences', cat: 'security' },
  { glyph: '▦', label: 'Informatique & Réseaux CCNA', cat: 'security' },
  { glyph: '⚙', label: 'GMAO & Maintenance', cat: 'industrial' },
  { glyph: '◉', label: 'Innovation Africaine (Pulaar/Wolof)', cat: 'speech-ai' },
]
const LIENS = [
  { label: 'GitHub (@leonbathie)', url: 'https://github.com/leonbathie' },
  { label: 'Hugging Face', url: 'https://huggingface.co' },
  { label: 'ArXiv', url: 'https://arxiv.org' },
  { label: 'Papers with Code', url: 'https://paperswithcode.com' },
  { label: 'DeepMind', url: 'https://deepmind.google' },
  { label: 'OpenAI', url: 'https://openai.com' },
  { label: 'Anthropic', url: 'https://anthropic.com' },
]
function pickDomain(cat) {
  filter.value = cat
  if (view.value !== 'articles' || reading.value) router.push({ name: 'home' })
  showToast(`Domaine : ${categories.find((c) => c.id === cat)?.label ?? cat}`)
}

const stats = computed(() => [
  { label: 'Articles publiés', value: articles.length },
  { label: 'Dépôts GitHub', value: profile.githubRepoCount },
  { label: 'Formes du blog', value: themes.length },
])

const others = computed(() => themes.filter((t) => t.id !== active.value.id))

onMounted(() => {
  document.title = 'LeonTechLab — Ousmane Ba | AI • Science • Innovation'
  root.classList.add('dark')
  tickClock()
  clockTimer = window.setInterval(tickClock, 1000)
  if (heroCanvas.value) {
    hero = createHero(heroCanvas.value)
    hero.start()
  }
})

onBeforeUnmount(() => {
  window.clearInterval(clockTimer)
  window.clearTimeout(toastTimer)
  hero?.dispose()
  root.classList.remove('dark')
})

watch(view, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
</script>

<template>
  <div class="theme-leon flex min-h-screen flex-col text-leon-ink antialiased">
    <!-- Notification -->
    <div
      role="status"
      aria-live="polite"
      class="leon-box pointer-events-none fixed bottom-4 right-4 z-[80] px-3 py-2 text-[0.7rem] text-leon-green transition-all duration-300"
      :class="toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'"
    >
      [SYS] {{ toast.msg }}
    </div>

    <!-- 1. Barre d'état -->
    <div class="border-b border-leon-green/40 bg-leon-bg/90 px-3 py-1.5 text-[0.64rem] sm:px-4">
      <div class="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span class="text-leon-green">
          LeonTechLab v1.0 <span class="text-leon-dim">—</span>
          <span class="text-leon-gold">Build</span> •
          <span class="text-leon-gold">Learn</span> •
          <span class="text-leon-gold">Innovate</span>
        </span>
        <span class="text-leon-gold">{{ clock }}</span>
      </div>
    </div>

    <div class="mx-auto w-full max-w-[1180px] flex-1 px-2 py-3 sm:px-4">
      <!-- 2. Bandeau d'accueil -->
      <header class="leon-box relative overflow-hidden">
        <button
          type="button"
          class="block w-full"
          title="Cliquez pour lancer la fusée LeonTechLab"
          @click="fireRocket"
        >
          <canvas ref="heroCanvas" :width="HERO_W" :height="HERO_H" class="leon-hero-canvas" aria-hidden="true" />
        </button>

        <!-- Titre superposé -->
        <div class="pointer-events-none absolute inset-0 flex items-center">
          <div class="pl-[20%] pr-4 sm:pl-[19%]">
            <h1 class="leon-title text-xl leading-tight sm:text-3xl lg:text-4xl">LeonTechLab</h1>
            <p class="mt-1 font-silk text-[0.56rem] text-leon-green sm:text-[0.72rem]">
              AI <span class="text-leon-gold">•</span> Science <span class="text-leon-gold">•</span> Innovation
            </p>
            <p class="mt-2 hidden text-[0.68rem] italic text-leon-beige sm:block">
              Exploring the frontiers of Technology…
            </p>
          </div>
          <div class="ml-auto hidden pr-5 text-right font-silk text-[0.6rem] leading-relaxed text-leon-gold lg:block">
            <div>Dream it.</div>
            <div>Build it.</div>
            <div>Share it.</div>
          </div>
        </div>
      </header>

      <!-- 3. Barre de navigation beige -->
      <nav class="leon-navbar mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 px-2 py-1.5" aria-label="Navigation principale">
        <RouterLink
          v-for="item in NAV"
          :key="item.key"
          :to="item.to"
          class="leon-nav-link"
          :class="navActive(item) ? 'leon-nav-link-on' : ''"
          :aria-current="navActive(item) ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>

        <form class="ml-auto flex items-center gap-1" role="search" @submit.prevent="submitSearch">
          <label for="leon-search" class="sr-only">Rechercher un article</label>
          <input
            id="leon-search"
            v-model="query"
            type="search"
            placeholder="Rechercher…"
            class="w-28 border-2 border-[#6e6049] bg-[#fdfaf2] px-2 py-0.5 text-[0.7rem] text-[#1a1612] sm:w-44"
          />
          <button type="submit" class="border-2 border-[#fff8eb] border-b-[#6e6049] border-r-[#6e6049] bg-[#d2c2a8] px-2 py-0.5 text-[0.7rem] text-[#1a1612]">
            🔍
          </button>
        </form>
      </nav>

      <!-- 4. Grille à trois colonnes -->
      <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[200px_minmax(0,1fr)_212px]">
        <!-- Colonne de gauche.
             `order` : sur téléphone les colonnes s'empilent, et le contenu doit
             venir en premier — sinon il faut faire défiler trois encadrés avant
             d'atteindre le moindre article. -->
        <aside class="order-2 space-y-3 lg:order-none">
          <section class="leon-box p-2.5">
            <h2 class="leon-box-header font-silk text-[0.62rem]">Domaines</h2>
            <ul class="space-y-1 text-[0.68rem]">
              <li v-for="d in DOMAINES" :key="d.label">
                <button type="button" class="flex w-full items-start gap-1.5 text-left hover:text-leon-green" @click="pickDomain(d.cat)">
                  <span class="text-leon-gold">{{ d.glyph }}</span>
                  <span class="leading-snug">{{ d.label }}</span>
                </button>
              </li>
            </ul>
          </section>

          <section class="leon-box p-2.5">
            <h2 class="leon-box-header font-silk text-[0.62rem]">Liens utiles</h2>
            <ul class="space-y-0.5 text-[0.68rem]">
              <li v-for="l in LIENS" :key="l.label">
                <a :href="l.url" target="_blank" rel="noopener noreferrer" class="flex justify-between gap-2 hover:text-leon-green">
                  <span>{{ l.label }}</span><span class="text-leon-gold">›</span>
                </a>
              </li>
            </ul>
          </section>

          <section class="leon-box p-2.5 text-[0.68rem]">
            <div class="text-leon-green">$ whoami</div>
            <div class="mt-1 text-leon-gold">{{ profile.name }}</div>
            <div class="text-leon-ink/75">AI Engineer &amp; Researcher</div>
            <div class="text-leon-ink/75">{{ profile.city }}, {{ profile.country }}</div>
            <div class="mt-1 text-leon-green">$ <span class="animate-pulse">▌</span></div>
          </section>
        </aside>

        <!-- Colonne centrale -->
        <main class="order-1 min-w-0 lg:order-none">
          <ArticlesView
            v-if="view === 'articles'"
            v-model:filter="filter"
            :selected="selected"
            :reading="reading"
            @select="selectArticle"
            @copy-bibtex="copyBibtex"
            @open-lab="openLab"
            @close="router.push({ name: 'home' })"
          />
          <ProjectsView v-else-if="view === 'projects'" />
          <LabView v-else-if="view === 'lab'" :module="labModule" />
          <AboutView v-else-if="view === 'about'" />
        </main>

        <!-- Colonne de droite -->
        <aside class="order-3 space-y-3 lg:order-none">
          <section class="leon-box p-2.5">
            <h2 class="leon-box-header font-silk text-[0.62rem]">À propos</h2>
            <div class="text-[0.68rem]">
              <div class="font-silk text-[0.6rem] text-leon-gold">{{ profile.name }}</div>
              <p class="mt-1.5 leading-relaxed text-leon-ink/75">
                Ingénieur en IA, passionné de technologie et de culture africaine.
              </p>
              <p class="mt-2 leading-relaxed text-leon-ink/75">
                Construire un pont entre la science, l'innovation et notre patrimoine.
              </p>
              <RouterLink :to="{ name: 'about' }" class="mt-2 block text-leon-green hover:text-leon-bright">
                → En savoir plus…
              </RouterLink>
            </div>
          </section>

          <section class="leon-box p-2.5">
            <h2 class="leon-box-header font-silk text-[0.62rem]">✉ Contact</h2>
            <p class="text-[0.68rem] leading-relaxed text-leon-ink/75">
              Une question, une collaboration&nbsp;?
            </p>
            <a :href="`mailto:${profile.links.email}`" class="leon-btn leon-btn-gold mt-2 w-full">Écrire</a>
          </section>

          <section class="leon-box p-2.5">
            <h2 class="leon-box-header font-silk text-[0.62rem]">📊 Statistiques</h2>
            <ul class="space-y-1 text-[0.68rem]">
              <li v-for="s in stats" :key="s.label" class="flex justify-between gap-2">
                <span class="text-leon-ink/75">{{ s.label }}</span>
                <span class="text-leon-green">{{ s.value }}</span>
              </li>
            </ul>
          </section>

          <section v-if="archive" class="leon-box p-2.5">
            <h2 class="leon-box-header font-silk text-[0.62rem]">Formes</h2>
            <p class="mb-1.5 text-[0.64rem] text-leon-dim">{{ number(active) }}/{{ themes.length }} — {{ active.name }}</p>
            <div class="flex flex-wrap gap-1">
              <button v-for="t in others" :key="t.id" type="button" class="leon-btn text-[0.62rem]" :title="t.summary" @click="setTheme(t.id)">
                {{ number(t) }}. {{ t.name }}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <!-- 5. Pied de page -->
    <footer class="mt-4 border-t border-leon-green/40 bg-leon-bg/90 px-3 py-2 text-[0.64rem] sm:px-4">
      <div class="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-1 text-center sm:flex-row sm:text-left">
        <span class="text-leon-dim">© 2026 LeonTechLab — {{ profile.name }}</span>
        <span class="text-leon-gold">« La technologie au service d'un monde meilleur »</span>
      </div>
    </footer>
  </div>
</template>
