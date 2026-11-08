<script setup>
import Shell from '../_terminal/Shell.vue'
import { MISSION_SKIN } from './skin.js'
import './theme.css'

/*
 * Forme 4 — « Mission Control »
 * Peau du socle commun : accent orange, panneaux vitrés, radar d'arrière-plan.
 * Toute la structure est dans src/themes/_terminal/ et partagée avec la forme « CRT ».
 */
</script>

<template>
  <Shell :skin="MISSION_SKIN" />
</template>
