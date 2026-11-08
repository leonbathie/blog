/**
 * Radar orbital d'arrière-plan : cercles de portée, faisceau tournant et échos.
 *
 * Écarts assumés avec la maquette d'origine :
 *  - le canevas suit le redimensionnement de la fenêtre et la densité de pixels ;
 *  - éteindre puis rallumer le radar relance le balayage (la maquette sortait
 *    définitivement de la boucle d'animation et ne réaffichait qu'une image figée) ;
 *  - le balayage s'arrête si le visiteur demande moins d'animations.
 */

const ORANGE = '249, 115, 22'
const ECHO_COUNT = 25

export function createRadar(canvas) {
  const ctx = canvas.getContext('2d')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  let frame = 0
  let angle = 0
  let running = false
  let width = 0
  let height = 0
  /** Échos en coordonnées relatives : ils restent en place après un redimensionnement. */
  const echoes = Array.from({ length: ECHO_COUNT }, () => ({ u: Math.random(), v: Math.random() }))

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    width = canvas.clientWidth || window.innerWidth
    height = canvas.clientHeight || window.innerHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }

  function paint() {
    ctx.clearRect(0, 0, width, height)
    const cx = width / 2
    const cy = height / 2

    // Cercles de portée
    ctx.strokeStyle = `rgba(${ORANGE}, 0.1)`
    ctx.lineWidth = 1
    for (let r = 100; r < Math.max(cx, cy); r += 150) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Faisceau
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    const beam = ctx.createLinearGradient(0, 0, 400, 0)
    beam.addColorStop(0, `rgba(${ORANGE}, 0.35)`)
    beam.addColorStop(1, `rgba(${ORANGE}, 0)`)
    ctx.fillStyle = beam
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, Math.max(width, height), 0, 0.3)
    ctx.lineTo(0, 0)
    ctx.fill()
    ctx.restore()

    // Échos
    ctx.fillStyle = `rgba(${ORANGE}, 0.6)`
    for (const e of echoes) ctx.fillRect(e.u * width, e.v * height, 2, 2)
  }

  function loop() {
    if (!running) return
    angle += 0.015
    paint()
    frame = window.requestAnimationFrame(loop)
  }

  function onResize() {
    resize()
    if (!running) paint()
  }

  function start() {
    if (running) return
    resize()
    if (reduced.matches) {
      // Mouvement réduit : une image fixe, sans boucle d'animation
      paint()
      return
    }
    running = true
    loop()
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
