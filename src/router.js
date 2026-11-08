import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * Les URL sont communes à toutes les formes : un lien vers un article ou un simulateur
 * reste valable quand le blog change de forme. Chaque forme lit `route.name` / `route.params`
 * et décide elle-même comment afficher la section (aucun composant n'est monté par le routeur).
 *
 * Historique « hash » (#/recherche/...) : fonctionne sur n'importe quel serveur statique,
 * sans règle de réécriture côté Nginx.
 */
const Section = { name: 'Section', render: () => null }

export const routes = [
  { path: '/', name: 'home', component: Section },
  { path: '/recherche', name: 'articles', component: Section },
  { path: '/recherche/:slug', name: 'article', component: Section },
  { path: '/projets', name: 'projects', component: Section },
  { path: '/labo/:module?', name: 'lab', component: Section },
  { path: '/parcours', name: 'about', component: Section },
  { path: '/arene', name: 'arena', component: Section },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
