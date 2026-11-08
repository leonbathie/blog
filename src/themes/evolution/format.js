/** Dates courtes pour les pages d'époque */
const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
}
export const yearOf = (date = '') => String(date).split('-')[0]
export function dateOf(date = '', lang = 'fr') {
  const [year, month] = String(date).split('-')
  const m = Number(month)
  const names = MONTHS[lang] ?? MONTHS.fr
  if (!(m >= 1 && m <= 12)) return year
  return lang === 'en' ? `${names[m - 1]} ${year}` : `${names[m - 1]} ${year}`
}
