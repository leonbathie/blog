<script setup>
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articles, dotDate, profile } from '../../content/index.js'
import { useThemes } from '../../core/themes.js'
import { useUtcClock } from '../../core/useClock.js'
import { copyText } from '../../core/clipboard.js'
import { readPref, writePref } from '../../core/prefs.js'
import { LAB_MODULES } from './labs.js'
import ArticlesView from './components/ArticlesView.vue'
import SystemsView from './components/SystemsView.vue'
import LabView from './components/LabView.vue'
import AboutView from './components/AboutView.vue'
import './theme.css'

/*
 * Forme 3 — « Planche »
 * Planche technique : papier millimétré, filets durs, cartouche et cotes.
 * Mode sombre = cyanotype (bleu de plan). Aucune dépendance 3D : c'est la plus légère des formes.
 */

const route = useRoute()
const router = useRouter()
const { themes, active, archive, setTheme, number } = useThemes()
const root = document.documentElement

/* ---------- Préférences ---------- */
// Le tirage clair est la signature de cette forme : c'est le réglage par défaut.
const dark = ref(readPref('pl:dark', '0') === '1')
const calque = ref(readPref('pl:calque', '0') === '1')

watch(
  dark,
  (value) => {
    root.classList.toggle('dark', value)
    writePref('pl:dark', value ? '1' : '0')
  },
  { immediate: true },
)
watch(calque, (value) => writePref('pl:calque', value ? '1' : '0'))

/* ---------- Notifications ---------- */
const toast = reactive({ msg: '', show: false })
let toastTimer = 0
function showToast(msg) {
  toast.msg = msg
  toast.show = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.show = false), 2600)
}

// Les planches du laboratoire ont besoin des notifications et du tirage courant
// (l'empreinte spectrale est redessinée quand on passe au cyanotype).
provide('planche', { showToast, dark })

/* ---------- Sections ---------- */
// Cette forme n'a pas d'arène : #/arene mène au laboratoire plutôt qu'à une page vide.
const view = computed(
  () => ({ projects: 'systems', lab: 'lab', arena: 'lab', about: 'about' })[route.name] ?? 'index',
)
const labModule = computed(() =>
  LAB_MODULES.some((m) => m.id === route.params.module) ? route.params.module : 'weibull',
)
const lastLab = ref(labModule.value)
watch(labModule, (m) => (lastLab.value = m))

const TABS = computed(() => [
  { view: 'index', code: '§01', label: 'Index', to: { name: 'home' } },
  { view: 'systems', code: '§02', label: 'Nomenclature', to: { name: 'projects' } },
  { view: 'lab', code: '§03', label: 'Laboratoire', to: { name: 'lab', params: { module: lastLab.value } } },
  { view: 'about', code: '§04', label: 'Notice', to: { name: 'about' } },
])

const folio = computed(() => {
  const i = TABS.value.findIndex((t) => t.view === view.value)
  return `${String(Math.max(i, 0) + 1).padStart(2, '0')}/${String(TABS.value.length).padStart(2, '0')}`
})

const top = ref(null)
watch(view, () => {
  const el = top.value
  if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
})

/* ---------- Articles ---------- */
const filter = ref('all')
const query = ref('')
const selected = computed(
  () => (route.name === 'article' ? articles.find((a) => a.slug === route.params.slug) : null) ?? articles[0] ?? null,
)

function selectArticle(slug) {
  router.push({ name: 'article', params: { slug } })
}
function openLab(module) {
  router.push({ name: 'lab', params: { module } })
}
async function copyBibtex() {
  if (!selected.value) return
  showToast((await copyText(selected.value.bibtex)) ? 'Citation BibTeX copiée' : 'La copie a échoué')
}

/** Une cote cliquée filtre l'index sur son domaine */
function readCote(h) {
  filter.value = h.category
  query.value = ''
  if (view.value !== 'index') router.push({ name: 'home' })
  showToast(`Index filtré : ${h.label}`)
}

const utc = useUtcClock(' UTC')
const others = computed(() => themes.filter((t) => t.id !== active.value.id))
const revision = computed(() => String.fromCharCode(65 + Math.min(themes.length - 1, 25)))

onMounted(() => {
  document.title = 'Ousmane Ba — AI Research, Cyber-Physical Systems & Security'
})

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer)
  root.classList.remove('dark')
})
</script>

<template>
  <div
    class="theme-planche relative flex min-h-screen flex-col bg-pl-paper font-plex text-pl-ink antialiased"
    :class="calque ? 'pl-calque' : ''"
  >
    <!-- Papier millimétré -->
    <div class="pl-paper-grid" aria-hidden="true" />

    <!-- Repères de coupe -->
    <span class="pl-crop left-3 top-3 border-l-2 border-t-2" aria-hidden="true" />
    <span class="pl-crop right-3 top-3 border-r-2 border-t-2" aria-hidden="true" />
    <span class="pl-crop bottom-3 left-3 border-b-2 border-l-2" aria-hidden="true" />
    <span class="pl-crop bottom-3 right-3 border-b-2 border-r-2" aria-hidden="true" />

    <!-- Film du calque -->
    <div v-if="calque" class="pl-calque-film" aria-hidden="true" />

    <!-- Notification -->
    <div
      role="status"
      aria-live="polite"
      class="pointer-events-none fixed bottom-5 right-5 z-[70] border-2 border-pl-rule bg-pl-paper px-3 py-2 font-plexmono text-xs text-pl-ink shadow-lg transition-all duration-300"
      :class="toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'"
    >
      {{ toast.msg }}
    </div>

    <!-- Réglette -->
    <div class="sticky top-0 z-50 border-b-2 border-pl-rule bg-pl-paper/95 backdrop-blur">
      <div class="pl-wrap flex min-h-[2.6rem] flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5">
        <div class="pl-meta flex min-w-0 items-center gap-3">
          <span class="shrink-0">Planche {{ folio }}</span>
          <span class="hidden shrink-0 sm:inline">Indice {{ revision }}</span>
          <span class="hidden shrink-0 tabular-nums md:inline">{{ utc }}</span>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="pl-btn"
            :class="calque ? 'pl-btn-on' : ''"
            :aria-pressed="calque"
            title="Rabattre le calque de relevé : affiche les annotations de construction"
            @click="calque = !calque"
          >
            Calque
          </button>
          <button
            type="button"
            class="pl-btn"
            :aria-label="dark ? 'Passer au tirage papier' : 'Passer au cyanotype'"
            :title="dark ? 'Tirage papier' : 'Cyanotype (bleu de plan)'"
            @click="dark = !dark"
          >
            {{ dark ? 'Papier' : 'Cyanotype' }}
          </button>
        </div>
      </div>
    </div>

    <div class="pl-wrap flex-1 pb-12 pt-8">
      <!-- Cartouche -->
      <header class="border-2 border-pl-rule bg-pl-paper/80">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_15rem]">
          <div class="p-5 sm:p-7">
            <div class="pl-meta">{{ profile.focus }}</div>
            <h1 class="pl-display mt-3 text-pl-ink">{{ profile.name }}</h1>
            <p class="pl-lede mt-4">{{ profile.tagline.fr }}</p>

            <div class="mt-5 flex flex-wrap gap-1.5">
              <a :href="profile.links.github" target="_blank" rel="noopener noreferrer" class="pl-btn">GitHub ↗</a>
              <a :href="profile.links.linkedin" target="_blank" rel="noopener noreferrer" class="pl-btn">LinkedIn ↗</a>
              <a :href="`mailto:${profile.links.email}`" class="pl-btn">Contact</a>
            </div>
          </div>

          <!-- Colonne d'identification -->
          <div class="border-t-2 border-pl-rule lg:border-l-2 lg:border-t-0">
            <div class="pl-cell">
              <span class="pl-cell-label">Planche</span>
              <span class="pl-cell-value">{{ folio }}</span>
            </div>
            <div class="pl-cell">
              <span class="pl-cell-label">Échelle</span>
              <span class="pl-cell-value">1:1</span>
            </div>
            <div class="pl-cell">
              <span class="pl-cell-label">Date</span>
              <span class="pl-cell-value">{{ dotDate(articles[0]?.date ?? '2026-11') }}</span>
            </div>
            <div class="pl-cell">
              <span class="pl-cell-label">Pièces</span>
              <span class="pl-cell-value">{{ articles.length }} monographies</span>
            </div>
            <div class="pl-cell">
              <span class="pl-cell-label">Lieu</span>
              <span class="pl-cell-value">{{ profile.city }}</span>
            </div>
          </div>
        </div>

        <!-- Cotes relevées -->
        <div class="grid grid-cols-2 border-t-2 border-pl-rule sm:grid-cols-4">
          <button
            v-for="(h, i) in profile.highlights"
            :key="h.label"
            type="button"
            class="border-pl-rule/35 px-4 py-3 text-left transition-colors hover:bg-pl-surface"
            :class="[i < profile.highlights.length - 1 ? 'border-r' : '', i < 2 ? 'border-b sm:border-b-0' : '']"
            :title="`Filtrer l'index : ${h.label}`"
            @click="readCote(h)"
          >
            <span class="pl-meta block">{{ h.label }}</span>
            <span class="mt-1 block font-plexmono text-base font-semibold text-pl-ink sm:text-lg">{{ h.value }}</span>
            <span class="pl-meta mt-0.5 block normal-case tracking-normal text-pl-blue">{{ h.note }}</span>
          </button>
        </div>
      </header>

      <!-- Onglets -->
      <nav class="mt-8 flex flex-wrap gap-1 border-b-2 border-pl-rule" aria-label="Sections de la planche">
        <RouterLink
          v-for="t in TABS"
          :key="t.view"
          :to="t.to"
          class="pl-tab"
          :class="view === t.view ? 'pl-tab-on' : ''"
          :aria-current="view === t.view ? 'page' : undefined"
        >
          <span class="tabular-nums opacity-70">{{ t.code }}</span>
          <span>{{ t.label }}</span>
        </RouterLink>
      </nav>

      <div ref="top" class="scroll-mt-14" />

      <div class="mt-8">
        <ArticlesView
          v-show="view === 'index'"
          v-model:filter="filter"
          v-model:query="query"
          :selected="selected"
          @select="selectArticle"
          @copy-bibtex="copyBibtex"
          @open-lab="openLab"
        />
        <SystemsView v-if="view === 'systems'" />
        <LabView v-if="view === 'lab'" :module="labModule" />
        <AboutView v-if="view === 'about'" />
      </div>
    </div>

    <!-- Cartouche de pied -->
    <footer class="relative z-[1] border-t-2 border-pl-rule">
      <div class="pl-wrap grid grid-cols-1 gap-x-8 gap-y-3 py-5 sm:grid-cols-3">
        <div>
          <span class="pl-cell-label">Dossier</span>
          <span class="pl-cell-value">{{ profile.name }} — recherche &amp; ingénierie</span>
        </div>
        <div>
          <span class="pl-cell-label">Implantation</span>
          <span class="pl-cell-value">{{ profile.city }}, {{ profile.country }}</span>
        </div>
        <div v-if="archive">
          <span class="pl-cell-label">Forme {{ number(active) }}/{{ themes.length }} — {{ active.name }}</span>
          <span class="mt-1 flex flex-wrap gap-1.5">
            <button v-for="t in others" :key="t.id" type="button" class="pl-btn" :title="t.summary" @click="setTheme(t.id)">
              {{ number(t) }}. {{ t.name }}
            </button>
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>
