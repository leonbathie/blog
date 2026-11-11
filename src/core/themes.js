import { computed, ref } from 'vue'
import config from '../site.config.js'
import { themes } from '../themes/index.js'
import { pickWeightedTheme } from './weightedTheme.js'

/**
 * Forme active du blog.
 *
 * Priorité :
 *   1. lien partagé ?forme=<id|numéro>  (gagne toujours, pour que les liens restent fidèles)
 *   2. choix du visiteur pendant sa visite  (modes 'latest' / id fixe uniquement)
 *   3. le mode défini dans site.config.js :
 *        'rotate' → la forme suivante à chaque chargement de page
 *        'random' → une forme au hasard, jamais deux fois la même d'affilée
 *        'latest' → toujours la dernière forme du registre
 *        '<id>'   → toujours cette forme
 */

const SESSION_KEY = 'blog:forme'   // choix explicite du visiteur (durée de l'onglet)
const SHOWN_KEY = 'blog:forme-vue' // dernière forme affichée (pour faire avancer la rotation)

const latest = themes[themes.length - 1]
const ROTATING_MODES = ['rotate', 'random']
const mode = ['latest', ...ROTATING_MODES].includes(config.theme) ? config.theme : 'fixed'
const rotating = ROTATING_MODES.includes(mode)
const archive = Boolean(config.themeArchive) && themes.length > 1

/** En mode 'fixed', la forme nommée dans la config ; sinon la dernière. */
const configured = mode === 'fixed' ? (themes.find((t) => t.id === config.theme) ?? latest) : latest

function find(idOrNumber) {
  if (idOrNumber === null || idOrNumber === undefined || idOrNumber === '') return null
  const key = String(idOrNumber).trim().toLowerCase()
  const n = Number(key)
  if (Number.isInteger(n) && n >= 1 && n <= themes.length) return themes[n - 1]
  return themes.find((t) => t.id === key) ?? null
}

/* ---------- Stockage, tolérant à un stockage bloqué (navigation privée…) ---------- */
function read(store, key) {
  try {
    return window[store].getItem(key)
  } catch {
    return null
  }
}
function write(store, key, value) {
  try {
    if (value) window[store].setItem(key, value)
    else window[store].removeItem(key)
  } catch {
    /* sans stockage : la rotation repart de la première forme à chaque fois */
  }
}

function readUrlParam() {
  const params = new URLSearchParams(window.location.search)
  const hashQuery = window.location.hash.split('?')[1]
  if (hashQuery) new URLSearchParams(hashQuery).forEach((value, key) => params.set(key, value))
  return params.get('forme')
}

/** Forme imposée par le mode, en s'appuyant sur la dernière forme affichée. */
function pickByMode() {
  if (!rotating || themes.length < 2) return configured

  const previous = read('localStorage', SHOWN_KEY)

  if (mode === 'random') {
    // On exclut la précédente : sur deux formes, cela revient à alterner,
    // et au-delà cela évite de retomber sur la même en rafraîchissant.
    const pool = themes.filter((t) => t.id !== previous)
    return pickWeightedTheme(pool) ?? themes[0]
  }

  // 'rotate' : la suivante dans l'ordre du registre
  const index = themes.findIndex((t) => t.id === previous)
  return themes[(index + 1) % themes.length]
}

function initialTheme() {
  if (!archive) return configured

  // Un lien ?forme=… doit afficher exactement cette forme.
  const fromUrl = find(readUrlParam())
  if (fromUrl) return fromUrl

  // En rotation, un choix mémorisé empêcherait le changement au rafraîchissement :
  // on ne le restaure donc que dans les modes figés.
  if (!rotating) {
    const pinned = find(read('sessionStorage', SESSION_KEY))
    if (pinned) return pinned
  }

  return pickByMode()
}

const first = initialTheme()
const activeId = ref(first.id)
const active = computed(() => find(activeId.value) ?? configured)

// Mémorise la forme affichée pour que le prochain chargement enchaîne sur la suivante.
write('localStorage', SHOWN_KEY, first.id)

function setTheme(idOrNumber) {
  const theme = find(idOrNumber)
  if (!theme || !archive) return false
  activeId.value = theme.id
  write('localStorage', SHOWN_KEY, theme.id)
  // En rotation, le choix ne survit pas au rafraîchissement : c'est ce qui permet
  // à la forme de changer à chaque chargement.
  if (!rotating) write('sessionStorage', SESSION_KEY, theme.id === configured.id ? null : theme.id)
  window.scrollTo({ top: 0 })
  return true
}

const number = (theme) => themes.indexOf(theme) + 1

export function useThemes() {
  return { themes, active, defaultTheme: configured, archive, rotating, mode, setTheme, number }
}
