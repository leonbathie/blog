import { parseFrontmatter } from '../core/frontmatter.js'
import { renderMarkdown } from '../core/markdown.js'

/**
 * Point d'entrée du contenu, commun à toutes les formes.
 * Un article = un fichier Markdown dans src/content/articles/ (le nom du fichier sert d'adresse).
 */

export { profile } from './profile.js'
export { repos, repoCategories, systems, infrastructure } from './projects.js'

export const categories = [
  { id: 'speech-ai', label: 'Speech & NLP' },
  { id: 'security', label: 'Offensive Sec & Hardware' },
  { id: 'industrial', label: 'Cyber-Physical & Reliability' },
]

const files = import.meta.glob('./articles/*.md', { query: '?raw', import: 'default', eager: true })

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
