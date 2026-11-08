<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { t, useLeon } from '../i18n.js'
import LabGlitch from './LabGlitch.vue'
import LabTokens from './LabTokens.vue'
import LabWeibull from './LabWeibull.vue'

/**
 * Laboratoire : les trois simulateurs empilés, avec des onglets pour passer
 * de l'un à l'autre. Les formules viennent de src/core/lab-math.js, partagé
 * avec les autres formes du blog.
 */
const props = defineProps({ module: { type: String, default: 'glitch' } })
const { lang } = useLeon()

const MODULES = ['glitch', 'pulaar', 'weibull']
const anchors = { glitch: ref(null), pulaar: ref(null), weibull: ref(null) }

async function focusModule(id) {
  await nextTick()
  anchors[id]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
watch(() => props.module, focusModule)
onMounted(() => {
  if (props.module && props.module !== 'glitch') focusModule(props.module)
})
</script>

<template>
  <div class="space-y-2">
    <section class="leon-panel">
      <h2 class="leon-panel-head leon-panel-head-wrap">{{ t('lab.title') }}</h2>
      <nav class="flex flex-wrap items-center gap-x-1 gap-y-0.5 px-2 pb-1.5 pt-0.5 text-[1.05rem]" :aria-label="t('lab.modulesLabel')">
        <span class="text-leon-dim">{{ t('lab.modules') }}</span>
        <RouterLink
          v-for="id in MODULES"
          :key="id"
          :to="{ name: 'lab', params: { module: id } }"
          class="leon-btn"
          :class="module === id ? 'leon-btn-on' : ''"
          :aria-current="module === id ? 'true' : undefined"
        >
          {{ t(`lab.tabs.${id}`) }}
        </RouterLink>
      </nav>
    </section>

    <div :ref="anchors.glitch" class="scroll-mt-14" lang="fr">
      <p v-if="lang === 'en'" class="px-1 pb-1 text-[1rem] text-leon-dim" lang="en">{{ t('lab.frOnly') }}</p>
      <LabGlitch />
    </div>
    <div :ref="anchors.pulaar" class="scroll-mt-14"><LabTokens /></div>
    <div :ref="anchors.weibull" class="scroll-mt-14"><LabWeibull /></div>
  </div>
</template>
