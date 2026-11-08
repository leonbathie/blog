/**
 * Réglages du blog.
 */
export default {
  /**
   * Forme affichée par défaut :
   *  - 'latest' : la dernière forme ajoutée dans src/themes/index.js (chaque mise à jour = nouvelle forme) ;
   *  - ou l'identifiant d'une forme précise, par exemple 'monographie' ou 'cyberdeck'.
   */
  theme: 'latest',

  /**
   * Autoriser les visiteurs à revoir les formes précédentes
   * (sélecteur « Formes » dans chaque forme + liens partageables ?forme=<id>).
   */
  themeArchive: true,
}
