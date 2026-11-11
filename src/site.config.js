/**
 * Réglages du blog.
 */
export default {
  /**
   * Forme affichée.
   *
   *   'rotate'  la forme suivante à CHAQUE chargement de page (rafraîchir = forme suivante).
   *             Avec deux formes, cela revient à alterner.
   *   'random'  une forme au hasard à chaque chargement, jamais deux fois la même d'affilée.
   *             Monographie, Portail rétro et Évolution sont privilégiées. ← réglage actuel
   *   'latest'  toujours la dernière forme du registre src/themes/index.js
   *             (la forme ne change alors qu'en ajoutant une nouvelle forme).
   *   '<id>'    toujours cette forme, par exemple 'monographie' ou 'cyberdeck'.
   *
   * Un lien ?forme=<id> affiche toujours exactement la forme demandée,
   * quel que soit le mode : les liens partagés restent fidèles.
   */
  theme: 'random',

  /**
   * Autoriser les visiteurs à changer de forme eux-mêmes
   * (sélecteur « Formes » dans chaque forme + liens partageables ?forme=<id>).
   * false désactive aussi la rotation : le blog s'en tient alors à `theme`.
   */
  themeArchive: true,
}
