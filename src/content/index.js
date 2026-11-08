import { parseFrontmatter } from '../core/frontmatter.js'
import { renderMarkdown } from '../core/markdown.js'
import { profile } from './profile.js'
import { profileEn } from './profile.en.js'
import { infrastructure, repoCategories, repos, systems } from './projects.js'
import { infrastructureEn, repoCategoriesEn, reposEn, systemsEn } from './projects.en.js'

/**
 * Point d'entrée du contenu, commun à toutes les formes.
 * Un article = un fichier Markdown dans src/content/articles/ (le nom du fichier sert d'adresse).
 * Sa traduction anglaise, facultative, porte le même nom dans src/content/articles/en/.
 */

export { profile, repos, repoCategories, systems, infrastructure }

/** `label` : libellé d'origine, en anglais ; `fr` : libellé français */
export const categories = [
  { id: 'speech-ai', label: 'Speech & NLP', fr: 'Parole & TAL' },
  { id: 'security', label: 'Offensive Sec & Hardware', fr: 'Sécurité offensive & matériel' },
  { id: 'industrial', label: 'Cyber-Physical & Reliability', fr: 'Cyber-physique & fiabilité' },
]

const files = import.meta.glob('./articles/*.md', { query: '?raw', import: 'default', eager: true })
const filesEn = import.meta.glob('./articles/en/*.md', { query: '?raw', import: 'default', eager: true })

function estimateMinutes(body) {
  const words = body
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function toArticle([path, raw]) {
  const slug = path.split('/').pop().replace(/\.md$/, '')
  const { data, body } = parseFrontmatter(raw)
  const missing = ['title', 'date', 'category'].filter((key) => !data[key])
  if (missing.length) console.warn(`[contenu] ${slug}.md : champ(s) manquant(s) : ${missing.join(', ')}`)

  return {
    slug,
    id: data.id ?? slug.toUpperCase(),
    title: data.title ?? slug,
    date: String(data.date ?? ''),
    category: data.category ?? 'speech-ai',
    tag: data.tag ?? '',
    readTime: Number(data.readTime) || estimateMinutes(body),
    abstract: data.abstract ?? '',
    metrics: data.metrics ?? '',
    lab: data.lab ?? null,
    icon: data.icon ?? null,
    bibtex: String(data.bibtex ?? '').trim(),
    draft: data.draft === true,
    html: renderMarkdown(body),
  }
}

/** Articles publiés, du plus récent au plus ancien */
export const articles = Object.entries(files)
  .map(toArticle)
  .filter((article) => !article.draft)
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))

export const findArticle = (slug) => articles.find((article) => article.slug === slug) ?? null

/* ---------- Traductions anglaises ---------- */

/** Titre, résumé, étiquette, métriques et texte anglais, par adresse d'article */
const english = new Map(
  Object.entries(filesEn).map(([path, raw]) => {
    const slug = path.split('/').pop().replace(/\.md$/, '')
    const { data, body } = parseFrontmatter(raw)
    const html = body.trim() ? renderMarkdown(body) : null
    return [slug, { title: data.title, abstract: data.abstract, tag: data.tag, metrics: data.metrics, html }]
  }),
)

/** Applique une traduction : objets clé par clé, listes position par position */
function merge(base, over) {
  if (over === undefined || over === null) return base
  if (Array.isArray(base)) return base.map((item, i) => merge(item, over[i]))
  if (base && typeof base === 'object' && typeof over === 'object') {
    const out = { ...base }
    for (const key of Object.keys(over)) out[key] = merge(base[key], over[key])
    return out
  }
  return over
}

function translateArticle(article) {
  const tr = english.get(article.slug)
  if (!tr) return { ...article, bodyLang: 'fr' }
  return {
    ...article,
    title: tr.title ?? article.title,
    abstract: tr.abstract ?? article.abstract,
    tag: tr.tag ?? article.tag,
    metrics: tr.metrics ?? article.metrics,
    html: tr.html ?? article.html,
    bodyLang: tr.html ? 'en' : 'fr',
  }
}

const byLang = new Map()

/**
 * Tout le contenu dans une langue, 'fr' ou 'en'. Ce qui n'est pas traduit reste en
 * français ; chaque article indique dans `bodyLang` la langue réelle de son texte.
 * Les exports ci-dessus, utilisés par les autres formes, ne changent pas.
 */
export function contentIn(lang) {
  const key = lang === 'en' ? 'en' : 'fr'
  if (byLang.has(key)) return byLang.get(key)
  const en = key === 'en'
  const value = {
    lang: key,
    profile: en ? merge(profile, profileEn) : profile,
    categories: categories.map((c) => ({ ...c, label: en ? c.label : c.fr })),
    repoCategories: en ? repoCategories.map((c) => ({ ...c, label: repoCategoriesEn[c.id] ?? c.label })) : repoCategories,
    repos: en ? repos.map((r) => ({ ...r, desc: reposEn[r.name] ?? r.desc })) : repos,
    systems: en ? systems.map((s) => merge(s, systemsEn[s.code])) : systems,
    infrastructure: en ? infrastructure.map((n) => merge(n, infrastructureEn[n.node])) : infrastructure,
    articles: en ? articles.map(translateArticle) : articles.map((a) => ({ ...a, bodyLang: 'fr' })),
  }
  byLang.set(key, value)
  return value
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** "2026-10" → "OCT 2026" */
export function monthLabel(date) {
  const [year, month] = date.split('-')
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year
}

/** "2026-10" → "2026.10" */
export function dotDate(date) {
  const [year, month] = date.split('-')
  return month ? `${year}.${month}` : year
}
