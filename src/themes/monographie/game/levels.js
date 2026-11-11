/**
 * Niveaux d'« Arcade 221 ».
 *
 * Univers propre au blog : un ingénieur remet sous tension le réseau du labo de
 * Dakar. On traverse chaque salle jusqu'au terminal ; les puces de données
 * rapportent des points et ne barrent jamais la route.
 *
 * Légende d'une tuile :
 *   .  vide            o  puce de données        S  départ
 *   #  bloc plein      ^  surtension au sol      E  terminal de sortie
 *   -  passerelle      w  patrouilleur
 *
 * Tout est posé par coordonnée, jamais en comptant des points à la main : une
 * rangée écrite « à l'œil » décale les obstacles d'une tuile ou deux et rend la
 * salle infranchissable sans que ça se voie à la lecture.
 *
 * Les dangers sont espacés d'au moins CLEAR_TILES tuiles de sol franc. Ce n'est
 * pas une coquetterie : un saut porte à ~67 px, soit un peu plus de 4 tuiles.
 * Deux dangers accolés devraient être franchis d'un seul bond, ce qui est
 * impossible. `validateLevels()` le vérifie.
 */

export const TILE = 16
export const LEVEL_W = 64
export const LEVEL_H = 17

/** Largeur d'une fosse, en tuiles. Au-delà, le saut ne passe plus avec de la marge. */
const PIT_W = 2
/** Un patrouilleur s'écarte de 3 tuiles de son poste (cf. WALKER_RANGE du moteur) */
const WALKER_RANGE_TILES = 3
/** Tuiles de sol franc exigées entre deux dangers */
const CLEAR_TILES = 3

/** Rangée vide où l'on pose des motifs : place({ 3: 'S', 22: '^^' }) */
function place(spec = {}) {
  const row = Array.from({ length: LEVEL_W }, () => '.')
  for (const [at, glyph] of Object.entries(spec)) {
    const start = Number(at)
    if (start < 0 || start + glyph.length > LEVEL_W) {
      throw new Error(`Motif « ${glyph} » hors de la salle à la tuile ${start}`)
    }
    for (let i = 0; i < glyph.length; i++) row[start + i] = glyph[i]
  }
  return row.join('')
}

/** Rangée pleine, percée de fosses de PIT_W tuiles démarrant à chaque position donnée */
function ground(...pits) {
  const row = Array.from({ length: LEVEL_W }, () => '#')
  for (const start of pits) for (let i = start; i < start + PIT_W; i++) row[i] = '.'
  return row.join('')
}

const NONE = place()

/** Superpose des rangées : la dernière écrite l'emporte sur les tuiles occupées */
function merge(...rows) {
  const out = Array.from({ length: LEVEL_W }, () => '.')
  for (const row of rows) for (let x = 0; x < LEVEL_W; x++) if (row[x] !== '.') out[x] = row[x]
  return out.join('')
}

/** Passerelle de 4 tuiles et sa puce : renvoie les deux rangées [puce, passerelle] */
function ledge(...positions) {
  const chips = {}
  const decks = {}
  for (const x of positions) {
    chips[x + 1] = 'o'
    decks[x] = '----'
  }
  return [place(chips), place(decks)]
}

/**
 * Plateforme large de 5 tuiles et sa puce.
 *
 * Volontairement une passerelle et non un bloc plein : un bloc plein placé
 * au-dessus d'un danger coupe le saut du joueur, qui se cogne dessous et
 * retombe dans la fosse ou sur les pics. Une passerelle se traverse par en
 * dessous, donc elle ne peut jamais rendre une salle infranchissable.
 */
function block(...positions) {
  const chips = {}
  const slabs = {}
  for (const x of positions) {
    chips[x + 2] = 'o'
    slabs[x] = '-----'
  }
  return [place(chips), place(slabs)]
}

/**
 * @param hint       conseil affiché au clavier
 * @param hintTouch  variante affichée sur écran tactile ; parler de « Espace »
 *                   à quelqu'un qui joue au doigt n'aide personne.
 */
function build(name, hint, rows, hintTouch = null) {
  if (rows.length < LEVEL_H) throw new Error(`Niveau « ${name} » : ${rows.length} rangées, minimum ${LEVEL_H}`)
  return { name, hint, hintTouch: hintTouch ?? hint, grid: rows }
}

const [l1chipsHigh, l1deckHigh] = ledge(20, 47)
const [l1chipsLow, l1deckLow] = ledge(6, 35)

const [l2chipsHigh, l2deckHigh] = ledge(13, 37)
const [l2chipsMid, l2deckMid] = ledge(6, 29)
const [l2chipsSlab, l2slab] = block(12, 36)

const [l3chipsHigh, l3deckHigh] = ledge(7, 23, 39)
const [l3chipsSlab, l3slab] = block(12, 30)
const [l3chipsLow, l3deckLow] = ledge(4, 28)

const [l4chipsHigh, l4deckHigh] = ledge(10, 21, 32)
const [l4chipsMid, l4deckMid] = ledge(5, 45)
const [l4chipsSlab, l4slab] = block(18, 30)
const [l4chipsLow, l4deckLow] = ledge(13, 38)

const [l5chips, l5decks] = ledge(6, 25, 44)
const [l6chips, l6decks] = ledge(13, 32, 52)

// Une ascension en lacets : les plateformes se chevauchent et sont espacées
// de trois tuiles. Le sol continu rattrape une chute et permet de réessayer.
function skyAdventure(variant = 0) {
  const rows = Array.from({ length: 35 }, () => NONE)
  const xs = variant ? [22, 18, 14, 18, 22, 18, 14, 18, 22, 18] : [7, 11, 15, 11, 7, 11, 15, 11, 7, 11]
  rows[31] = place({ [xs[0] + 1]: 'S' })
  rows[32] = ground()
  rows[33] = ground()
  rows[34] = ground()
  const decks = xs.map((x, i) => [29 - i * 3, x])
  for (const [y, x] of decks) {
    rows[y] = place({ [x]: '--------' })
    rows[y - 1] = place({ [x + 3]: 'o' })
  }
  // Les singes sont perchés à côté des passerelles, jamais sur le chemin.
  // La hauteur de leur branche correspond au dessus de la passerelle voisine.
  for (const i of [1, 4, 7]) {
    const [y, x] = decks[i]
    const perchX = i === 4 ? x - 2 : x + 9
    rows[y - 1] = place({ [x + 3]: 'o', [perchX]: 'm' })
  }
  rows[1] = place({ [xs[9] + 2]: 'E', [xs[9] + 5]: 'o' })
  const name = variant ? '08 — Les cascades célestes' : '07 — Les jardins du ciel'
  return { ...build(name, 'Grimpe de plateforme en plateforme ! Esquive les bananes et utilise ton double saut.', rows, 'Grimpe avec ◀ ▶ et SAUT ; esquive les bananes !'), adventure: 'sky' }
}

export const LEVELS = [
  build('01 — Mise sous tension', 'Flèches ou A/D pour courir · Espace deux fois pour un double saut.', [
    NONE,
    NONE,
    NONE,
    NONE,
    NONE,
    NONE,
    l1chipsHigh,
    l1deckHigh,
    NONE,
    l1chipsLow,
    l1deckLow,
    NONE,
    place({ 27: 'o', 33: 'o' }),
    // Premier patrouilleur volontairement loin du départ : sa patrouille couvre
    // 3 tuiles de part et d'autre, il ne doit pas venir cueillir le joueur dès
    // les premiers pas de la première salle.
    place({ 3: 'S', 17: 'w', 25: '^^', 44: 'w', 59: 'E' }),
    ground(30),
    ground(30),
    ground(30),
  ], 'Cours avec ◀ ▶ · touche SAUT deux fois pour un double saut !'),

  build('02 — Baie de brassage', 'Enchaîne les puces rapidement pour multiplier les points !', [
    NONE,
    NONE,
    NONE,
    l2chipsHigh,
    l2deckHigh,
    NONE,
    l2chipsMid,
    l2deckMid,
    NONE,
    NONE,
    l2chipsSlab,
    l2slab,
    // Quelques puces au ras du sol : un visiteur qui se contente de courir
    // doit tout de même en ramasser.
    place({ 14: 'o', 23: 'o', 30: 'o', 46: 'o' }),
    place({ 3: 'S', 10: '^^', 18: 'w', 34: '^^', 42: 'w', 59: 'E' }),
    ground(26, 50),
    ground(26, 50),
    ground(26, 50),
  ], 'Enchaîne les puces rapidement pour multiplier les points !'),

  build('03 — Salle blanche', 'Retomber sur un patrouilleur le neutralise.', [
    NONE,
    NONE,
    l3chipsHigh,
    l3deckHigh,
    NONE,
    NONE,
    l3chipsSlab,
    l3slab,
    NONE,
    l3chipsLow,
    l3deckLow,
    NONE,
    place({ 6: 'o', 15: 'o', 30: 'o', 46: 'o', 55: 'o' }),
    place({ 3: 'S', 10: 'w', 26: '^^', 34: 'w', 50: '^^', 59: 'E' }),
    ground(18, 42),
    ground(18, 42),
    ground(18, 42),
  ]),

  build('04 — Cœur du réseau', 'Le terminal est au bout de la salle.', [
    NONE,
    l4chipsHigh,
    l4deckHigh,
    NONE,
    l4chipsMid,
    l4deckMid,
    NONE,
    NONE,
    l4chipsSlab,
    l4slab,
    NONE,
    l4chipsLow,
    merge(l4deckLow, place({ 7: 'o', 23: 'o', 31: 'o', 46: 'o', 55: 'o' })),
    place({ 3: 'S', 10: '^^', 18: 'w', 34: '^^', 50: 'w', 59: 'E' }),
    ground(26, 42),
    ground(26, 42),
    ground(26, 42),
  ]),

  build('05 \u2014 Temp\u00eate \u00e9lectrique', 'Les barri\u00e8res pulsent : attendez leur extinction ou sautez par-dessus.', [
    NONE, NONE, NONE, NONE, NONE, NONE,
    l5chips, l5decks, NONE, NONE, NONE, NONE,
    place({ 7: 'o', 25: 'o', 34: 'o', 45: 'o', 55: 'o' }),
    place({ 3: 'S', 10: 'g', 19: 'r', 39: 'g', 49: 'r', 59: 'E' }),
    ground(30), ground(30), ground(30),
  ]),
  build('06 \u2014 Le dernier circuit', 'Robots rapides et barri\u00e8res : observez le rythme avant de foncer !', [
    NONE, NONE, NONE, NONE, NONE, NONE,
    l6chips, l6decks, NONE, NONE, NONE, NONE,
    place({ 6: 'o', 17: 'o', 26: 'o', 33: 'o', 46: 'o', 55: 'o' }),
    place({ 3: 'S', 10: 'r', 29: 'g', 38: 'r', 59: 'E' }),
    ground(21, 50), ground(21, 50), ground(21, 50),
  ]),
  skyAdventure(),
  skyAdventure(1),
]

/**
 * Vérifie qu'aucune salle n'est infranchissable.
 * Renvoie la liste des problèmes trouvés — vide si tout va bien.
 */
export function validateLevels(levels = LEVELS) {
  const problems = []

  for (const level of levels) {
    const row = level.grid[level.grid.length - 4] // rangée des entités, juste au-dessus du sol
    const floor = level.grid[level.grid.length - 3]

    /** Intervalles de tuiles occupés par un danger, rayon de patrouille compris */
    const hazards = []
    for (let x = 0; x < LEVEL_W; x++) {
      if (row[x] === '^') hazards.push({ kind: 'surtension', at: x, a: x, b: x })
      if (row[x] === 'w' || row[x] === 'r') hazards.push({ kind: 'patrouilleur', at: x, a: x - WALKER_RANGE_TILES, b: x + WALKER_RANGE_TILES })
      if (row[x] === 'g') hazards.push({ kind: 'barriere', at: x, a: x, b: x })
    }

    const pits = []
    for (let x = 0; x < LEVEL_W; x++) {
      if (floor[x] !== '.') continue
      const start = x
      while (x < LEVEL_W && floor[x] === '.') x++
      pits.push({ a: start, b: x - 1 })
    }

    const spacing = (p, q) => (q.a > p.b ? q.a - p.b - 1 : p.a - q.b - 1)

    for (const pit of pits) {
      const width = pit.b - pit.a + 1
      if (width > PIT_W) problems.push(`${level.name} : fosse de ${width} tuiles en ${pit.a} (maximum ${PIT_W})`)
      for (const h of hazards) {
        const d = spacing(pit, h)
        if (d < CLEAR_TILES) {
          problems.push(`${level.name} : ${h.kind}(${h.at}) à ${d} tuile(s) de la fosse ${pit.a}-${pit.b} (minimum ${CLEAR_TILES})`)
        }
      }
    }

    // Rien de plein ne doit surplomber un danger : le joueur s'y cognerait en
    // plein saut et retomberait dedans. Un saut monte d'environ 4 tuiles, d'où
    // le couloir vérifié ici. Les passerelles, elles, se traversent par en bas.
    const CEILING_ROWS = [level.grid.length - 8, level.grid.length - 4] // rangées 9 à 13
    for (const zone of [...hazards, ...pits]) {
      for (let x = Math.max(0, zone.a - 2); x <= Math.min(LEVEL_W - 1, zone.b + 4); x++) {
        for (let y = CEILING_ROWS[0]; y <= CEILING_ROWS[1]; y++) {
          if (level.grid[y][x] === '#') {
            problems.push(`${level.name} : bloc plein en (${x}, ${y}) au-dessus du danger ${zone.a}-${zone.b} — il coupe le saut`)
          }
        }
      }
    }

    for (let i = 0; i < hazards.length; i++) {
      for (let j = i + 1; j < hazards.length; j++) {
        const [p, q] = [hazards[i], hazards[j]]
        // Deux pics côte à côte forment un seul obstacle : c'est voulu
        if (p.kind === 'surtension' && q.kind === 'surtension' && Math.abs(p.at - q.at) === 1) continue
        const d = spacing(p, q)
        if (d < CLEAR_TILES) {
          problems.push(`${level.name} : ${p.kind}(${p.at}) et ${q.kind}(${q.at}) à ${d} tuile(s) l'un de l'autre`)
        }
      }
    }
  }

  return problems
}

// En développement, une salle mal fichue doit se voir tout de suite.
// En production on ne casse jamais la page d'un visiteur pour autant.
if (import.meta.env?.DEV) {
  const problems = validateLevels()
  if (problems.length) console.error('[Arcade 221] niveaux à corriger :\n' + problems.join('\n'))
}
