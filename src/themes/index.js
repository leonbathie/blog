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
  {
    id: 'planche',
    name: 'Planche technique',
    date: '2026-11',
    summary: "Planche de bureau d'études : papier millimétré, cartouche et cotes, tirage papier ou cyanotype.",
    fonts:
      'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap',
    integratedSwitcher: true,
    load: () => import('./planche/Theme.vue'),
  },
  {
    id: 'mission',
    name: 'Mission Control',
    date: '2026-11',
    summary: 'Poste de contrôle de vol : radar orbital, télémétrie, essaim MCP et terminal de mission.',
    fonts:
      'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Share+Tech+Mono&family=Space+Grotesk:wght@400;500;700&display=swap',
    integratedSwitcher: true,
    load: () => import('./mission/Theme.vue'),
  },
  {
    id: 'crt',
    name: 'CRT',
    date: '2026-11',
    summary: 'Tube cathodique : phosphore cyan, lignes de balayage, pluie de caractères et terminal de mission.',
    fonts:
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@400;600;800&family=Share+Tech+Mono&display=swap',
    integratedSwitcher: true,
    load: () => import('./crt/Theme.vue'),
  },
]
