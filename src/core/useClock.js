import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Horloge UTC « HH:MM:SS » mise à jour chaque seconde. */
export function useUtcClock(suffix = ' UTC') {
  const time = ref(`00:00:00${suffix}`)
  let timer = null
  const tick = () => {
    time.value = new Date().toISOString().slice(11, 19) + suffix
  }
  onMounted(() => {
    tick()
    timer = window.setInterval(tick, 1000)
  })
  onBeforeUnmount(() => window.clearInterval(timer))
  return time
}
