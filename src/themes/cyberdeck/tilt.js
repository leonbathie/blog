/**
 * Directive v-tilt : carte qui s'incline en 3D sous la souris, avec halo lumineux qui suit le curseur.
 * Désactivée sur écran tactile et quand le visiteur demande moins d'animations.
 */
const RESET = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'

export const vTilt = {
  mounted(el) {
    const noHover = window.matchMedia('(hover: none)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (noHover || reduced) return

    const move = (event) => {
      const rect = el.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6
      el.style.setProperty('--mouse-x', `${x}px`)
      el.style.setProperty('--mouse-y', `${y}px`)
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`
    }
    const leave = () => {
      el.style.transform = RESET
    }

    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    el.__tilt = { move, leave }
  },
  unmounted(el) {
    if (!el.__tilt) return
    el.removeEventListener('mousemove', el.__tilt.move)
    el.removeEventListener('mouseleave', el.__tilt.leave)
    delete el.__tilt
  },
}
