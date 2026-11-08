/**
 * Petit synthétiseur Web Audio partagé par les formes.
 * Aucun son n'est joué avant la première interaction du visiteur (règle d'autoplay des navigateurs).
 */

let context = null

export function audioContext() {
  if (typeof window === 'undefined') return null
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!context) {
    try {
      context = new AudioCtx()
    } catch {
      return null
    }
  }
  if (context.state === 'suspended') context.resume().catch(() => {})
  return context
}

/**
 * Joue une note.
 * @param {object} o
 * @param {number} o.freq      fréquence de départ (Hz)
 * @param {number} [o.to]      fréquence d'arrivée (glissando)
 * @param {string} [o.type]    'sine' | 'square' | 'triangle' | 'sawtooth'
 * @param {number} [o.duration] durée (s)
 * @param {number} [o.gain]    volume maximal
 * @param {number} [o.at]      décalage de départ (s)
 * @param {number} [o.attack]  montée du volume (s) — 0 = attaque immédiate
 * @param {boolean} [o.linear] glissando linéaire plutôt qu'exponentiel
 */
export function tone({ freq = 640, to = null, type = 'sine', duration = 0.06, gain = 0.03, at = 0, attack = 0, linear = false } = {}) {
  const ac = audioContext()
  if (!ac) return
  try {
    const t0 = ac.currentTime + at
    const osc = ac.createOscillator()
    const amp = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (to) {
      if (linear) osc.frequency.linearRampToValueAtTime(to, t0 + duration)
      else osc.frequency.exponentialRampToValueAtTime(to, t0 + duration)
    }
    if (attack > 0) {
      amp.gain.setValueAtTime(0.0001, t0)
      amp.gain.exponentialRampToValueAtTime(gain, t0 + attack)
    } else {
      amp.gain.setValueAtTime(gain, t0)
    }
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(amp)
    amp.connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  } catch {
    /* audio indisponible : on reste silencieux */
  }
}
