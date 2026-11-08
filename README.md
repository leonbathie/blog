# Blog de recherche — Ousmane Ba

Blog de recherche et d'ingénierie, en **Vue 3 + Vite**, conçu autour d'une idée :
le contenu est écrit une seule fois, et le blog **change de forme à chaque mise à jour**.

```
src/content/      le contenu (articles, projets, profil)  — écrit UNE fois
src/themes/       les « formes » du blog                  — une nouvelle à chaque mise à jour
src/core/         le socle partagé (Markdown+formules, formes, audio, horloge)
```

Deux formes existent aujourd'hui :

| № | Forme            | Apparence                                                                 |
|---|------------------|---------------------------------------------------------------------------|
| 1 | `monographie`    | Carnet de recherche éditorial (papier / obsidienne), labo, mini-jeu 8-bit |
| 2 | `cyberdeck`      | Poste de pilotage spatial : noyau WebGL Three.js, labo cyber, arène       |

La forme affichée est la **dernière du registre** (`src/themes/index.js`). Les visiteurs
peuvent revoir les précédentes via le sélecteur « Formes » en bas de page.

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

Être en dernier suffit : `site.config.js` est réglé sur `theme: 'latest'`, donc la nouvelle
forme devient celle du site, et les anciennes restent consultables.

### 5. Vérifier

```bash
npm run build
npm run preview
```

- `http://localhost:4173/` → la nouvelle forme
- `http://localhost:4173/?forme=monographie` → une forme précédente

> `integratedSwitcher: false` affiche automatiquement un sélecteur de formes en bas à
> gauche. Mettez `true` seulement si votre `Theme.vue` propose déjà ses propres boutons
> de changement de forme.

---

## Choisir la forme affichée

```js
// src/site.config.js
export default {
  theme: 'latest',      // 'latest' = la dernière du registre · ou 'monographie', 'cyberdeck'…
  themeArchive: true,   // false = plus de sélecteur ni de liens ?forme=
}
```

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

Le déploiement passe **uniquement par git + GitHub Actions** : un push sur `main`
déclenche le workflow qui construit le site et envoie `dist/` sur le serveur.
Aucune publication manuelle (pas de `scp`, pas de script lancé depuis le PC).

```bash
git add -A
git commit -m "Nouvelle forme : …"
git push
```

Voir [.github/workflows/](.github/workflows/) pour le détail, et la section
« Secrets » de ce même dossier pour les variables attendues.
