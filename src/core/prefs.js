/** Préférences du visiteur (thème clair/sombre, son…) — sans erreur si le stockage est bloqué. */
export function readPref(key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : value
  } catch {
    return fallback
  }
}

export function writePref(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* stockage indisponible : la préférence ne sera pas mémorisée */
  }
}
