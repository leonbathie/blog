/** Dates en français court, façon barre d'état DOS : « Dim. 08 Nov. 2026 » */

const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']
const MOIS = ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

const pad = (n) => String(n).padStart(2, '0')

/** "2026-10" → "Oct. 2026" */
export function moisCourt(date = '') {
  const [year, month] = String(date).split('-')
  const m = Number(month)
  return m >= 1 && m <= 12 ? `${MOIS[m - 1]} ${year}` : year
}

/** Date d'horloge : « Dim. 08 Nov. 2026 » */
export const dateHorloge = (d) => `${JOURS[d.getDay()]} ${pad(d.getDate())} ${MOIS[d.getMonth()]} ${d.getFullYear()}`

/** Heure d'horloge : « 14:37:26 » */
export const heureHorloge = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
