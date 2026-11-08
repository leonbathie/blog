import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Chemins relatifs : le site fonctionne à la racine d'un domaine comme dans un sous-dossier.
  base: './',
  plugins: [vue()],
  build: {
    // three.js (forme « Cyber-deck 3D ») est chargé à part, seulement quand cette forme est affichée.
    chunkSizeWarningLimit: 1000,
  },
})
