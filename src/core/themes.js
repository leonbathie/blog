import { computed, ref } from 'vue'
import config from '../site.config.js'
import { themes } from '../themes/index.js'

/**
 * Forme active du blog.
 * Priorité : lien partagé ?forme=<id|numéro>  >  choix du visiteur pendant sa visite  >  site.config.js
 */

const STORAGE_KEY = 'blog:forme'
const latest = themes[themes.length - 1]
const defaultTheme = config.theme === 'latest' ? latest : (themes.find((t) => t.id === config.theme) ?? latest)
const archive = Boolean(config.themeArchive) && themes.length > 1

function find(idOrNumber) {
  if (idOrNumber === null || idOrNumber === undefined || idOrNumber === '') return null
  const key = String(idOrNumber).trim().toLowerCase()
  const n = Number(key)
  if (Number.isInteger(n) && n >= 1 && n <= themes.length) return themes[n - 1]
  return themes.find((t) => t.id === key) ?? null
}

function readUrlParam() {
  const params = new URLSearchParams(window.location.search)
  const hashQuery = window.location.hash.split('?')[1]
  if (hashQuery) new URLSearchParams(hashQuery).forEach((value, key) => params.set(key, value))
  return params.get('forme')
}

function readSession() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeSession(id) {
  try {
    if (id) window.sessionStorage.setItem(STORAGE_KEY, id)
    else window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* stockage indisponible (navigation privée…) : le choix ne durera que le temps de la page */
  }
}

function initialTheme() {
  if (!archive) return defaultTheme
  const fromUrl = find(readUrlParam())
  if (fromUrl) {
    writeSession(fromUrl.id === defaultTheme.id ? null : fromUrl.id)
    return fromUrl
  }
  return find(readSession()) ?? defaultTheme
}

const activeId = ref(initialTheme().id)
const active = computed(() => find(activeId.value) ?? defaultTheme)

function setTheme(idOrNumber) {
  const theme = find(idOrNumber)
  if (!theme || !archive) return false
  activeId.value = theme.id
  writeSession(theme.id === defaultTheme.id ? null : theme.id)
  window.scrollTo({ top: 0 })
  return true
}

const number = (theme) => themes.indexOf(theme) + 1

export function useThemes() {
  return { themes, active, defaultTheme, archive, setTheme, number }
}
