/**
 * Mini-interpréteur « Python » pour l'invite de commande : nombres, chaînes,
 * variables, arithmétique, quelques fonctions et print(). Aucun eval() :
 * un analyseur par descente récursive, borné, qui ne touche qu'à ses valeurs.
 */

const VERSION = '3.12.4'
export const PY_VERSION = VERSION
export const PY_BANNER = [
  `Python ${VERSION} (tags/v${VERSION}:8e8a4ba, Jun  6 2024, 19:30:16) [MSC v.1940 64 bit (AMD64)] on win32`,
  'Type "help", "copyright", "credits" or "license" for more information.',
]

class PyError extends Error {
  constructor(kind, msg) {
    super(`${kind}: ${msg}`)
    this.kind = kind
  }
}

/* ---------- Lexique ---------- */
function tokenize(src) {
  const out = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (ch === ' ' || ch === '\t') {
      i += 1
      continue
    }
    if (/[0-9.]/.test(ch) && (ch !== '.' || /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = /^(\d+\.\d*|\.\d+|\d+)(e[+-]?\d+)?/i.exec(src.slice(i))
      out.push({ t: 'num', v: Number(m[0]) })
      i += m[0].length
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))
      out.push({ t: 'id', v: m[0] })
      i += m[0].length
      continue
    }
    if (ch === '"' || ch === "'") {
      const end = src.indexOf(ch, i + 1)
      if (end < 0) throw new PyError('SyntaxError', 'unterminated string literal')
      out.push({ t: 'str', v: src.slice(i + 1, end) })
      i = end + 1
      continue
    }
    const two = src.slice(i, i + 2)
    if (['**', '//', '==', '!=', '<=', '>='].includes(two)) {
      out.push({ t: 'op', v: two })
      i += 2
      continue
    }
    if ('+-*/%()[],=<>'.includes(ch)) {
      out.push({ t: 'op', v: ch })
      i += 1
      continue
    }
    throw new PyError('SyntaxError', 'invalid syntax')
  }
  return out
}

/* ---------- Valeurs ---------- */
const isStr = (v) => typeof v === 'string'
const isList = (v) => Array.isArray(v)

function repr(v) {
  if (v === null) return 'None'
  if (v === true) return 'True'
  if (v === false) return 'False'
  if (isStr(v)) return `'${v}'`
  if (isList(v)) return `[${v.map(repr).join(', ')}]`
  if (Number.isInteger(v)) return String(v)
  return String(Number(v.toFixed(12)))
}
const str = (v) => (isStr(v) ? v : repr(v))

const FUNCS = {
  print: (args) => ({ out: args.map(str).join(' '), value: null }),
  len: ([v]) => (isStr(v) || isList(v) ? v.length : raise('TypeError', `object of type '${typeName(v)}' has no len()`)),
  abs: ([v]) => Math.abs(num(v)),
  round: ([v, n = 0]) => Number(num(v).toFixed(num(n))),
  min: (a) => Math.min(...(a.length === 1 && isList(a[0]) ? a[0] : a).map(num)),
  max: (a) => Math.max(...(a.length === 1 && isList(a[0]) ? a[0] : a).map(num)),
  sum: ([v]) => (isList(v) ? v.reduce((s, x) => s + num(x), 0) : raise('TypeError', "'int' object is not iterable")),
  int: ([v]) => (isStr(v) ? (Number.isNaN(Number(v)) ? raise('ValueError', `invalid literal for int() with base 10: '${v}'`) : Math.trunc(Number(v))) : Math.trunc(num(v))),
  float: ([v]) => (isStr(v) ? (Number.isNaN(Number(v)) ? raise('ValueError', `could not convert string to float: '${v}'`) : Number(v)) : num(v)),
  str: ([v]) => str(v),
  range: ([a, b]) => {
    const [from, to] = b === undefined ? [0, num(a)] : [num(a), num(b)]
    if (to - from > 1000) throw new PyError('MemoryError', 'range too large for this toy interpreter')
    return Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i)
  },
  type: ([v]) => `<class '${typeName(v)}'>`,
  sqrt: ([v]) => Math.sqrt(num(v)),
}
const typeName = (v) => (isStr(v) ? 'str' : isList(v) ? 'list' : v === null ? 'NoneType' : typeof v === 'boolean' ? 'bool' : Number.isInteger(v) ? 'int' : 'float')
function raise(kind, msg) {
  throw new PyError(kind, msg)
}
function num(v) {
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  throw new PyError('TypeError', `unsupported operand type(s): '${typeName(v)}'`)
}

/* ---------- Analyse ---------- */
function parser(tokens, scope) {
  let pos = 0
  const peek = () => tokens[pos]
  const next = () => tokens[pos++]
  const accept = (v) => (peek()?.t === 'op' && peek().v === v ? (pos++, true) : false)
  const expect = (v) => {
    if (!accept(v)) throw new PyError('SyntaxError', 'invalid syntax')
  }
  const binary = (ops, below) => () => {
    let left = below()
    for (;;) {
      const tk = peek()
      if (!tk || tk.t !== 'op' || !ops.includes(tk.v)) return left
      next()
      left = apply(tk.v, left, below())
    }
  }
  function apply(op, a, b) {
    if (op === '+') {
      if (isStr(a) && isStr(b)) return a + b
      if (isList(a) && isList(b)) return [...a, ...b]
      if (isStr(a) !== isStr(b)) throw new PyError('TypeError', `can only concatenate ${typeName(a)} (not "${typeName(b)}") to ${typeName(a)}`)
      return num(a) + num(b)
    }
    if (op === '*' && (isStr(a) || isStr(b))) {
      const [s, n] = isStr(a) ? [a, b] : [b, a]
      return s.repeat(Math.max(0, Math.trunc(num(n))))
    }
    if (op === '==') return a === b
    if (op === '!=') return a !== b
    if (op === '<') return num(a) < num(b)
    if (op === '>') return num(a) > num(b)
    if (op === '<=') return num(a) <= num(b)
    if (op === '>=') return num(a) >= num(b)
    const x = num(a)
    const y = num(b)
    switch (op) {
      case '-':
        return x - y
      case '*':
        return x * y
      case '/':
        if (y === 0) throw new PyError('ZeroDivisionError', 'division by zero')
        return x / y
      case '//':
        if (y === 0) throw new PyError('ZeroDivisionError', 'integer division or modulo by zero')
        return Math.floor(x / y)
      case '%':
        if (y === 0) throw new PyError('ZeroDivisionError', 'integer modulo by zero')
        return ((x % y) + y) % y
      case '**':
        return x ** y
      default:
        throw new PyError('SyntaxError', 'invalid syntax')
    }
  }
  function atom() {
    const tk = next()
    if (!tk) throw new PyError('SyntaxError', 'invalid syntax')
    if (tk.t === 'num') return tk.v
    if (tk.t === 'str') return tk.v
    if (tk.t === 'op' && tk.v === '(') {
      const v = expr()
      expect(')')
      return v
    }
    if (tk.t === 'op' && tk.v === '[') {
      const items = []
      if (!accept(']')) {
        do items.push(expr())
        while (accept(','))
        expect(']')
      }
      return items
    }
    if (tk.t === 'op' && tk.v === '-') return -num(unary())
    if (tk.t === 'id') {
      if (tk.v === 'True') return true
      if (tk.v === 'False') return false
      if (tk.v === 'None') return null
      if (accept('(')) {
        const args = []
        if (!accept(')')) {
          do args.push(expr())
          while (accept(','))
          expect(')')
        }
        const fn = FUNCS[tk.v]
        if (!fn) throw new PyError('NameError', `name '${tk.v}' is not defined`)
        const r = fn(args)
        if (r && typeof r === 'object' && 'out' in r) {
          output.push(r.out)
          return r.value
        }
        return r
      }
      if (!(tk.v in scope)) throw new PyError('NameError', `name '${tk.v}' is not defined`)
      return scope[tk.v]
    }
    throw new PyError('SyntaxError', 'invalid syntax')
  }
  function unary() {
    if (accept('-')) return -num(unary())
    if (accept('+')) return num(unary())
    return power()
  }
  function power() {
    const base = atom()
    if (accept('**')) return num(base) ** num(unary())
    return base
  }
  const term = binary(['*', '/', '//', '%'], unary)
  const arith = binary(['+', '-'], term)
  const expr = binary(['==', '!=', '<', '>', '<=', '>='], arith)
  const output = []
  return {
    output,
    statement() {
      // affectation : nom = expression
      if (tokens[0]?.t === 'id' && tokens[1]?.t === 'op' && tokens[1].v === '=' && tokens[2]?.v !== '=') {
        pos = 2
        scope[tokens[0].v] = expr()
        if (pos !== tokens.length) throw new PyError('SyntaxError', 'invalid syntax')
        return { value: null, assigned: true }
      }
      const value = expr()
      if (pos !== tokens.length) throw new PyError('SyntaxError', 'invalid syntax')
      return { value, assigned: false }
    },
  }
}

/** Session interactive : exec(ligne) → { lines, done } */
export function createPython() {
  const scope = {}
  return {
    exec(line) {
      const src = line.trim()
      if (!src) return { lines: [] }
      if (/^(exit|quit)\(\)$/.test(src)) return { lines: [], done: true }
      if (/^(exit|quit)$/.test(src)) return { lines: [`Use ${src}() or Ctrl-Z plus Return to exit`] }
      if (/^help(\(\))?$/.test(src)) return { lines: ['Toy interpreter: numbers, strings, lists, variables, + - * / // % **, print(), len(), abs(), round(), min(), max(), sum(), range(), int(), float(), str(), sqrt(). exit() to leave.'] }
      if (/^(import|from)\s/.test(src)) {
        const mod = src.split(/\s+/)[1]
        return { lines: mod === 'this' ? ['The Zen of Python, by Tim Peters', '', 'Beautiful is better than ugly.', 'Explicit is better than implicit.', 'Simple is better than complex.'] : [] }
      }
      if (src.startsWith('#')) return { lines: [] }
      try {
        const p = parser(tokenize(src), scope)
        const { value, assigned } = p.statement()
        const lines = [...p.output]
        if (!assigned && value !== null && value !== undefined) lines.push(repr(value))
        return { lines }
      } catch (e) {
        if (e instanceof PyError) return { lines: ['Traceback (most recent call last):', '  File "<stdin>", line 1, in <module>', e.message], error: true }
        return { lines: ['Traceback (most recent call last):', '  File "<stdin>", line 1, in <module>', 'RuntimeError: toy interpreter error'], error: true }
      }
    },
  }
}
