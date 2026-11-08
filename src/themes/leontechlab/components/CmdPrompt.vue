<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useThemes } from '../../../core/themes.js'
import { t, themeLabel, useLeon } from '../i18n.js'
import { moisCourt } from '../format.js'

/**
 * Invite de commande de la console : C:\LEONTECHLAB> help, dir, open 3, lang en…
 * Chaque commande accepte son nom anglais et son nom français.
 * Sur téléphone, la fenêtre s'ouvre en haut de l'écran pour rester au-dessus du clavier.
 */
const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const router = useRouter()
const leon = inject('leon')
const { themes, active, setTheme, number } = useThemes()
const { lang, setLang, content } = useLeon()

const PROMPT = 'C:\\LEONTECHLAB>'
const lines = ref([]) // { text, tone : in | out | ok | err | dim }
const input = ref('')
const field = ref(null)
const screen = ref(null)
const history = []
let recall = -1

const PAGES = {
  home: { to: { name: 'home' }, alias: ['home', 'accueil', '~', '\\', '/', '..'] },
  articles: { to: { name: 'articles' }, alias: ['articles', 'blog', 'archives'] },
  projects: { to: { name: 'projects' }, alias: ['projects', 'projets', 'repos', 'depots', 'dépôts'] },
  research: { to: { name: 'lab', params: { module: 'glitch' } }, alias: ['lab', 'labo', 'research', 'recherche', 'cyberlab'] },
  about: { to: { name: 'about' }, alias: ['about', 'apropos', 'propos', 'parcours', 'cv'] },
  contact: { to: { name: 'about', hash: '#contact' }, alias: ['contact', 'mail', 'email', 'courriel'] },
}
const COMMANDS = {
  help: ['help', 'aide', '?', 'h'],
  dir: ['dir', 'ls', 'list', 'liste'],
  open: ['open', 'ouvrir', 'type', 'cat', 'read', 'lire'],
  search: ['search', 'find', 'cherche', 'chercher', 'grep'],
  cd: ['cd', 'go', 'aller'],
  lang: ['lang', 'langue', 'language'],
  theme: ['theme', 'forme', 'form'],
  whoami: ['whoami', 'qui'],
  date: ['date', 'time', 'heure'],
  launch: ['launch', 'decollage', 'décollage', 'liftoff', 'fire'],
  github: ['github', 'gh'],
  random: ['random', 'hasard'],
  history: ['history', 'historique'],
  cls: ['cls', 'clear', 'effacer'],
  exit: ['exit', 'quit', 'quitter', 'close'],
  ver: ['ver', 'version'],
  echo: ['echo'],
}
const commandOf = (word) => Object.keys(COMMANDS).find((key) => COMMANDS[key].includes(word))
const pageOf = (word) => Object.entries(PAGES).find(([, page]) => page.alias.includes(word))
const NAMES = [...Object.values(COMMANDS).map((list) => list[0]), ...Object.values(PAGES).map((page) => page.alias[0])]

const chips = computed(() => ['help', 'dir', 'projects', lang.value === 'fr' ? 'lang en' : 'lang fr', 'launch', 'cls'])

const print = (text, tone = 'out') => lines.value.push({ text, tone })
function banner() {
  const p = content.value.profile
  print(t('cmd.banner'), 'ok')
  print(t('cmd.rights', { name: p.name, handle: p.handle }), 'dim')
  print('')
  print(t('cmd.hint'))
}

const articles = () => content.value.articles
const short = (text, max = 52) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)
function findArticle(arg) {
  const n = Number(arg)
  if (Number.isInteger(n) && n >= 1 && n <= articles().length) return articles()[n - 1]
  return articles().find((a) => a.slug === arg) ?? null
}
function go(key, to) {
  print(t('cmd.cdDone', { x: t(`nav.${key}`) }), 'ok')
  router.push(to)
  emit('close')
}

function run(raw) {
  const line = raw.trim()
  print(`${PROMPT}${line}`, 'in')
  if (!line) return
  history.push(line)
  recall = -1
  const [first, ...rest] = line.split(/\s+/)
  const word = first.toLowerCase()
  const arg = rest.join(' ')
  const cmd = commandOf(word)
  const page = cmd ? null : pageOf(word)
  if (page) return go(page[0], page[1].to)

  switch (cmd) {
    case 'help':
      print(t('cmd.helpTitle'), 'ok')
      for (const [name, what] of t('cmd.helpRows')) print(`  ${name.padEnd(16)} ${what}`)
      break
    case 'dir':
      print(t('cmd.dirHeader'), 'dim')
      print('')
      articles().forEach((a, i) => print(` ${String(i + 1).padStart(2)}  ${moisCourt(a.date, lang.value).padEnd(10)} ${short(a.title)}`))
      print(`${' '.repeat(16)}${t('cmd.dirFooter', { n: articles().length })}`, 'dim')
      break
    case 'open': {
      if (!arg) return print(t('cmd.openUsage'), 'err')
      const article = findArticle(arg)
      if (!article) return print(t('cmd.notFound', { x: arg }), 'err')
      print(t('cmd.opening', { x: article.title }), 'ok')
      router.push({ name: 'article', params: { slug: article.slug } })
      emit('close')
      break
    }
    case 'search': {
      if (!arg) return print(t('cmd.searchUsage'), 'err')
      const q = arg.toLowerCase()
      const hits = articles()
        .map((a, i) => [a, i + 1])
        .filter(([a]) => `${a.title} ${a.abstract} ${a.tag}`.toLowerCase().includes(q))
      if (!hits.length) return print(t('cmd.searchNone', { q: arg }), 'err')
      print(t('cmd.searchHits', { n: hits.length }), 'ok')
      for (const [a, n] of hits) print(` ${String(n).padStart(2)}  ${short(a.title)}`)
      break
    }
    case 'cd': {
      const target = pageOf(arg.toLowerCase())
      if (!target) return print(t('cmd.cdUsage'), arg ? 'err' : 'out')
      go(target[0], target[1].to)
      break
    }
    case 'lang':
      if (!setLang(arg)) return print(`${t('cmd.langUsage')}  [${lang.value}]`, arg ? 'err' : 'out')
      print(t('cmd.langDone'), 'ok')
      break
    case 'theme': {
      if (!arg) {
        print(t('cmd.themeTitle'), 'ok')
        for (const theme of themes) print(` ${number(theme)}. ${themeLabel(theme).name}${theme.id === active.value.id ? '  <' : ''}`)
        return print(t('cmd.themeUsage'), 'dim')
      }
      const theme = themes.find((th) => String(number(th)) === arg || th.id === arg.toLowerCase())
      if (!theme) return print(t('cmd.themeUsage'), 'err')
      print(t('cmd.themeDone', { x: themeLabel(theme).name }), 'ok')
      setTheme(theme.id)
      break
    }
    case 'whoami': {
      const p = content.value.profile
      print(t('cmd.whoami', { name: p.name, handle: p.handle, role: p.role, city: p.city }), 'ok')
      break
    }
    case 'date':
      print(new Date().toLocaleString(t('cmd.locale'), { dateStyle: 'full', timeStyle: 'medium' }))
      break
    case 'launch':
      if (leon.launch()) {
        print(t('cmd.launchDone'), 'ok')
        emit('close')
      } else print(t('cmd.launchNo'), 'err')
      break
    case 'github': {
      const url = content.value.profile.links.github
      print(t('cmd.githubDone', { x: url }), 'ok')
      window.open(url, '_blank', 'noopener')
      break
    }
    case 'random': {
      const list = articles()
      const article = list[Math.floor(Math.random() * list.length)]
      print(t('cmd.randomDone', { x: article.title }), 'ok')
      router.push({ name: 'article', params: { slug: article.slug } })
      emit('close')
      break
    }
    case 'history':
      if (history.length <= 1) return print(t('cmd.historyEmpty'), 'dim')
      history.slice(0, -1).forEach((h, i) => print(` ${String(i + 1).padStart(3)}  ${h}`))
      break
    case 'cls':
      lines.value = []
      break
    case 'exit':
      emit('close')
      break
    case 'ver':
      print(t('cmd.banner'), 'ok')
      break
    case 'echo':
      print(arg)
      break
    default:
      print(t('cmd.unknown', { cmd: first }), 'err')
  }
}

async function submit() {
  const value = input.value
  input.value = ''
  run(value)
  await nextTick()
  if (screen.value) screen.value.scrollTop = screen.value.scrollHeight
}
function runChip(value) {
  input.value = value
  submit()
  field.value?.focus({ preventScroll: true })
}

function onKey(event) {
  if (event.key === 'Escape') {
    event.stopPropagation() // la console se ferme ; la page, elle, ne bouge pas
    emit('close')
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (!history.length) return
    event.preventDefault()
    recall = event.key === 'ArrowUp' ? (recall < 0 ? history.length - 1 : Math.max(0, recall - 1)) : recall < 0 ? -1 : recall + 1
    if (recall >= history.length) recall = -1
    input.value = recall < 0 ? '' : history[recall]
  } else if (event.key === 'Tab') {
    // Complète le nom de commande ; plusieurs candidats : on les affiche
    const value = input.value.trimStart().toLowerCase()
    if (!value || value.includes(' ')) return
    event.preventDefault()
    const found = NAMES.filter((name) => name.startsWith(value))
    if (found.length === 1) input.value = `${found[0]} `
    else if (found.length > 1) {
      print(`${PROMPT}${input.value}`, 'in')
      print(found.join('  '), 'dim')
      nextTick(() => screen.value && (screen.value.scrollTop = screen.value.scrollHeight))
    }
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    if (!lines.value.length) banner()
    await nextTick()
    field.value?.focus({ preventScroll: true })
    if (screen.value) screen.value.scrollTop = screen.value.scrollHeight
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="open"
    class="leon-cmd fixed inset-x-1 top-1 z-[75] sm:inset-x-auto sm:bottom-3 sm:left-1/2 sm:top-auto sm:w-[min(52rem,calc(100vw-1.5rem))] sm:-translate-x-1/2"
    role="dialog"
    :aria-label="t('tools.cmd')"
  >
    <div class="leon-cmd-bar">
      <span class="min-w-0 truncate">{{ t('cmd.title') }}</span>
      <button type="button" class="leon-cmd-x" :aria-label="t('cmd.close')" @click="emit('close')">[X]</button>
    </div>
    <div ref="screen" class="leon-cmd-screen" @click="field?.focus({ preventScroll: true })">
      <p v-for="(l, i) in lines" :key="i" :class="`leon-cmd-${l.tone}`">{{ l.text || '\u00a0' }}</p>
      <form class="flex items-baseline" @submit.prevent="submit">
        <label for="leon-cmd-input" class="shrink-0 text-leon-ink">{{ PROMPT }}</label>
        <input
          id="leon-cmd-input"
          ref="field"
          v-model="input"
          type="text"
          class="leon-cmd-input"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          enterkeyhint="send"
          :aria-label="t('cmd.input')"
          @keydown="onKey"
        />
      </form>
    </div>
    <div class="leon-cmd-chips">
      <span class="text-leon-dim">{{ t('cmd.quick') }} :</span>
      <button v-for="c in chips" :key="c" type="button" class="leon-btn" @click="runChip(c)">{{ c }}</button>
    </div>
  </div>
</template>
