/**
 * Vignettes d'articles en pixel art, 64 × 48 cases, dessinées par primitives
 * avec dégradés tramés (pixel.js). PixelIcon.vue les agrandit d'un facteur
 * entier : des carrés nets, jamais de flou.
 *
 * Noms disponibles : computer, satellite, globe, gear, chip, mic, factory,
 * phone, network, rocket. Un article choisit le sien par `icon:` dans son
 * en-tête ; sinon la vignette suit le domaine.
 */
import { hash, painter, paintEarth, rgb, shade, smooth } from './pixel.js'

export const ICON_W = 64
export const ICON_H = 48

const C = {
  bg: rgb('#000000'),
  white: rgb('#ffffff'),
  black: rgb('#141414'),
  // boîtier beige
  beigeDark: rgb('#8d7f66'),
  beige: rgb('#b5a48b'),
  beigeLight: rgb('#ddd0b8'),
  beigeHi: rgb('#f3ebdc'),
  // écran à phosphore vert
  screenDark: rgb('#02110a'),
  screenMid: rgb('#063d1f'),
  screenGlow: rgb('#33ff33'),
  screenText: rgb('#b4ffb4'),
  // feuille d'or
  goldDark: rgb('#8a6510'),
  gold: rgb('#e0a82a'),
  goldLight: rgb('#ffd96a'),
  // panneaux solaires
  cellDark: rgb('#0e2a5c'),
  cell: rgb('#1b4a8f'),
  cellLight: rgb('#2f6fc4'),
  cellHi: rgb('#8fc3ff'),
  cellGrid: rgb('#0a1c3a'),
  // métal
  steelDark: rgb('#4a4a4a'),
  steel: rgb('#7c7c7c'),
  steelLight: rgb('#b2b2b2'),
  steelHi: rgb('#e4e4e4'),
  // circuit imprimé
  pcbDark: rgb('#0b3b17'),
  pcb: rgb('#146b2a'),
  pcbLight: rgb('#1f8a34'),
  copper: rgb('#c9a95b'),
  // verre de bouteille
  glassDark: rgb('#0a3d20'),
  glass: rgb('#1c6b3a'),
  glassLight: rgb('#5fd37a'),
  glassHi: rgb('#c8ffd8'),
  // accents
  red: rgb('#ff4040'),
  redDark: rgb('#8a1010'),
  cyan: rgb('#50f0ff'),
  cyanDark: rgb('#0e7490'),
  cyanDeep: rgb('#07303a'),
  // téléphone
  phone: rgb('#1d242b'),
  phoneLight: rgb('#2f3a44'),
  key: rgb('#223040'),
  keyLight: rgb('#3a4d60'),
  wall: rgb('#0d1016'),
  wallLight: rgb('#1a2a35'),
  litWindow: rgb('#6a6a2a'),
}
const STARS = [rgb('#3b4a3f'), rgb('#9fb3a6'), rgb('#eafff0')]
const BEIGE = [C.beigeDark, C.beige, C.beigeLight]
const STEEL = [C.steelDark, C.steel, C.steelLight]
const GOLD = [C.goldDark, C.gold, C.goldLight]

const ICONS = {
  /** Poste de travail : moniteur à tube, écran « AI> », clavier et souris */
  computer(p) {
    // Coque du moniteur, plus claire en haut à gauche
    p.grad(10, 2, 53, 33, BEIGE, (x, y) => 0.95 - ((x - 10) / 44) * 0.4 - ((y - 2) / 32) * 0.45)
    p.hline(10, 53, 2, C.beigeHi)
    p.vline(10, 2, 33, C.beigeHi)
    p.hline(10, 53, 33, C.beigeDark)
    p.vline(53, 2, 33, C.beigeDark)
    // Cadre et dalle
    p.rect(14, 5, 49, 28, C.beigeDark)
    p.rect(15, 6, 48, 27, C.screenDark)
    for (let y = 7; y <= 27; y += 2) p.hline(15, 48, y, rgb('#04170c'))
    // Halo de phosphore derrière le texte, puis le texte
    p.grad(21, 11, 47, 21, [C.screenDark, C.screenMid], (x, y) => 0.45 - Math.abs(y - 16) * 0.06 - Math.abs(x - 34) * 0.02)
    p.text('AI>', 23, 13, C.screenGlow)
    p.hline(42, 46, 20, C.screenText) // curseur
    // Marque, aérations et témoin
    p.hline(28, 35, 31, C.beigeDark)
    for (let x = 15; x <= 23; x += 2) p.put(x, 31, C.beigeDark)
    p.put(47, 31, C.screenGlow)
    // Pied
    p.grad(28, 34, 35, 36, BEIGE, (x) => 0.8 - ((x - 28) / 7) * 0.5)
    p.rect(20, 37, 43, 38, C.beige)
    p.hline(20, 43, 38, C.beigeDark)
    // Clavier : dessus clair, deux rangées de touches, barre d'espace, façade sombre
    p.rect(2, 41, 61, 45, C.beigeLight)
    for (let x = 4; x <= 57; x += 4) {
      p.rect(x, 42, x + 2, 42, C.beige)
      if (x < 22 || x > 40) p.rect(x, 44, x + 2, 44, C.beige)
    }
    p.rect(22, 44, 40, 44, C.beige)
    p.rect(2, 46, 61, 47, C.beigeDark)
    p.vline(2, 41, 47, C.beigeDark)
    p.vline(61, 41, 47, C.beigeDark)
    // Souris, à droite du pied
    p.rect(55, 36, 60, 39, C.beigeLight)
    p.hline(55, 60, 39, C.beigeDark)
    p.put(57, 37, C.beige)
    p.line(55, 36, 50, 40, C.beigeDark) // câble
  },

  /** Satellite en orbite au-dessus de l'horizon terrestre */
  satellite(p) {
    p.stars(42, C.bg, STARS, 3)
    // Terre : un grand globe dont seul le limbe entre dans l'image
    paintEarth(p.put, { cx: 32, cy: 100, r: 68, spin: 15 })
    // Panneaux solaires : cellules bleues, trait de lumière en diagonale
    for (const x0 of [3, 41]) {
      p.grad(x0, 13, x0 + 19, 20, [C.cellDark, C.cell, C.cellLight, C.cellHi], (x, y) => 0.25 + 0.6 * smooth(1 - Math.abs(x + y - (x0 + 26)) / 9))
      for (let x = x0; x <= x0 + 19; x += 4) p.vline(x, 13, 20, C.cellGrid)
      p.hline(x0, x0 + 19, 17, C.cellGrid)
      p.hline(x0, x0 + 19, 13, C.steel)
      p.hline(x0, x0 + 19, 20, C.steelDark)
    }
    // Bras et charnières
    p.hline(23, 25, 16, C.steelLight)
    p.hline(38, 40, 16, C.steelLight)
    p.hline(23, 25, 17, C.steelDark)
    p.hline(38, 40, 17, C.steelDark)
    // Corps en feuille d'or froissée
    p.grad(26, 11, 37, 23, GOLD, (x, y) => 0.35 + hash(x, y) * 0.5 + (1 - (y - 11) / 12) * 0.2)
    p.vline(26, 11, 23, C.goldLight)
    p.hline(26, 37, 11, C.goldLight)
    p.rect(26, 22, 37, 23, C.steelDark)
    p.rect(28, 14, 35, 17, C.black) // baie d'instruments
    p.put(29, 15, C.cyan)
    p.put(33, 16, C.red)
    // Antenne parabolique et sa source
    for (let dx = -7; dx <= 7; dx++) {
      const y = 6 + Math.round((dx * dx) / 12)
      p.put(32 + dx, y, C.steelHi)
      p.put(32 + dx, y + 1, C.steel)
    }
    p.vline(32, 2, 9, C.steelDark)
    p.put(32, 1, C.red)
    // Antennes filaires
    p.vline(24, 5, 10, C.steel)
    p.put(24, 4, C.white)
    p.vline(40, 4, 10, C.steel)
    p.put(40, 3, C.white)
    // Tuyère
    p.rect(30, 24, 33, 26, C.steelDark)
    p.hline(29, 34, 27, C.steel)
  },

  /** La Terre, l'Afrique au centre */
  globe(p) {
    p.stars(46, C.bg, STARS, 7)
    paintEarth(p.put, { cx: 32, cy: 24, r: 21, spin: 20 })
  },

  /** Deux engrenages en prise, acier brossé */
  gear(p) {
    // Fond d'atelier : grille discrète
    for (let x = 0; x < ICON_W; x += 8) p.vline(x, 0, ICON_H - 1, rgb('#0b0f0b'))
    for (let y = 0; y < ICON_H; y += 8) p.hline(0, ICON_W - 1, y, rgb('#0b0f0b'))
    const cog = (cx, cy, R, T, teeth, hub, phase) => {
      for (let y = cy - R - T; y <= cy + R + T; y++) {
        for (let x = cx - R - T; x <= cx + R + T; x++) {
          const dx = x + 0.5 - cx
          const dy = y + 0.5 - cy
          const d = Math.hypot(dx, dy)
          if (d <= hub) {
            p.put(x, y, C.bg)
            continue
          }
          if (d > R + T) continue
          const a = Math.atan2(dy, dx)
          const tooth = (((a + phase) * teeth) / (Math.PI * 2) + 10) % 1 < 0.5
          if (d > R && !tooth) continue
          // Lumière venant du haut à gauche, arêtes plus sombres
          let v = 0.55 + 0.3 * ((-dx - dy) / (d * 1.414))
          if (d > R - 1.2 && d <= R + 0.3) v -= 0.25
          if (d > R + T - 1) v -= 0.2
          if (d <= hub + 1.2) v -= 0.3
          p.put(x, y, shade([C.steelDark, C.steel, C.steelLight, C.steelHi], v, x, y))
        }
      }
      // Évidements
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + phase
        const r = (R + hub) / 2
        p.disc(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), Math.max(1, Math.round(R / 7)), C.bg)
      }
    }
    cog(24, 25, 14, 4, 12, 4, 0.1)
    cog(47, 32, 8, 3, 8, 2, 0.5)
    // Repère d'usure : un éclat d'or sur la grande roue
    p.put(17, 19, C.goldLight)
    p.put(18, 18, C.goldLight)
  },

  /** Microcontrôleur sur circuit imprimé */
  chip(p) {
    p.grad(0, 0, ICON_W - 1, ICON_H - 1, [C.pcbDark, C.pcb], (x, y) => 0.25 + hash(x >> 2, y >> 2) * 0.3)
    // Pistes de cuivre et vias
    for (const [x0, y0, x1, y1] of [[0, 20, 15, 20], [0, 26, 15, 26], [48, 14, 63, 14], [48, 30, 63, 30], [30, 0, 30, 7], [34, 40, 34, 47], [6, 20, 6, 8], [57, 30, 57, 44]]) {
      p.line(x0, y0, x1, y1, C.copper)
    }
    for (const [x, y] of [[6, 8], [57, 44], [10, 26], [52, 14]]) {
      p.disc(x, y, 1, C.gold)
      p.put(x, y, C.pcbDark)
    }
    // Broches
    for (let x = 22; x <= 41; x += 3) {
      p.vline(x, 8, 11, C.gold)
      p.vline(x, 36, 39, C.gold)
      p.put(x, 8, C.goldLight)
    }
    for (let y = 14; y <= 33; y += 3) {
      p.hline(16, 19, y, C.gold)
      p.hline(44, 47, y, C.gold)
      p.put(16, y, C.goldLight)
    }
    // Corps époxy, arête éclairée
    p.rect(20, 12, 43, 35, C.black)
    p.hline(20, 43, 12, rgb('#333333'))
    p.vline(20, 12, 35, rgb('#333333'))
    p.put(22, 14, C.steelLight) // repère de la broche 1
    // Fenêtre sur la puce : silicium quadrillé qui luit
    p.rect(26, 16, 37, 25, rgb('#0a2a14'))
    for (let y = 17; y <= 24; y += 2) for (let x = 27; x <= 36; x += 2) p.put(x, y, hash(x, y) > 0.3 ? C.screenGlow : C.pcbLight)
    p.text('LTL', 23, 27, C.steelLight)
  },

  /** Micro de studio et forme d'onde */
  mic(p) {
    // Capsule grillagée
    p.ellipse(20, 16, 9, 12, C.steelHi)
    p.ellipse(20, 16, 8, 11, C.steel, (x, y, e) => {
      const mesh = (x + y) % 2 === 0
      return shade([C.steelDark, C.steel, C.steelLight], (mesh ? 0.35 : 0.75) - e * 0.3 + (x < 18 ? 0.15 : 0), x, y)
    })
    p.put(16, 9, C.white)
    p.put(17, 8, C.steelHi)
    // Bague et corps
    p.rect(15, 28, 25, 30, C.steelLight)
    p.grad(16, 31, 24, 40, [C.black, C.steelDark, C.steel], (x) => 0.9 - ((x - 16) / 8) * 0.9)
    p.vline(17, 31, 40, C.steel)
    // Pied
    p.vline(20, 41, 45, C.steel)
    p.hline(13, 27, 46, C.steelLight)
    p.hline(13, 27, 47, C.steelDark)
    // Forme d'onde : barres vertes, enveloppe en cloche
    p.hline(30, 61, 20, rgb('#0f5a24'))
    for (let x = 30; x <= 61; x += 2) {
      const env = Math.exp(-(((x - 46) / 13) ** 2))
      const h = Math.round(1 + 12 * Math.abs(Math.sin(x * 0.7)) * env)
      p.vline(x, 20 - h, 20 + h, C.screenGlow)
      p.put(x, 20, C.screenText)
    }
    p.put(58, 4, C.red) // témoin d'enregistrement
    p.hline(50, 56, 4, C.steelDark)
  },

  /** Ligne d'embouteillage : remplisseuse, bouteilles, convoyeur */
  factory(p) {
    // Mur d'atelier et ses fenêtres
    p.rect(0, 5, 63, 32, C.wall)
    p.hline(0, 63, 5, C.steelDark)
    for (let y = 9; y <= 27; y += 7) {
      for (let x = 3; x <= 59; x += 9) p.rect(x, y, x + 3, y + 2, hash(x, y) > 0.72 ? C.litWindow : C.wallLight)
    }
    // Remplisseuse : caisson d'acier, cadran, buse
    p.grad(22, 8, 41, 22, STEEL, (x, y) => 0.8 - ((x - 22) / 19) * 0.45 - ((y - 8) / 14) * 0.2)
    p.hline(22, 41, 8, C.steelHi)
    p.rect(24, 10, 28, 20, C.black) // panneau
    for (let y = 11; y <= 19; y += 2) p.put(26, y, hash(26, y) > 0.5 ? C.screenGlow : C.red)
    p.disc(35, 14, 3, C.white)
    p.ring(35, 14, 3, 1, C.steelDark)
    p.line(35, 14, 37, 12, C.red) // aiguille
    for (let x = 22; x <= 41; x++) p.put(x, 22, (x >> 1) % 2 ? C.gold : C.black) // bande d'avertissement
    p.rect(30, 23, 33, 25, C.steelDark)
    p.put(31, 27, C.cyan) // goutte
    // Convoyeur
    p.hline(2, 61, 37, C.steelLight)
    p.grad(2, 38, 61, 41, [C.black, C.steelDark, C.steel], (x, y) => 0.7 - (y - 38) * 0.2)
    for (let x = 6; x <= 58; x += 13) {
      p.disc(x, 44, 2, C.steel)
      p.put(x, 44, C.black)
    }
    // Bouteilles : celle du milieu sous la buse, à moitié pleine
    ;[9, 19, 29, 39, 49].forEach((x, i) => {
      const level = i === 2 ? 31 : 29
      p.grad(x, 27, x + 5, 36, [C.glassDark, C.glass], () => 0.4)
      p.grad(x, level, x + 5, 36, [C.glass, C.glassLight], (xx) => 0.3 + (xx === x + 1 ? 0.6 : 0))
      p.vline(x + 1, 27, 36, C.glassHi)
      p.rect(x + 2, 23, x + 3, 26, C.glass)
      p.rect(x + 1, 21, x + 4, 22, i % 2 ? C.red : C.gold)
    })
  },

  /** Téléphone : clavier Fulfuldekey à l'écran */
  phone(p) {
    p.rect(20, 2, 43, 45, C.phone)
    for (const [x, y] of [[20, 2], [43, 2], [20, 45], [43, 45]]) p.put(x, y, C.bg)
    p.vline(21, 3, 44, C.phoneLight) // reflet
    p.rect(44, 14, 44, 18, C.steelDark) // bouton latéral
    p.hline(29, 35, 3, C.steelDark) // haut-parleur
    p.put(32, 4, C.steelLight) // caméra
    // Écran
    p.rect(22, 6, 41, 40, rgb('#0b1620'))
    for (let x = 23; x <= 27; x += 2) p.put(x, 6, C.steelLight)
    p.hline(37, 40, 6, C.screenGlow)
    // Champ de saisie et texte tapé
    p.rect(23, 8, 40, 13, rgb('#122233'))
    for (let x = 24; x <= 33; x += 3) p.rect(x, 10, x + 1, 11, C.screenText)
    p.vline(35, 9, 12, C.screenGlow)
    // Quatre rangées de touches, deux touches de langue en vert
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const x = 23 + col * 4
        const y = 18 + row * 4
        const special = (row === 1 && col === 1) || (row === 2 && col === 3)
        p.rect(x, y, x + 2, y + 2, special ? C.pcbLight : C.key)
        p.hline(x, x + 2, y, special ? C.glassLight : C.keyLight)
      }
    }
    p.rect(26, 34, 38, 36, C.key)
    p.hline(26, 38, 34, C.keyLight)
    p.hline(29, 35, 43, C.steel) // indicateur d'accueil
  },

  /** Réseau d'agents : trois couches de nœuds reliés */
  network(p) {
    for (let y = 0; y < ICON_H; y += 8) for (let x = 0; x < ICON_W; x += 8) p.put(x, y, rgb('#0a1a1a'))
    const L = [
      [[11, 12], [11, 36]],
      [[32, 8], [32, 24], [32, 40]],
      [[53, 16], [53, 32]],
    ]
    for (let i = 0; i < L.length - 1; i++) {
      for (const [ax, ay] of L[i]) for (const [bx, by] of L[i + 1]) p.line(ax, ay, bx, by, C.cyanDark)
    }
    // Impulsions sur les liaisons
    for (const [x, y] of [[21, 18], [22, 30], [42, 20], [43, 36], [21, 10]]) p.put(x, y, C.white)
    const node = (cx, cy, r, hot) => {
      p.ring(cx, cy, r + 2, 1, C.cyanDeep)
      p.disc(cx, cy, r, C.cyan, (x, y, d) => shade(hot ? [C.goldDark, C.gold, C.goldLight, C.white] : [C.cyanDark, C.cyan, C.white], 1.1 - d - (x - cx) * 0.05 - (y - cy) * 0.05, x, y))
    }
    L.flat().forEach(([x, y]) => node(x, y, 4, false))
    node(32, 24, 5, true)
  },

  /** Fusée au décollage, sous un croissant de lune */
  rocket(p) {
    p.stars(44, C.bg, STARS, 11)
    // Lune
    p.disc(52, 9, 6, C.steelLight, (x, y, d) => shade([C.steel, C.steelLight, C.steelHi], 1 - d * 0.6 - (x - 52) * 0.06, x, y))
    for (const [x, y] of [[50, 8], [54, 11], [53, 6]]) p.put(x, y, C.steel)
    // Fusée
    p.grad(28, 13, 35, 32, [C.steel, C.steelLight, C.steelHi], (x) => 0.9 - ((x - 28) / 7) * 0.8)
    for (let y = 6; y <= 12; y++) {
      const half = Math.round(((y - 5) / 7) * 3.5)
      p.hline(32 - half, 31 + half, y, y < 9 ? C.red : C.redDark)
    }
    p.disc(32, 19, 2, C.cyan)
    p.put(31, 18, C.white)
    p.hline(28, 35, 26, C.red) // bande
    for (let y = 26; y <= 34; y++) {
      const w = Math.round(((y - 26) / 8) * 4)
      p.hline(28 - w, 27, y, C.red)
      p.hline(36, 36 + w, y, C.redDark)
    }
    p.rect(29, 33, 34, 34, C.steelDark)
    // Flamme
    for (let y = 35; y <= 46; y++) {
      const k = (y - 35) / 11
      const half = Math.max(0, Math.round(3.5 - k * 3.5 + (hash(y, 1) - 0.5)))
      p.hline(32 - half, 31 + half, y, k < 0.3 ? C.white : k < 0.6 ? C.goldLight : C.gold)
      if (k > 0.5) p.hline(32 - half - 1, 32 - half - 1, y, C.red)
      if (k > 0.5) p.put(32 + half, y, C.red)
    }
    // Fumée
    for (let i = 0; i < 14; i++) p.put(20 + Math.floor(hash(i, 3) * 24), 44 + Math.floor(hash(i, 5) * 4), C.steelDark)
  },
}

export const ICON_NAMES = Object.keys(ICONS)

const cache = new Map()

/** Cases de la vignette (Uint32Array de 64 × 48), calculées une fois par nom */
export function iconPixels(name) {
  const key = ICONS[name] ? name : 'computer'
  if (!cache.has(key)) {
    const cells = new Uint32Array(ICON_W * ICON_H).fill(C.bg)
    ICONS[key](painter(cells, ICON_W, ICON_H))
    cache.set(key, cells)
  }
  return cache.get(key)
}

/**
 * Dessine la vignette sur un canevas de (64·B) × (48·B) pixels, B entier.
 * Le canevas est redimensionné ici : il doit être dimensionné par l'appelant
 * en CSS (ICON_W·B / devicePixelRatio) pour rester net.
 */
export function drawIcon(canvas, name, B = 1) {
  const cells = iconPixels(name)
  const buf = document.createElement('canvas')
  buf.width = ICON_W
  buf.height = ICON_H
  const bctx = buf.getContext('2d')
  const img = bctx.createImageData(ICON_W, ICON_H)
  new Uint32Array(img.data.buffer).set(cells)
  bctx.putImageData(img, 0, 0)
  canvas.width = ICON_W * B
  canvas.height = ICON_H * B
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(buf, 0, 0, canvas.width, canvas.height)
}
