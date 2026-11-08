import { parse } from 'yaml'

/**
 * Sépare l'en-tête YAML (entre deux lignes ---) du corps Markdown d'un article.
 */
export function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(raw)
  if (!match) return { data: {}, body: raw }
  return { data: parse(match[1]) ?? {}, body: match[2] }
}
