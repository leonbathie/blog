# Blog de recherche — Ousmane Ba

Blog de recherche et d'ingénierie, en **Vue 3 + Vite**, conçu autour d'une idée :
le contenu est écrit une seule fois, et le blog **change de forme à chaque rafraîchissement
de la page**.

```
src/content/      le contenu (articles, projets, profil)  — écrit UNE fois
src/themes/       les « formes » du blog                  — une par apparence
src/core/         le socle partagé (Markdown+formules, formes, labos, audio, horloge)
```

Cinq formes existent aujourd'hui :

| № | Forme               | Apparence                                                                     |
|---|---------------------|-------------------------------------------------------------------------------|
| 1 | `monographie`       | Carnet de recherche éditorial (papier / obsidienne), labo, mini-jeu 8-bit     |
| 2 | `cyberdeck`         | Poste de pilotage spatial : noyau WebGL Three.js, labo cyber, arène           |
| 3 | `planche`           | Planche de bureau d'études : papier millimétré, cartouche, tirage ou cyanotype |
| 4 | `mission`           | Contrôle de mission : radar orbital, télémétrie, essaim MCP, terminal Ctrl+K  |
| 5 | `crt`               | Tube cathodique : phosphore cyan, lignes de balayage, pluie de caractères     |

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
`src/content/projects.js`.

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
