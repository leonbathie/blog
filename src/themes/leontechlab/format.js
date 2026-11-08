/** Dates de la console, en français ou en anglais */

const DAYS = {
  fr: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
const MONTHS = {
  fr: ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

const pad = (n) => String(n).padStart(2, '0')
const pick = (table, lang) => table[lang] ?? table.fr

/** "2026-10" → « Oct. 2026 » / "Oct 2026" */
export function moisCourt(date = '', lang = 'fr') {
  const [year, month] = String(date).split('-')
  const m = Number(month)
  return m >= 1 && m <= 12 ? `${pick(MONTHS, lang)[m - 1]} ${year}` : year
}

/** Date de la barre d'état : « Dim. 08 Nov. 2026 » / "Sun Nov 08 2026", comme un terminal */
export function dateHorloge(d, lang = 'fr') {
  const day = pick(DAYS, lang)[d.getDay()]
  const month = pick(MONTHS, lang)[d.getMonth()]
  return lang === 'en'
    ? `${day} ${month} ${pad(d.getDate())} ${d.getFullYear()}`
    : `${day} ${pad(d.getDate())} ${month} ${d.getFullYear()}`
}

/** Heure de la barre d'état : « 14:37:26 » */
export const heureHorloge = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
