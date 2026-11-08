<script setup>
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemes } from '../core/themes.js'
import ThemeLoading from './ThemeLoading.vue'
import ThemeError from './ThemeError.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'

/**
 * Monte la forme active. Chaque forme est un bundle séparé, chargé seulement quand on l'affiche.
 */
const { active, archive } = useThemes()
const route = useRoute()
const router = useRouter()

const components = new Map()
const current = computed(() => {
  const theme = active.value
  if (!components.has(theme.id)) {
    components.set(
      theme.id,
      defineAsyncComponent({
        loader: theme.load,
        loadingComponent: ThemeLoading,
        errorComponent: ThemeError,
        delay: 150,
        timeout: 30000,
      }),
    )
  }
  return components.get(theme.id)
})

// Attribut data-theme sur <html> (le CSS global de chaque forme s'y accroche) + polices de la forme
watch(
  active,
  (theme) => {
    document.documentElement.dataset.theme = theme.id
    let link = document.getElementById('theme-fonts')
    if (!theme.fonts) {
      link?.remove()
      return
    }
    if (!link) {
      link = document.createElement('link')
      link.id = 'theme-fonts'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    if (link.href !== theme.fonts) link.href = theme.fonts
  },
  { immediate: true },
)

/*
 * Le paramètre ?forme=… a été lu au démarrage (core/themes.js) : on le retire de l'adresse
 * pour ne pas figer la forme dans les liens que le visiteur copie ensuite.
 * Deux emplacements possibles, car l'historique est en mode « hash » :
 *   /?forme=x#/recherche   → location.search, invisible pour vue-router
 *   /#/recherche?forme=x   → route.query
 */
onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  if (!params.has('forme')) return
  params.delete('forme')
  const search = params.toString()
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`,
  )
})

watch(
  () => route.query.forme,
  (value) => {
    if (value === undefined) return
    const query = { ...route.query }
    delete query.forme
    router.replace({ query })
  },
  { immediate: true },
)
</script>

<template>
  <component :is="current" :key="active.id" />
  <ThemeSwitcher v-if="archive && !active.integratedSwitcher" />
</template>
