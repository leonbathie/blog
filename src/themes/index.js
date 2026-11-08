/**
 * Registre des « formes » du blog, de la plus ancienne à la plus récente.
 *
 * Avec theme: 'latest' (src/site.config.js), la DERNIÈRE forme de cette liste est celle du site :
 * à chaque mise à jour, on ajoute une nouvelle forme à la fin et le blog change d'apparence,
 * tout en gardant le même contenu (src/content/) et les mêmes adresses (#/recherche/..., #/labo/...).
 *
 * Champs :
 *   id                 identifiant (dossier src/themes/<id>/, lien ?forme=<id>)
 *   name / date / summary   présentation dans le sélecteur « Formes »
 *   fonts              feuille Google Fonts propre à la forme (chargée seulement pour elle)
 *   integratedSwitcher true si la forme affiche elle-même le sélecteur de formes
 *   load               chargement différé du composant racine de la forme
 */
export const themes = [
  {
    id: 'monographie',
    name: 'Monographie',
    date: '2026-11',
    summary: 'Carnet de recherche éditorial (papier / obsidienne), labo interactif et mini-jeu 8-bit.',
    fonts:
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Press+Start+2P&display=swap',
    integratedSwitcher: true,
    load: () => import('./monographie/Theme.vue'),
  },
  {
    id: 'cyberdeck',
    name: 'Cyber-deck 3D',
    date: '2026-11',
    summary: 'Poste de pilotage spatial : noyau WebGL Three.js, labo cyber et arène de drones.',
    fonts:
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,500;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;600;700&family=Syne:wght@600;700;800&display=swap',
    integratedSwitcher: true,
    load: () => import('./cyberdeck/Theme.vue'),
  },
]
