import { tone } from '../../core/audio.js'

/**
 * Bruitages 8-bit originaux de la forme « Monographie ».
 * @param {import('vue').Ref<boolean>} enabled
 */
export function createSfx(enabled) {
  const on = () => enabled.value
  return {
    /** Jeton récolté : deux notes brèves et claires */
    blip() {
      if (!on()) return
      tone({ freq: 1046.5, type: 'triangle', duration: 0.07, gain: 0.07 })
      tone({ freq: 1568, type: 'triangle', duration: 0.18, gain: 0.06, at: 0.06 })
    },
    /** Saut : glissando montant */
    jump() {
      if (!on()) return
      tone({ freq: 220, to: 740, type: 'triangle', duration: 0.18, gain: 0.08 })
    },
    /** Bonus : arpège majeur ascendant */
    fanfare() {
      if (!on()) return
      ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
        tone({ freq, type: 'square', duration: 0.1, gain: 0.045, at: i * 0.07 }),
      )
    },
    /** Changement de section : souffle descendant */
    whoosh() {
      if (!on()) return
      tone({ freq: 540, to: 260, type: 'sine', duration: 0.12, gain: 0.04 })
    },
  }
}
