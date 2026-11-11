// Les formes favorites restent fréquentes sans exclure les autres formes du registre.
const FAVORITES = new Set(['leontechlab', 'evolution', 'monographie'])

export function pickWeightedTheme(themes, random = Math.random) {
  if (!themes.length) return null
  const weight = (theme) => FAVORITES.has(theme.id) ? 5 : 1
  let ticket = random() * themes.reduce((sum, theme) => sum + weight(theme), 0)
  for (const theme of themes) {
    ticket -= weight(theme)
    if (ticket < 0) return theme
  }
  return themes[themes.length - 1]
}
