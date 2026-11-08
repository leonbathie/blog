/**
 * Pluie de caractères : colonnes de glyphes qui tombent, avec traînée.
 *
 * Écarts assumés avec la maquette d'origine :
 *  - boucle d'animation annulable (la maquette lançait un setInterval jamais
 *    arrêté, qui continuait à tourner même grille éteinte) ;
 *  - le canevas suit le redimensionnement et la densité de pixels ;
 *  - la traînée reprend la couleur de fond du thème au lieu d'être figée ;
 *  - rien ne bouge si le visiteur demande moins d'animations.
 */

const CHARS = '01ABCDEFΩΨΣΔ∮⟨⟩MCPQUANTUMAI'
const FONT_SIZE = 14
const STEP_MS = 30

export function createRain(canvas) {
  const ctx = canvas.getContext('2d')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  let frame = 0
  let running = false
  let width = 0
  let height = 0
  let drops = []
  let last = 0

  /** Couleurs lues sur le thème, pour que la traînée colle au fond réel */
  function palette() {
    const cs = getComputedStyle(document.documentElement)
    const triplet = (name, fallback) => {
      const v = cs.getPropertyValue(name).trim()
      return /^\d+\s+\d+\s+\d+$/.test(v) ? v.split(/\s+/).map(Number) : fallback
    }
    const [br, bg, bb] = triplet('--term-bg', [2, 4, 8])
    const [ar, ag, ab] = triplet('--term-accent', [0, 255, 204])
    return {
      trail: `rgba(${br}, ${bg}, ${bb}, 0.08)`,
      glyph: `rgb(${ar}, ${ag}, ${ab})`,
    }
  }
  let colors = palette()

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    width = canvas.clientWidth || window.innerWidth
    height = canvas.clientHeight || window.innerHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

    const columns = Math.max(1, Math.floor(width / FONT_SIZE))
    // On garde la position des colonnes existantes : pas de saut au redimensionnement
    drops = Array.from({ length: columns }, (_, i) => drops[i] ?? Math.random() * -40)
  }

  function paint() {
    ctx.fillStyle = colors.trail
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = colors.glyph
    ctx.font = `${FONT_SIZE}px ${getComputedStyle(document.documentElement).getPropertyValue('--term-font-mono') || 'monospace'}, monospace`

    for (let i = 0; i < drops.length; i++) {
      const glyph = CHARS.charAt(Math.floor(Math.random() * CHARS.length))
      ctx.fillText(glyph, i * FONT_SIZE, drops[i] * FONT_SIZE)
      if (drops[i] * FONT_SIZE > height && Math.random() > 0.975) drops[i] = 0
      drops[i] += 1
    }
  }

  function loop(now) {
    if (!running) return
    // Cadence fixe quel que soit le taux de rafraîchissement de l'écran
    if (now - last >= STEP_MS) {
      last = now
      paint()
    }
    frame = window.requestAnimationFrame(loop)
  }

  function onResize() {
    resize()
  }

  function start() {
    if (running) return
    colors = palette()
    resize()
    ctx.fillStyle = colors.glyph
    if (reduced.matches) {
      // Mouvement réduit : une seule passe, pas de boucle
      paint()
      return
    }
    running = true
    last = 0
    frame = window.requestAnimationFrame(loop)
  }

  function stop() {
    running = false
    window.cancelAnimationFrame(frame)
    ctx.clearRect(0, 0, width, height)
  }

  window.addEventListener('resize', onResize, { passive: true })

  return {
    start,
    stop,
    dispose() {
      stop()
      window.removeEventListener('resize', onResize)
    },
  }
}
