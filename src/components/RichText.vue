<script setup>
import { computed } from 'vue'
import { renderInline } from '../core/markdown.js'

/**
 * Texte court avec Markdown en ligne et formules :  <RichText text="Échelle $\eta$ (heures)" />
 */
const props = defineProps({
  text: { type: String, default: '' },
  tag: { type: String, default: 'span' },
})

const html = computed(() => renderInline(props.text))
</script>

<template>
  <component :is="tag" v-html="html" />
</template>
