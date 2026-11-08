import MarkdownIt from 'markdown-it'
import katex from 'katex'

/**
 * Rendu Markdown des articles avec formules KaTeX :
 *   - en ligne :  $\beta > 1$
 *   - en bloc  :  $$R(t) = e^{-(t/\eta)^\beta}$$   (sur une ou plusieurs lignes)
 * Les formules sont extraites AVANT l'analyse Markdown, donc `_`, `*` ou `\,` n'y sont jamais altérés.
 */

const escapeHtml = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function tex(source, displayMode) {
  try {
    return katex.renderToString(source, { displayMode, throwOnError: false, strict: 'ignore' })
  } catch {
    return `<code>${escapeHtml(source)}</code>`
  }
}

const isSpace = (code) => code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d

/** $…$ et $$…$$ au fil du texte */
function mathInline(state, silent) {
  const src = state.src
  const start = state.pos
  if (src.charCodeAt(start) !== 0x24 /* $ */) return false

  // $$…$$ écrit au milieu d'un paragraphe : formule centrée
  if (src.charCodeAt(start + 1) === 0x24) {
    const end = src.indexOf('$$', start + 2)
    if (end === -1) return false
    if (!silent) {
      const token = state.push('math_inline_display', 'math', 0)
      token.content = src.slice(start + 2, end)
      token.markup = '$$'
    }
    state.pos = end + 2
    return true
  }

  // $…$ (règles Pandoc : pas d'espace juste après l'ouverture ni juste avant la fermeture)
  const next = src.charCodeAt(start + 1)
  if (Number.isNaN(next) || isSpace(next)) return false
  let end = start + 1
  for (;;) {
    end = src.indexOf('$', end)
    if (end === -1) return false
    if (src.charCodeAt(end - 1) === 0x5c /* \ */) {
      end += 1
      continue
    }
    break
  }
  if (isSpace(src.charCodeAt(end - 1))) return false
  const after = src.charCodeAt(end + 1)
  if (after >= 0x30 && after <= 0x39) return false // « $5 et $10 » ne sont pas des formules

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.content = src.slice(start + 1, end)
    token.markup = '$'
  }
  state.pos = end + 1
  return true
}

/** Bloc $$ … $$ en début de ligne */
function mathBlock(state, startLine, endLine, silent) {
  let pos = state.bMarks[startLine] + state.tShift[startLine]
  let max = state.eMarks[startLine]
  if (state.sCount[startLine] - state.blkIndent >= 4) return false
  if (pos + 2 > max || state.src.slice(pos, pos + 2) !== '$$') return false

  pos += 2
  let firstLine = state.src.slice(pos, max)
  let lastLine = ''
  let next = startLine
  let found = false

  if (firstLine.trim().endsWith('$$')) {
    firstLine = firstLine.trim().slice(0, -2)
    found = true
  }
  if (silent) return true

  while (!found) {
    next += 1
    if (next >= endLine) break
    pos = state.bMarks[next] + state.tShift[next]
    max = state.eMarks[next]
    if (pos < max && state.sCount[next] < state.blkIndent) break
    const line = state.src.slice(pos, max).trim()
    if (line.endsWith('$$')) {
      lastLine = line.slice(0, -2)
      found = true
    }
  }

  state.line = next + 1
  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content = [firstLine, state.getLines(startLine + 1, next, state.tShift[startLine], true), lastLine]
    .filter((part) => part && part.trim())
    .join('\n')
  token.map = [startLine, state.line]
  token.markup = '$$'
  return true
}

function mathPlugin(md) {
  md.inline.ruler.after('escape', 'math_inline', mathInline)
  md.block.ruler.before('fence', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules.math_inline = (tokens, idx) => tex(tokens[idx].content, false)
  md.renderer.rules.math_inline_display = (tokens, idx) =>
    `<span class="math-display">${tex(tokens[idx].content, true)}</span>`
  md.renderer.rules.math_block = (tokens, idx) =>
    `<div class="math-block">${tex(tokens[idx].content, true)}</div>\n`
}

const md = new MarkdownIt({ html: true, linkify: false, typographer: false })
md.use(mathPlugin)

// Liens externes : nouvel onglet, sans transmettre la page d'origine
const renderLinkOpen =
  md.renderer.rules.link_open ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') || ''
  if (/^https?:\/\//i.test(href)) {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
  }
  return renderLinkOpen(tokens, idx, options, env, self)
}

/** Article complet (Markdown + formules) → HTML */
export const renderMarkdown = (source) => md.render(source)

const inlineCache = new Map()

/** Texte court (titre, libellé…) : Markdown en ligne + formules → HTML */
export function renderInline(source = '') {
  let html = inlineCache.get(source)
  if (html === undefined) {
    if (inlineCache.size > 500) inlineCache.clear()
    html = md.renderInline(source)
    inlineCache.set(source, html)
  }
  return html
}
