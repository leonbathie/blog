# Blog de recherche — Ousmane Ba

Blog de recherche et d'ingénierie, en **Vue 3 + Vite**, conçu autour d'une idée :
le contenu est écrit une seule fois, et le blog **change de forme à chaque rafraîchissement
de la page**.

```
src/content/      le contenu (articles, projets, profil)  — écrit UNE fois
src/themes/       les « formes » du blog                  — une par apparence
src/core/         le socle partagé (Markdown+formules, formes, labos, audio, horloge)
```

Sept formes existent aujourd'hui :

| № | Forme               | Apparence                                                                     |
|---|---------------------|-------------------------------------------------------------------------------|
| 1 | `monographie`       | Carnet de recherche éditorial (papier / obsidienne), labo, jeu « Arcade 221 » |
| 2 | `cyberdeck`         | Poste de pilotage spatial : noyau WebGL Three.js, labo cyber, arène           |
| 3 | `planche`           | Planche de bureau d'études : papier millimétré, cartouche, tirage ou cyanotype |
| 4 | `mission`           | Contrôle de mission : radar orbital, télémétrie, essaim MCP, terminal Ctrl+K  |
| 5 | `crt`               | Tube cathodique : phosphore cyan, lignes de balayage, pluie de caractères     |
| 6 | `leontechlab`       | Console rétro bilingue FR/EN : bandeau lunaire en pixel art, invite de commande |
| 7 | `evolution`         | Machine à remonter le Web : la même page de 1991 à 2050, dans le navigateur de chaque époque |

Chaque chargement de page sert la **forme suivante** (`theme: 'rotate'` dans
`src/site.config.js`). Un lien `?forme=<id>` affiche toujours exactement la forme demandée,
pour que les liens partagés restent fidèles ; le sélecteur « Formes » en bas de page
permet aussi d'en choisir une.

## Démarrer

```bash
npm install
npm run dev        # développement        → http://localhost:5173
npm run build      # build de production  → dist/
npm run preview    # relire le build      → http://localhost:4173
```

Node 22.12+ requis.

---

## Ajouter une nouvelle forme (à chaque mise à jour)

C'est le geste principal de ce projet. **Le contenu n'est jamais recopié** : une forme ne
fait que l'afficher autrement.

### 1. Créer le dossier de la forme

```
src/themes/<ma-forme>/
  Theme.vue      ← composant racine (obligatoire)
  theme.css      ← styles de la forme (optionnel)
  components/    ← ses composants (optionnel)
```

### 2. Lire le contenu depuis `src/content/`

```vue
<script setup>
import { articles, profile, repos, systems, categories } from '../../content/index.js'
import { useRoute } from 'vue-router'

const route = useRoute()
// articles[0].html  → le Markdown déjà converti, formules KaTeX comprises
// profile.domains, profile.about, profile.highlights…
</script>
```

Chaque article expose : `slug`, `title`, `date`, `category`, `tag`, `abstract`,
`metrics`, `readTime`, `bibtex`, `lab`, `html`.

Les **simulateurs du laboratoire** suivent la même règle : leurs formules, seuils et jeux
d'essai vivent dans `src/core/lab-math.js`, et chaque forme n'écrit que sa présentation
(courbe, chronogramme, tableau…). Une correction de physique ou de linguistique se fait
donc à un seul endroit et profite à toutes les formes.

### « Arcade 221 », le jeu de la forme Monographie

Un vrai jeu de plateforme, terminable : quatre salles, trois vies, un terminal à
atteindre dans chacune. Au clavier : flèches ou A/D, Espace, P (pause), R
(recommencer), F (plein écran). Au doigt, tout se joue sur l'image : la moitié
gauche fait courir (vers le côté où l'on appuie, glisser fait demi-tour), la
moitié droite fait sauter (maintenir saute plus haut) ; un appui sur un écran
de titre ou de pause le valide, et le tableau de bord a ses boutons pause et
plein écran. Les touches ◀ ▶ SAUT restent sous l'image. Le téléphone vibre
brièvement aux sauts, aux puces et aux chutes. Il vit dans
`src/themes/monographie/game/` :

```
levels.js   les salles, posées par coordonnée, + validateLevels()
engine.js   la logique : physique, collisions, vies, score — sans aucun DOM
render.js   le dessin sur canevas, 480 × 272 pixels logiques agrandis
```

Le moteur ne touche ni au DOM ni au canevas, et il est **déterministe** : à
entrées égales, la partie se déroule toujours pareil. Les effets (poussière à
l'atterrissage, étincelles, secousse, tassement du personnage, faisceau du
terminal) sont dans `render.js` et ne lisent que les événements du moteur. C'est ce qui permet de la
faire jouer par un robot et de vérifier qu'elle reste finissable après chaque
modification de salle.

`validateLevels()` refuse les salles injouables. Un saut porte à ~67 px, soit un
peu plus de 4 tuiles : deux dangers accolés devraient être franchis d'un seul
bond, ce qui est impossible. La fonction vérifie donc la largeur des fosses,
l'écart entre dangers (rayon de patrouille des gardes compris) et l'absence de
bloc plein au-dessus d'un danger — un plafond coupe le saut et condamne la
salle. En développement, un problème s'affiche dans la console ; en production
la page du visiteur n'est jamais cassée pour autant.

### Deux formes qui partagent leur ossature

`mission` et `crt` sont la même application sous deux peaux. Tout vit dans
`src/themes/_terminal/` (le `_` indique que ce n'est pas une forme) : composant racine
`Shell.vue`, vues et simulateurs. Aucune couleur ni police n'y est écrite en dur — tout
passe par les variables `--term-*`, définies dans `_terminal/base.css` et **valorisées**
par chaque forme.

Une forme de ce type tient alors en trois petits fichiers :

```
src/themes/<ma-peau>/
  theme.css   ← les variables --term-* (couleurs, polices) et ses rares règles propres
  skin.js     ← les libellés (barre d'état, onglets, boutons) et le fond animé
  Theme.vue   ← <Shell :skin="MA_PEAU" />
```

Résultat au build : un tronc commun de ~38 Ko, et **2,5 Ko par peau**.
Si une nouvelle maquette reprend cette ossature, elle coûte une peau, pas une copie.

### 3. Réagir à l'URL

Les adresses sont **communes à toutes les formes**, donc un lien partagé reste valable
quand le blog change de forme. La forme lit `route.name` et affiche la section
correspondante elle-même (le routeur ne monte aucun composant) :

| Route                      | Nom        | Section              |
|----------------------------|------------|----------------------|
| `#/`                       | `home`     | accueil              |
| `#/recherche`              | `articles` | liste des articles   |
| `#/recherche/<slug>`       | `article`  | un article           |
| `#/projets`                | `projects` | projets & dépôts     |
| `#/labo/<module>`          | `lab`      | un simulateur        |
| `#/parcours`               | `about`    | parcours             |
| `#/arene`                  | `arena`    | partie jouable       |

### 4. L'inscrire **à la fin** du registre

```js
// src/themes/index.js
export const themes = [
  { id: 'monographie', /* … */ },
  { id: 'cyberdeck',   /* … */ },
  {
    id: 'ma-forme',
    name: 'Ma Forme',
    date: '2026-12',
    summary: 'Une phrase décrivant l\'apparence.',
    fonts: 'https://fonts.googleapis.com/css2?family=…&display=swap', // ou null
    integratedSwitcher: false, // true si la forme affiche son propre sélecteur de formes
    load: () => import('./ma-forme/Theme.vue'),
  },
]
```

Il suffit d'être dans le registre : `site.config.js` est réglé sur `theme: 'rotate'`, donc
la nouvelle forme entre d'elle-même dans la rotation, à la suite des autres.

### 5. Vérifier

```bash
npm run build
npm run preview
```

- `http://localhost:4173/` → une forme, puis la suivante à chaque rafraîchissement
- `http://localhost:4173/?forme=ma-forme` → exactement cette forme

> `integratedSwitcher: false` affiche automatiquement un sélecteur de formes en bas à
> gauche. Mettez `true` seulement si votre `Theme.vue` propose déjà ses propres boutons
> de changement de forme.

---

## Choisir la forme affichée

```js
// src/site.config.js
export default {
  theme: 'rotate',      // voir le tableau ci-dessous
  themeArchive: true,   // false = plus de sélecteur, ni de liens ?forme=, ni de rotation
}
```

| Réglage        | Effet                                                                 |
|----------------|-----------------------------------------------------------------------|
| `'rotate'`     | la forme **suivante** à chaque chargement de page ← réglage actuel     |
| `'random'`     | une forme au hasard, jamais deux fois la même d'affilée               |
| `'latest'`     | toujours la dernière du registre (ne change qu'en ajoutant une forme) |
| `'<id>'`       | toujours cette forme, par exemple `'mission'`                         |

---

## Écrire un article

Un fichier Markdown dans `src/content/articles/`. **Le nom du fichier devient l'adresse**
(`mon-article.md` → `#/recherche/mon-article`). Il est repris par toutes les formes, sans
modification de leur code.

```markdown
---
title: "Titre de l'article"
date: "2026-12"               # tri du plus récent au plus ancien
category: speech-ai           # speech-ai | security | industrial
tag: "SPEECH AI & NLP"
abstract: >-
  Résumé affiché dans la liste et en tête de l'article.
metrics: "WER -34.2% | Dataset: AudioSheet IA"   # optionnel
lab: pulaar                   # optionnel : weibull | pulaar | glitch — ajoute un lien vers le simulateur
icon: mic                     # optionnel : vignette LeonTechLab — computer | satellite | globe | gear | chip | mic | factory | phone | network | rocket
readTime: 9                   # optionnel : sinon estimé automatiquement
draft: false                  # true = non publié
bibtex: |
  @article{cle2026,
    title={…},
    author={Ba, Ousmane},
    year={2026}
  }
---

Texte en **Markdown**, avec formules en ligne $\beta > 1$ et en bloc :

$$R(t) = \exp\left(-\left(\frac{t}{\eta}\right)^\beta\right)$$

```python
# les blocs de code sont colorés par la forme active
def exemple():
    return 42
```
```

Profil, projets, dépôts et systèmes se modifient dans `src/content/profile.js` et
`src/content/projects.js`. Le nom, le pseudo, le titre (`role`) et la photo (`avatar`)
du profil reprennent ceux de github.com/leonbathie ; la photo est facultative.

### Français et anglais (forme LeonTechLab)

La forme LeonTechLab s'affiche dans la langue de l'appareil : français si le français
figure dans ses préférences, anglais sinon. Le bouton **FR | EN** de la barre d'état, ou la
commande `lang en` de l'invite de commande (Ctrl+K), change de langue et le choix est
mémorisé. Un lien `?lang=en` ou `?lang=fr` impose la langue, par exemple
`https://leonbathie.github.io/blog/?forme=leontechlab&lang=en`.

Les traductions anglaises du contenu vivent à côté du français :

```
src/content/articles/en/<même-nom>.md   titre, résumé et texte anglais d'un article
src/content/profile.en.js               profil, parcours, domaines, chiffres clés
src/content/projects.en.js              dépôts, systèmes et nœuds de calcul
```

Tout ce qui n'est pas traduit reste en français. Un article dont le fichier anglais n'a
qu'un en-tête garde son texte français, et la page le signale au lecteur. Les textes
d'interface sont dans `src/themes/leontechlab/i18n.js`. La forme Évolution suit aussi la
langue de l'appareil (voir plus bas). Les autres formes restent en français.

### La forme Évolution (1991 → 2050)

Un bandeau en pixel art sépia (un ingénieur à lunettes devant les consoles d'une salle de
contrôle, un globe filaire tourné vers l'Afrique, un satellite et le sol lunaire), une frise
de sept époques, et la **même page du blog** affichée dans le navigateur de l'époque choisie :

| Époque      | Nom                 | Navigateur et page                                          |
|-------------|---------------------|-------------------------------------------------------------|
| 1991 – 1999 | Web 1.0             | Netscape Navigator : barre noire, Afrique en ASCII, compteur |
| 2000 – 2009 | Web 2.0             | Firefox sous Windows XP : blog à catégories, flux RSS       |
| 2010 – 2019 | Mobile & Cloud      | Onglets modernes : héros et cartes                          |
| 2020 – 2029 | IA Générative       | Arc : LLM, parole, traduction                               |
| 2030 – 2039 | AR/VR & Robotique   | Interface immersive : jumeaux numériques                    |
| 2040 – 2049 | AGI & Spatial       | Interface orbitale : agents et recherche ouverte            |
| 2050        | AI × Space × Africa | LeonTechLab 2050                                            |

On change d'époque par la frise (flèches gauche / droite au clavier) ou en touchant une
des six vignettes ; le choix est mémorisé. Toutes les adresses du blog marchent dans
chaque époque, et la barre d'adresse les écrit à la façon de l'époque
(`notes/index.html` en 1995, `/archives/` en 2005, `/labo/weibull` ensuite). Les boutons
Précédent, Suivant, Accueil, Actualiser et Arrêter fonctionnent.

Le cadre (frise, pied de page) suit la langue de l'appareil, avec un bouton **FR | EN**
en bas de page. En français, chaque époque garde la langue de la maquette : anglais pour
1991, 2005 et 2050, français pour les autres. En anglais, tout passe en anglais. Les
époques, leurs couleurs et leurs textes sont dans `src/themes/evolution/eras.js`.

### L'invite de commande (forme LeonTechLab)

Ctrl+K, ou le `C:\>` de la barre du bas, ouvre une invite : `help`, `dir`, `open 3`,
`search weibull`, `cd projets`, `lang en`, `theme 2`, `launch`… `install python` **simule**
une installation (résolution, téléchargement avec barre de progression, vérification,
étapes), puis `python --version` répond et `python` ouvre un petit interpréteur
(`src/themes/leontechlab/pyrepl.js` : nombres, chaînes, listes, variables, `print()`).
`pip`, `npm`, `apt`, `winget`, `brew`, `sudo` et `ping` impriment leur sortie habituelle.
Rien n'est téléchargé ni installé pour de vrai : la liste des « programmes installés »
vit dans le navigateur (`installed`, `uninstall`). Ctrl+C interrompt.

---

## Mise en ligne

Le blog est publié sur **GitHub Pages** par GitHub Actions. Un push sur `main` suffit :

```bash
git add -A
git commit -m "Nouvelle forme : …"
git push
```

→ https://leonbathie.github.io/blog/

Aucune publication manuelle, aucun secret à configurer. Le workflow est
[.github/workflows/pages.yml](.github/workflows/pages.yml) ; il construit le site, désactive
Jekyll et publie `dist/`. Réglage à faire une seule fois :
*Settings → Pages → Build and deployment → **GitHub Actions***.

Les adresses étant en mode hash (`/#/recherche/mon-article`), aucune règle de réécriture
n'est nécessaire et les liens partagés restent valables.

### Déployer sur un VPS à la place

Possible à tout moment : [.github/workflows/deploy.yml](.github/workflows/deploy.yml) construit
le site et l'envoie par `rsync`. Il est volontairement **manuel** (onglet Actions →
« Run workflow ») pour ne pas entrer en concurrence avec Pages. Procédure complète (clé SSH,
secrets, Nginx, HTTPS) : [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md), avec une configuration
Nginx prête à installer dans [deploy/nginx.example.conf](deploy/nginx.example.conf).
