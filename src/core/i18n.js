import { ref } from 'vue'

/**
 * Langue de l'interface : français ou anglais.
 *
 * Priorité :
 *   1. lien ?lang=fr|en           (un lien partagé garde sa langue)
 *   2. choix mémorisé du visiteur  (bouton FR | EN, commande `lang`)
 *   3. langue de l'appareil         (navigator.languages, dans l'ordre de préférence)
 * Un appareil réglé dans une autre langue reçoit l'anglais.
 */
export const LANGS = ['fr', 'en']
const KEY = 'blog:langue'

function normalize(value) {
  const base = String(value ?? '')
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0]
  return LANGS.includes(base) ? base : null
}

function fromUrl() {
  const params = new URLSearchParams(window.location.search)
  const hashQuery = window.location.hash.split('?')[1]
  if (hashQuery) new URLSearchParams(hashQuery).forEach((value, key) => params.set(key, value))
  return normalize(params.get('lang'))
}

function stored() {
  try {
    return normalize(window.localStorage.getItem(KEY))
  } catch {
    return null
  }
}

/** Première langue gérée dans les préférences de l'appareil, sinon l'anglais */
export function deviceLang() {
  const list = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const tag of list) {
    const value = normalize(tag)
    if (value) return value
  }
  return 'en'
}

export const lang = ref(fromUrl() ?? stored() ?? deviceLang())

export function setLang(value) {
  const next = normalize(value)
  if (!next) return false
  lang.value = next
  try {
    window.localStorage.setItem(KEY, next)
  } catch {
    /* stockage bloqué (navigation privée…) : le choix vaut pour la visite */
  }
  return true
}
