/**
 * Calculs des simulateurs du laboratoire — communs à TOUTES les formes.
 *
 * Chaque forme garde sa propre présentation (courbe, chronogramme, tableau, oscilloscope),
 * mais les formules, seuils et jeux d'essai vivent ici : une correction de physique
 * ou de linguistique se fait à un seul endroit et profite à toutes les formes.
 */

/* =====================================================================
   Module « weibull » — fiabilité industrielle (H&D Madar / IBS)
   ===================================================================== */

/** Survie à l'instant t : R(t) = exp(-(t/η)^β) */
export function survival(t, eta, beta) {
  return Math.exp(-Math.pow(t / eta, beta))
}

/** Disponibilité opérationnelle A = MTBF / (MTBF + MTTR), en pourcentage */
export function availability(eta, mttr) {
  return (eta / (eta + mttr)) * 100
}

/** Régime de défaillance lu sur le paramètre de forme β */
export function weibullRegime(beta) {
  if (beta < 0.95) return 'Jeunesse / Rodage'
  if (beta > 1.15) return 'Usure Mécanique'
  return 'Aléatoire (Constant)'
}

/** Préréglages issus des historiques GMAO */
export const WEIBULL_PRESETS = [
  { label: 'Usure Mécanique ($\\beta=2.2$)', eta: 95, mttr: 6.5, mission: 72, beta: 2.2 },
  { label: 'Plan Préventif IBS (-25% Arrêts)', eta: 190, mttr: 3.0, mission: 72, beta: 1.1, primary: true },
]

/* =====================================================================
   Module « pulaar » — tokenisation des langues atlantiques
   ===================================================================== */

/** Consonnes implosives et prénasalisées proposées à la saisie */
export const IMPLOSIVES = ['ɓ', 'ɗ', 'ƴ', 'ŋ', 'ñ']

/** Caractères qui font décrocher un BPE entraîné sur des corpus latins */
const FRAGMENTS_BPE = /[ɓɗƴŋñƁƊƳŊÑàé]/

/** Implosives pures : ce sont elles qui portent la transitoire glottale */
export const IMPLOSIVE_RE = /[ɓɗƴŋƁƊƳŊ]/

export const PULAAR_SAMPLES = [
  { label: 'Exemple Pulaar 1', text: 'Ko ɓuri teeŋtude e ɗemngal Pulaar ko ɓamtaare jaŋde.' },
  { label: 'Proverbe Pulaar', text: 'Ɓundu wooturu, ɓoggol gootol : ko dental woni doole.' },
  { label: 'Exemple Wolof', text: 'Kuulal ak jàmm ci réewum Senegaal, nu jàng ci sunu làkk.' },
]

/** Découpe un texte en mots */
export function splitWords(text) {
  return text.trim().split(/\s+/).filter(Boolean)
}

/**
 * BPE « standard » façon Whisper : sur-fragmente dès qu'un mot porte une implosive
 * ou dépasse 5 caractères — c'est le défaut que corrige le tokenizer morphologique.
 */
export function standardTokens(words) {
  const tokens = []
  for (const word of words) {
    if (FRAGMENTS_BPE.test(word) || word.length > 5) {
      for (let i = 0; i < word.length; i += 2) tokens.push(word.slice(i, i + 2))
    } else {
      tokens.push(word)
    }
  }
  return tokens
}

/** Tokenizer morphologique Pulaar-v3 (Taro) : conserve le radical, suffixe en `##` */
export function morphTokens(words) {
  const tokens = []
  for (const word of words) {
    if (word.length > 7) {
      const cut = Math.ceil(word.length * 0.6)
      tokens.push(word.slice(0, cut), `##${word.slice(cut)}`)
    } else {
      tokens.push(word)
    }
  }
  return tokens
}

/** Gain en nombre de tokens du tokenizer morphologique, en pourcentage */
export function compressionRate(standard, morphological) {
  const count = standard.length
  return count ? Math.max(0, Math.round(((count - morphological.length) / count) * 100)) : 0
}

/* =====================================================================
   Module « glitch » — injection de fautes Faulty Cat
   ===================================================================== */

/** Fenêtre de décodage de l'instruction `BNE secure_lock`, en nanosecondes */
export const BNE_WINDOW = { start: 175, end: 205 }

/** Réglage connu pour passer : la cible du bouton « calibrer » */
export const CALIBRATION = { offset: 190, width: 25, volt: 1.95 }

/**
 * Issue d'une impulsion.
 *   inWindow  l'impulsion tombe dans la fenêtre de décodage et sa largeur est exploitable
 *   brownout  le détecteur de sous-tension (BOD) a réinitialisé le microcontrôleur
 *   success   l'instruction a été sautée : bootloader déverrouillé
 */
export function glitchOutcome({ offset, width, volt }) {
  const inWindow = offset >= BNE_WINDOW.start && offset <= BNE_WINDOW.end && width >= 15 && width <= 40
  const brownout = volt > 2.35 || width > 60
  return { inWindow, brownout, success: inWindow && volt >= 1.75 && !brownout }
}

/** Pipeline ASM affiché par le banc (ARM Cortex-M) */
export const ASM_PIPELINE = [
  { addr: '0x08000140', op: 'BL', arg: 'verify_rsa_sig', tone: 'call' },
  { addr: '0x08000144', op: 'CMP', arg: 'R0, #0x00', tone: 'call' },
  { addr: '0x08000146', op: 'BNE', arg: '0x08000190', tone: 'target', note: 'CIBLE (175-205ns)' },
  { addr: '0x08000148', op: 'BL', arg: 'unlock_debug_uart', tone: 'ok' },
]
