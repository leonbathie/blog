<script setup>
import Shell from '../_terminal/Shell.vue'
import { CRT_SKIN } from './skin.js'
import './theme.css'

/*
 * Forme 5 — « CRT »
 * Peau du socle commun : phosphore cyan, lignes de balayage, pluie de caractères.
 * Toute la structure est dans src/themes/_terminal/, partagée avec « Mission Control ».
 */
</script>

<template>
  <Shell :skin="CRT_SKIN" />
</template>
