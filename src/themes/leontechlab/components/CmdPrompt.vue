<script setup>
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useThemes } from '../../../core/themes.js'
import { hash } from '../pixel.js'
import { t, themeLabel, useLeon } from '../i18n.js'
import { moisCourt } from '../format.js'
import { createPython, PY_BANNER, PY_VERSION } from '../pyrepl.js'

/**
 * Invite de commande de la console : C:\LEONTECHLAB> help, dir, open 3, lang en…
 * Chaque commande accepte son nom anglais et son nom français.
 *
 * « install python » joue une vraie installation : résolution, téléchargement
 * avec barre de progression, vérification, étapes. Rien n'est téléchargé ni
 * installé pour de vrai : c'est une simulation, mémorisée dans le navigateur
 * pour que « python --version » réponde ensuite. pip, npm, apt, winget et
 * brew impriment leur sortie habituelle ; « python » ouvre un petit
 * interpréteur (pyrepl.js). Ctrl+C interrompt ce qui tourne.
 *
 * Sur téléphone, la fenêtre s'ouvre en haut de l'écran pour rester au-dessus
 * du clavier.
 */
const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const router = useRouter()
const leon = inject('leon')
const { themes, active, setTheme, number } = useThemes()
const { lang, setLang, content } = useLeon()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const PROMPT = 'C:\\LEONTECHLAB>'
const lines = ref([]) // { text, tone : in | out | ok | err | dim | warn }
const input = ref('')
const field = ref(null)
const screen = ref(null)
const history = []
let recall = -1

/** Mode : invite DOS, ou session Python */
const mode = ref('cmd')
let py = null
const prompt = computed(() => (mode.value === 'python' ? '>>>' : PROMPT))

/* ---------- Catalogue de la simulation ---------- */
const APPS = {
  python: { v: '3.12.4', mb: 25.3, file: 'python-3.12.4-amd64.exe', by: 'Python Software Foundation', id: 'Python.Python.3.12', dir: 'Python312' },
  node: { v: '22.11.0', mb: 31.6, file: 'node-v22.11.0-x64.msi', by: 'OpenJS Foundation', id: 'OpenJS.NodeJS.LTS', dir: 'nodejs' },
  git: { v: '2.47.0', mb: 62.1, file: 'Git-2.47.0-64-bit.exe', by: 'The Git Development Community', id: 'Git.Git', dir: 'Git' },
  docker: { v: '27.3.1', mb: 580.2, file: 'Docker Desktop Installer.exe', by: 'Docker Inc.', id: 'Docker.DockerDesktop', dir: 'Docker' },
  code: { v: '1.95.2', mb: 96.4, file: 'VSCodeUserSetup-x64-1.95.2.exe', by: 'Microsoft Corporation', id: 'Microsoft.VisualStudioCode', dir: 'Microsoft VS Code' },
  nginx: { v: '1.27.2', mb: 1.9, file: 'nginx-1.27.2.zip', by: 'F5, Inc.', id: 'nginx', dir: 'nginx' },
  rust: { v: '1.82.0', mb: 7.4, file: 'rustup-init.exe', by: 'Rust Foundation', id: 'Rustlang.Rustup', dir: 'Rust' },
  go: { v: '1.23.2', mb: 74.3, file: 'go1.23.2.windows-amd64.msi', by: 'Google LLC', id: 'GoLang.Go', dir: 'Go' },
  java: { v: '21.0.5', mb: 190.4, file: 'OpenJDK21U-jdk_x64_windows_hotspot_21.0.5_11.msi', by: 'Eclipse Adoptium', id: 'EclipseAdoptium.Temurin.21.JDK', dir: 'Eclipse Adoptium' },
  mysql: { v: '8.4.3', mb: 520.7, file: 'mysql-installer-community-8.4.3.0.msi', by: 'Oracle Corporation', id: 'Oracle.MySQL', dir: 'MySQL' },
  ffmpeg: { v: '7.1', mb: 120.8, file: 'ffmpeg-7.1-essentials_build.zip', by: 'FFmpeg team', id: 'Gyan.FFmpeg', dir: 'ffmpeg' },
  curl: { v: '8.11.0', mb: 6.2, file: 'curl-8.11.0_1-win64-mingw.zip', by: 'Daniel Stenberg', id: 'cURL.cURL', dir: 'curl' },
  vim: { v: '9.1.0821', mb: 10.4, file: 'gvim_9.1.0821_x64.exe', by: 'Bram Moolenaar et al.', id: 'vim.vim', dir: 'Vim' },
  cmake: { v: '3.31.0', mb: 42.5, file: 'cmake-3.31.0-windows-x86_64.msi', by: 'Kitware', id: 'Kitware.CMake', dir: 'CMake' },
}
const APP_ALIAS = { python3: 'python', py: 'python', nodejs: 'node', vscode: 'code', golang: 'go', openjdk: 'java', jdk: 'java', rustup: 'rust', 'docker-desktop': 'docker' }
const PIP = {
  numpy: ['2.1.3', 16.0],
  pandas: ['2.2.3', 12.5],
  torch: ['2.5.1', 203.1],
  transformers: ['4.46.2', 10.0],
  'openai-whisper': ['20240930', 0.8],
  fastapi: ['0.115.4', 0.09],
  flask: ['3.0.3', 0.1],
  scipy: ['1.14.1', 44.5],
  matplotlib: ['3.9.2', 7.8],
  jupyter: ['1.1.1', 0.01],
  requests: ['2.32.3', 0.06],
  'scikit-learn': ['1.5.2', 11.0],
  tensorflow: ['2.18.0', 615.4],
  librosa: ['0.10.2', 0.26],
  peft: ['0.13.2', 0.3],
  uvicorn: ['0.32.0', 0.06],
}
const PIP_ALIAS = { whisper: 'openai-whisper', sklearn: 'scikit-learn', pytorch: 'torch' }
const NPM = { vue: '3.5.13', vite: '6.0.1', three: '0.170.0', tailwindcss: '3.4.15', react: '18.3.1', express: '4.21.1', katex: '0.16.11', 'markdown-it': '14.1.0', typescript: '5.6.3', eslint: '9.14.0', axios: '1.7.7', lodash: '4.17.21' }

/** Version et taille plausibles pour un nom inconnu : les mêmes à chaque fois */
function guess(name) {
  const h = Math.floor(hash(name.length * 7919, [...name].reduce((s, c) => s + c.charCodeAt(0), 0)) * 1e6)
  return { v: `${1 + (h % 4)}.${h % 12}.${h % 9}`, mb: Math.round((2 + (h % 580) / 10) * 10) / 10 }
}
function app(name) {
  const key = APP_ALIAS[name] ?? name
  const known = APPS[key]
  if (known) return { key, ...known }
  const g = guess(key)
  const cap = key.charAt(0).toUpperCase() + key.slice(1)
  return { key, v: g.v, mb: g.mb, file: `${key}-${g.v}-setup.exe`, by: `${cap} Project`, id: `${cap}.${cap}`, dir: cap }
}

/* ---------- Ce qui est « installé », mémorisé dans le navigateur ---------- */
const STORE = 'leon:cmd-installed'
function load() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORE) ?? '{}')
    return { apps: raw.apps ?? {}, pip: raw.pip ?? {}, npm: raw.npm ?? {} }
  } catch {
    return { apps: {}, pip: {}, npm: {} }
  }
}
const installed = load()
function remember() {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(installed))
  } catch {
    /* stockage bloqué : la simulation ne survivra pas au rechargement */
  }
}

/* ---------- Écran ---------- */
function print(text, tone = 'out') {
  lines.value.push({ text, tone })
  return lines.value.length - 1
}
function setLine(i, text, tone) {
  const l = lines.value[i]
  if (!l) return
  l.text = text
  if (tone) l.tone = tone
}
async function scrollDown() {
  await nextTick()
  if (screen.value) screen.value.scrollTop = screen.value.scrollHeight
}
function banner() {
  const p = content.value.profile
  print(t('cmd.banner'), 'ok')
  print(t('cmd.rights', { name: p.name, handle: p.handle }), 'dim')
  print('')
  print(t('cmd.hint'))
}

/* ---------- Tâches longues (installations) ---------- */
const busy = ref(false)
let job = null
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduced ? Math.ceil(ms / 3) : ms))
const fmtMb = (v) => (v >= 100 ? v.toFixed(0) : v.toFixed(1))

/** Animation de téléchargement : render(k, mbDone, speed) écrit la ligne de progression */
async function progress(mb, render, tone = 'out') {
  const dur = 1100 + Math.min(2400, mb * 9)
  const speed = (mb / (dur / 1000)) * (0.85 + hash(Math.round(mb * 10), 3) * 0.3)
  const start = performance.now()
  const idx = print('', tone)
  for (;;) {
    if (job.cancelled) return false
    const k = Math.min(1, (performance.now() - start) / (reduced ? dur / 3 : dur))
    const eased = k >= 1 ? 1 : Math.min(0.99, k * (2 - k) * (0.96 + 0.04 * Math.sin(k * 40)))
    setLine(idx, render(eased, eased * mb, speed * (0.9 + 0.2 * Math.sin(k * 23))))
    scrollDown()
    if (k >= 1) return true
    await wait(90)
  }
}
/* Largeur des barres selon l'écran : ~44 colonnes sur un téléphone, une ligne doit suffire */
const narrow = () => window.innerWidth < 640
const BAR = () => (narrow() ? 12 : 30)
const bar = (k, w = BAR(), on = '█', off = '░') => on.repeat(Math.round(k * w)) + off.repeat(w - Math.round(k * w))

async function longTask(fn) {
  if (busy.value) return
  busy.value = true
  job = { cancelled: false }
  try {
    await fn()
  } finally {
    busy.value = false
    job = null
    scrollDown()
  }
}

/* ---------- Installations ---------- */
async function installGeneric(name) {
  const a = app(name)
  if (installed.apps[a.key]) return print(t('cmd.ins.already', { x: a.key, v: installed.apps[a.key] }), 'warn')
  await longTask(async () => {
    print(t('cmd.ins.resolving', { x: a.key }), 'dim')
    await wait(500)
    if (job.cancelled) return
    print(t('cmd.ins.found', { x: a.key, v: a.v, by: a.by }))
    print(t('cmd.ins.downloading', { f: a.file }))
    const ok = await progress(a.mb, (k, done, speed) =>
      narrow()
        ? `  [${bar(k)}] ${String(Math.round(k * 100)).padStart(3)} %  ${fmtMb(done)}/${fmtMb(a.mb)} MB`
        : `  [${bar(k)}] ${String(Math.round(k * 100)).padStart(3)} %   ${fmtMb(done)} / ${fmtMb(a.mb)} MB   ${speed.toFixed(1)} MB/s`,
    )
    if (!ok) return
    const v = print(t('cmd.ins.verifying'), 'dim')
    await wait(450)
    if (job.cancelled) return
    setLine(v, `${t('cmd.ins.verifying')} ${t('cmd.ins.verified')}`, 'dim')
    print(t('cmd.ins.installing', { x: a.key, v: a.v }))
    for (const step of t('cmd.ins.steps')) {
      const text = step.replace('{dir}', a.dir)
      const i = print(`  [ ] ${text}`, 'dim')
      await wait(380)
      if (job.cancelled) return
      setLine(i, `  [x] ${text}`, 'out')
    }
    installed.apps[a.key] = a.v
    remember()
    print(t('cmd.ins.done', { x: a.key, v: a.v }), 'ok')
    print(t('cmd.ins.try', { x: a.key }), 'dim')
  })
}

async function installWinget(name) {
  const a = app(name)
  await longTask(async () => {
    print(`Found ${a.key} [${a.id}] Version ${a.v}`)
    print('This application is licensed to you by its owner.', 'dim')
    print('Microsoft is not responsible for, nor does it grant any licenses to, third-party packages.', 'dim')
    print(`Downloading https://download.${a.key}.org/${a.v}/${a.file}`)
    const ok = await progress(a.mb, (k, done) => `  ${bar(k, BAR(), '█', ' ')}  ${fmtMb(done)} MB / ${fmtMb(a.mb)} MB`)
    if (!ok) return
    print('Successfully verified installer hash', 'ok')
    print('Starting package install...')
    await wait(900)
    if (job.cancelled) return
    installed.apps[a.key] = a.v
    remember()
    print('Successfully installed', 'ok')
  })
}

async function installApt(names) {
  await longTask(async () => {
    for (const text of ['Reading package lists... Done', 'Building dependency tree... Done', 'Reading state information... Done']) {
      print(text)
      await wait(260)
      if (job.cancelled) return
    }
    const pkgs = names.map((n) => app(n))
    print('The following NEW packages will be installed:')
    print(`  ${pkgs.map((p) => p.key).join(' ')}`)
    const total = pkgs.reduce((s, p) => s + p.mb, 0)
    print(`0 upgraded, ${pkgs.length} newly installed, 0 to remove and 0 not upgraded.`)
    print(`Need to get ${fmtMb(total)} MB of archives.`)
    print(`After this operation, ${fmtMb(total * 3.9)} MB of additional disk space will be used.`)
    const t0 = performance.now()
    for (const [i, p] of pkgs.entries()) {
      const line = print(`Get:${i + 1} http://deb.debian.org/debian bookworm/main amd64 ${p.key} amd64 ${p.v}-1 [${fmtMb(p.mb)} MB]`)
      const ok = await progress(p.mb, (k) => `${lines.value[line].text}  ${Math.round(k * 100)}%`)
      if (!ok) return
      setLine(line, `Get:${i + 1} http://deb.debian.org/debian bookworm/main amd64 ${p.key} amd64 ${p.v}-1 [${fmtMb(p.mb)} MB]`)
      lines.value.pop()
    }
    const secs = Math.max(1, Math.round((performance.now() - t0) / 1000))
    print(`Fetched ${fmtMb(total)} MB in ${secs}s (${fmtMb(total / secs)} MB/s)`)
    for (const p of pkgs) {
      print(`Selecting previously unselected package ${p.key}.`)
      print(`Unpacking ${p.key} (${p.v}-1) ...`)
      await wait(350)
      if (job.cancelled) return
      print(`Setting up ${p.key} (${p.v}-1) ...`)
      installed.apps[p.key] = p.v
    }
    remember()
    print('Processing triggers for man-db (2.11.2-2) ...', 'dim')
  })
}

async function installBrew(name) {
  const a = app(name)
  await longTask(async () => {
    print(`==> Downloading https://ghcr.io/v2/homebrew/core/${a.key}/manifests/${a.v}`, 'ok')
    await wait(500)
    if (job.cancelled) return
    print(`==> Fetching ${a.key}`, 'ok')
    print(`==> Downloading https://ghcr.io/v2/homebrew/core/${a.key}/blobs/sha256:${hash(a.key.length, 9).toString(16).slice(2, 14)}…`, 'ok')
    const ok = await progress(a.mb, (k) => `${'#'.repeat(Math.round(k * (narrow() ? 30 : 72)))} ${(k * 100).toFixed(1)}%`)
    if (!ok) return
    print(`==> Pouring ${a.key}--${a.v}.arm64_sonoma.bottle.tar.gz`, 'ok')
    await wait(600)
    if (job.cancelled) return
    installed.apps[a.key] = a.v
    remember()
    print(`🍺  /opt/homebrew/Cellar/${a.key}/${a.v}: ${(1200 + Math.round(a.mb * 37)).toLocaleString('en-US')} files, ${fmtMb(a.mb * 2.4)}MB`)
  })
}

async function pipInstall(names) {
  if (!installed.apps.python) return print(t('cmd.ins.needs', { tool: 'pip', dep: 'python' }), 'err')
  if (!names.length) return print('ERROR: You must give at least one requirement to install (see "pip help install")', 'err')
  await longTask(async () => {
    const done = []
    for (const raw of names) {
      const key = PIP_ALIAS[raw.toLowerCase()] ?? raw.toLowerCase()
      const [v, mb] = PIP[key] ?? [guess(key).v, guess(key).mb / 10]
      if (installed.pip[key]) {
        print(`Requirement already satisfied: ${key} in c:\\python312\\lib\\site-packages (${installed.pip[key]})`)
        continue
      }
      const wheel = `${key.replace(/-/g, '_')}-${v}-cp312-cp312-win_amd64.whl`
      print(`Collecting ${key}`)
      print(`  Downloading ${wheel}.metadata (${Math.round(20 + hash(key.length, 2) * 60)} kB)`, 'dim')
      await wait(400)
      if (job.cancelled) return
      print(`Downloading ${wheel} (${fmtMb(mb)} MB)`)
      const ok = await progress(mb, (k, got, speed) => {
        const w = narrow() ? 16 : 40
        const f = Math.round(k * w)
        const eta = Math.max(0, Math.round(((1 - k) * mb) / speed))
        return `   ${'━'.repeat(f)}${f < w ? '╸' : ''}${'─'.repeat(Math.max(0, w - f - 1))} ${fmtMb(got)}/${fmtMb(mb)} MB ${speed.toFixed(1)} MB/s eta 0:00:${String(eta).padStart(2, '0')}`
      })
      if (!ok) return
      done.push([key, v])
    }
    if (!done.length) return
    print(`Installing collected packages: ${done.map(([k]) => k).join(', ')}`)
    await wait(700)
    if (job.cancelled) return
    for (const [k, v] of done) installed.pip[k] = v
    remember()
    print(`Successfully installed ${done.map(([k, v]) => `${k}-${v}`).join(' ')}`, 'ok')
  })
}

async function npmInstall(names) {
  if (!installed.apps.node) return print(t('cmd.ins.needs', { tool: 'npm', dep: 'node' }), 'err')
  await longTask(async () => {
    const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    const pkgs = names.length ? names : ['(package.json)']
    const idx = print('', 'dim')
    const t0 = performance.now()
    const dur = reduced ? 500 : 1500 + pkgs.length * 400
    let i = 0
    while (performance.now() - t0 < dur) {
      if (job.cancelled) return
      const p = pkgs[i % pkgs.length]
      setLine(idx, `${SPIN[i % SPIN.length]} ${['idealTree', 'reify', 'fetch'][Math.floor(i / 4) % 3]}:${p}: ${i % 2 ? 'timing' : 'http fetch GET 200'} https://registry.npmjs.org/${p}`)
      i += 1
      await wait(110)
    }
    lines.value.splice(idx, 1)
    let added = 0
    for (const raw of pkgs) {
      const key = raw.toLowerCase()
      installed.npm[key] = NPM[key] ?? guess(key).v
      added += 1 + Math.round(hash(key.length, 5) * 40)
    }
    remember()
    const secs = Math.max(1, Math.round((performance.now() - t0) / 1000))
    print(`added ${added} packages, and audited ${added + 1} packages in ${secs}s`)
    print('')
    print(`${Math.round(added / 6)} packages are looking for funding`)
    print('  run `npm fund` for details', 'dim')
    print('')
    print('found 0 vulnerabilities', 'ok')
  })
}

function uninstall(name) {
  const key = APP_ALIAS[name] ?? name
  if (installed.apps[key]) {
    delete installed.apps[key]
    if (key === 'python') installed.pip = {}
    if (key === 'node') installed.npm = {}
    remember()
    return print(t('cmd.ins.removed', { x: key }), 'ok')
  }
  if (installed.pip[key]) {
    delete installed.pip[key]
    remember()
    return print(`Successfully uninstalled ${key}`, 'ok')
  }
  print(t('cmd.ins.notInstalled', { x: key }), 'err')
}

/** Réponse de « <programme> --version », ou null si rien n'est installé sous ce nom */
function versionOf(word, args) {
  const key = APP_ALIAS[word] ?? word
  const v = installed.apps[key]
  const asking = /^(-v|-V|--version|version)$/.test(args)
  if (word === 'pip' || word === 'pip3') {
    if (!installed.apps.python) return { text: t('cmd.ins.needs', { tool: 'pip', dep: 'python' }), tone: 'err' }
    if (args === 'list') {
      const rows = Object.entries(installed.pip)
      return { text: ['Package    Version', '---------- -------', ...rows.map(([k, ver]) => `${k.padEnd(10)} ${ver}`), ...(rows.length ? [] : ['(empty)'])].join('\n') }
    }
    return { text: 'pip 24.3.1 from C:\\Python312\\Lib\\site-packages\\pip (python 3.12)' }
  }
  if (word === 'npm' && installed.apps.node) return { text: args === 'list' || args === 'ls' ? ['leontechlab@1.1.0', ...Object.entries(installed.npm).map(([k, ver]) => `├── ${k}@${ver}`)].join('\n') : '10.9.0' }
  if (!v) return null
  if (!asking) return { text: `${key} ${v}` }
  switch (key) {
    case 'python':
      return { text: `Python ${PY_VERSION}` }
    case 'node':
      return { text: `v${v}` }
    case 'git':
      return { text: `git version ${v}.windows.1` }
    case 'docker':
      return { text: `Docker version ${v}, build ce12230` }
    case 'go':
      return { text: `go version go${v} windows/amd64` }
    case 'java':
      return { text: `openjdk ${v} 2024-10-15 LTS` }
    default:
      return { text: `${key} ${v}` }
  }
}

/* ---------- Session Python ---------- */
function startPython(args) {
  if (!installed.apps.python) return print(t('cmd.ins.needs', { tool: 'python', dep: 'python' }), 'err')
  if (/^(-V|--version)$/.test(args)) return print(`Python ${PY_VERSION}`)
  if (args.startsWith('-c ')) {
    const code = args.slice(3).trim().replace(/^(['"])(.*)\1$/, '$2')
    const once = createPython()
    for (const l of once.exec(code).lines) print(l)
    return
  }
  if (args) return print(`python: can't open file 'C:\\\\LEONTECHLAB\\\\${args}': [Errno 2] No such file or directory`, 'err')
  py = createPython()
  mode.value = 'python'
  for (const l of PY_BANNER) print(l)
}
function runPython(line) {
  print(`>>> ${line}`, 'in')
  const r = py.exec(line)
  for (const l of r.lines) print(l, r.error ? 'err' : 'out')
  if (r.done) {
    mode.value = 'cmd'
    py = null
  }
}

/* ---------- Ping ---------- */
async function ping(host) {
  if (!host) return print(t('cmd.ins.pingUsage'), 'err')
  const ip = [140, 82, 112 + Math.floor(hash(host.length, 1) * 20), Math.floor(hash(host.length, 2) * 254)].join('.')
  await longTask(async () => {
    print(`Pinging ${host} [${ip}] with 32 bytes of data:`)
    const times = []
    for (let i = 0; i < 4; i++) {
      await wait(650)
      if (job.cancelled) return
      const ms = 28 + Math.round(hash(i, host.length) * 30)
      times.push(ms)
      print(`Reply from ${ip}: bytes=32 time=${ms}ms TTL=52`)
    }
    print('')
    print(`Ping statistics for ${ip}:`)
    print('    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),')
    print(`Approximate round trip times in milli-seconds:`)
    print(`    Minimum = ${Math.min(...times)}ms, Maximum = ${Math.max(...times)}ms, Average = ${Math.round(times.reduce((a, b) => a + b) / 4)}ms`)
  })
}

/* ---------- Commandes ---------- */
const PAGES = {
  home: { to: { name: 'home' }, alias: ['home', 'accueil', '~', '\\', '/', '..'] },
  articles: { to: { name: 'articles' }, alias: ['articles', 'blog', 'archives'] },
  projects: { to: { name: 'projects' }, alias: ['projects', 'projets', 'repos', 'depots', 'dépôts'] },
  research: { to: { name: 'lab', params: { module: 'glitch' } }, alias: ['lab', 'labo', 'research', 'recherche', 'cyberlab'] },
  about: { to: { name: 'about' }, alias: ['about', 'apropos', 'propos', 'parcours', 'cv'] },
  contact: { to: { name: 'about', hash: '#contact' }, alias: ['contact', 'mail', 'email', 'courriel'] },
}
const COMMANDS = {
  help: ['help', 'aide', '?', 'h'],
  dir: ['dir', 'ls', 'list', 'liste'],
  open: ['open', 'ouvrir', 'type', 'cat', 'read', 'lire'],
  search: ['search', 'find', 'cherche', 'chercher', 'grep'],
  cd: ['cd', 'go', 'aller'],
  lang: ['lang', 'langue', 'language'],
  theme: ['theme', 'forme', 'form'],
  whoami: ['whoami', 'qui'],
  date: ['date', 'time', 'heure'],
  launch: ['launch', 'decollage', 'décollage', 'liftoff', 'fire'],
  github: ['github', 'gh'],
  random: ['random', 'hasard'],
  history: ['history', 'historique'],
  cls: ['cls', 'clear', 'effacer'],
  exit: ['exit', 'quit', 'quitter', 'close'],
  ver: ['ver', 'version'],
  echo: ['echo'],
  install: ['install', 'installer', 'setup', 'choco', 'scoop'],
  winget: ['winget'],
  apt: ['apt', 'apt-get', 'dnf', 'yum', 'pacman'],
  brew: ['brew'],
  pip: ['pip', 'pip3'],
  npm: ['npm', 'pnpm', 'yarn'],
  python: ['python', 'python3', 'py'],
  uninstall: ['uninstall', 'remove', 'desinstaller', 'désinstaller'],
  ping: ['ping'],
  installed: ['installed', 'packages', 'programmes'],
}
const commandOf = (word) => Object.keys(COMMANDS).find((key) => COMMANDS[key].includes(word))
const pageOf = (word) => Object.entries(PAGES).find(([, page]) => page.alias.includes(word))
const NAMES = [...Object.values(COMMANDS).map((list) => list[0]), ...Object.values(PAGES).map((page) => page.alias[0])]

const chips = computed(() => ['help', 'install python', 'dir', lang.value === 'fr' ? 'lang en' : 'lang fr', 'launch', 'cls'])

const articles = () => content.value.articles
const short = (text, max = 52) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)
function findArticle(arg) {
  const n = Number(arg)
  if (Number.isInteger(n) && n >= 1 && n <= articles().length) return articles()[n - 1]
  return articles().find((a) => a.slug === arg) ?? null
}
function go(key, to) {
  print(t('cmd.cdDone', { x: t(`nav.${key}`) }), 'ok')
  router.push(to)
  emit('close')
}

function run(raw) {
  let line = raw.trim()
  print(`${PROMPT}${line}`, 'in')
  if (!line) return
  history.push(line)
  recall = -1

  // sudo : on demande un mot de passe pour la forme, puis on exécute la suite
  if (/^sudo\s+/i.test(line)) {
    line = line.replace(/^sudo\s+/i, '')
    print(t('cmd.ins.sudo', { handle: content.value.profile.handle }) + ' ********', 'dim')
  }
  const [first, ...rest] = line.split(/\s+/)
  const word = first.toLowerCase()
  const arg = rest.join(' ')
  const cmd = commandOf(word)
  const page = cmd ? null : pageOf(word)
  if (page) return go(page[0], page[1].to)

  switch (cmd) {
    case 'help':
      print(t('cmd.helpTitle'), 'ok')
      for (const [name, what] of t('cmd.helpRows')) print(`  ${name.padEnd(18)} ${what}`)
      break
    case 'dir':
      print(t('cmd.dirHeader'), 'dim')
      print('')
      articles().forEach((a, i) => print(` ${String(i + 1).padStart(2)}  ${moisCourt(a.date, lang.value).padEnd(10)} ${short(a.title)}`))
      print(`${' '.repeat(16)}${t('cmd.dirFooter', { n: articles().length })}`, 'dim')
      break
    case 'open': {
      if (!arg) return print(t('cmd.openUsage'), 'err')
      const article = findArticle(arg)
      if (!article) return print(t('cmd.notFound', { x: arg }), 'err')
      print(t('cmd.opening', { x: article.title }), 'ok')
      router.push({ name: 'article', params: { slug: article.slug } })
      emit('close')
      break
    }
    case 'search': {
      if (!arg) return print(t('cmd.searchUsage'), 'err')
      const q = arg.toLowerCase()
      const hits = articles()
        .map((a, i) => [a, i + 1])
        .filter(([a]) => `${a.title} ${a.abstract} ${a.tag}`.toLowerCase().includes(q))
      if (!hits.length) return print(t('cmd.searchNone', { q: arg }), 'err')
      print(t('cmd.searchHits', { n: hits.length }), 'ok')
      for (const [a, n] of hits) print(` ${String(n).padStart(2)}  ${short(a.title)}`)
      break
    }
    case 'cd': {
      const target = pageOf(arg.toLowerCase())
      if (!target) return print(t('cmd.cdUsage'), arg ? 'err' : 'out')
      go(target[0], target[1].to)
      break
    }
    case 'lang':
      if (!setLang(arg)) return print(`${t('cmd.langUsage')}  [${lang.value}]`, arg ? 'err' : 'out')
      print(t('cmd.langDone'), 'ok')
      break
    case 'theme': {
      if (!arg) {
        print(t('cmd.themeTitle'), 'ok')
        for (const theme of themes) print(` ${number(theme)}. ${themeLabel(theme).name}${theme.id === active.value.id ? '  <' : ''}`)
        return print(t('cmd.themeUsage'), 'dim')
      }
      const theme = themes.find((th) => String(number(th)) === arg || th.id === arg.toLowerCase())
      if (!theme) return print(t('cmd.themeUsage'), 'err')
      print(t('cmd.themeDone', { x: themeLabel(theme).name }), 'ok')
      setTheme(theme.id)
      break
    }
    case 'whoami': {
      const p = content.value.profile
      print(t('cmd.whoami', { name: p.name, handle: p.handle, role: p.role, city: p.city }), 'ok')
      break
    }
    case 'date':
      print(new Date().toLocaleString(t('cmd.locale'), { dateStyle: 'full', timeStyle: 'medium' }))
      break
    case 'launch':
      if (leon.launch()) {
        print(t('cmd.launchDone'), 'ok')
        emit('close')
      } else print(t('cmd.launchNo'), 'err')
      break
    case 'github': {
      const url = content.value.profile.links.github
      print(t('cmd.githubDone', { x: url }), 'ok')
      window.open(url, '_blank', 'noopener')
      break
    }
    case 'random': {
      const list = articles()
      const article = list[Math.floor(Math.random() * list.length)]
      print(t('cmd.randomDone', { x: article.title }), 'ok')
      router.push({ name: 'article', params: { slug: article.slug } })
      emit('close')
      break
    }
    case 'history':
      if (history.length <= 1) return print(t('cmd.historyEmpty'), 'dim')
      history.slice(0, -1).forEach((h, i) => print(` ${String(i + 1).padStart(3)}  ${h}`))
      break
    case 'cls':
      lines.value = []
      break
    case 'exit':
      emit('close')
      break
    case 'ver':
      print(t('cmd.banner'), 'ok')
      break
    case 'echo':
      print(arg)
      break

    /* ---- simulation d'installations ---- */
    case 'install': {
      const name = rest.find((w) => !w.startsWith('-'))
      if (!name) return print(t('cmd.ins.usage'), 'err')
      installGeneric(name.toLowerCase())
      break
    }
    case 'winget': {
      const sub = rest[0]?.toLowerCase()
      const name = rest.slice(1).find((w) => !w.startsWith('-'))
      if (sub === 'install' && name) return installWinget(name.toLowerCase().split('.').pop())
      if (sub === 'list') return print(Object.entries(installed.apps).map(([k, v]) => `${k.padEnd(12)} ${v}`).join('\n') || '(empty)')
      print('usage: winget install <package> | winget list', 'err')
      break
    }
    case 'apt': {
      const sub = rest[0]?.toLowerCase()
      const names = rest.slice(1).filter((w) => !w.startsWith('-'))
      if (sub === 'update') {
        print('Hit:1 http://deb.debian.org/debian bookworm InRelease')
        print('Hit:2 http://security.debian.org/debian-security bookworm-security InRelease')
        return print('Reading package lists... Done')
      }
      if (sub === 'install' && names.length) return installApt(names.map((n) => n.toLowerCase()))
      print(`usage: ${first} install <package> | ${first} update`, 'err')
      break
    }
    case 'brew': {
      const name = rest[0]?.toLowerCase() === 'install' ? rest[1] : null
      if (!name) return print('Usage: brew install <formula>', 'err')
      installBrew(name.toLowerCase())
      break
    }
    case 'pip': {
      const sub = rest[0]?.toLowerCase()
      if (sub === 'install') return pipInstall(rest.slice(1).filter((w) => !w.startsWith('-')))
      if (sub === 'uninstall' && rest[1]) return uninstall(rest[1].toLowerCase())
      const r = versionOf(word, sub ?? '--version')
      print(r.text, r.tone)
      break
    }
    case 'npm': {
      const sub = rest[0]?.toLowerCase()
      if (['install', 'i', 'add'].includes(sub)) return npmInstall(rest.slice(1).filter((w) => !w.startsWith('-')))
      const r = versionOf('npm', sub ?? '-v')
      if (!r) return print(t('cmd.ins.needs', { tool: first, dep: 'node' }), 'err')
      print(r.text, r.tone)
      break
    }
    case 'python':
      startPython(arg)
      break
    case 'uninstall':
      if (!rest[0]) return print(t('cmd.ins.usage').replace('install', 'uninstall'), 'err')
      uninstall(rest[0].toLowerCase())
      break
    case 'ping':
      ping(rest[0])
      break
    case 'installed': {
      const rows = [
        ...Object.entries(installed.apps).map(([k, v]) => `  ${k.padEnd(14)} ${v}`),
        ...Object.entries(installed.pip).map(([k, v]) => `  pip:${k.padEnd(10)} ${v}`),
        ...Object.entries(installed.npm).map(([k, v]) => `  npm:${k.padEnd(10)} ${v}`),
      ]
      print(rows.length ? rows.join('\n') : t('cmd.ins.nothing'), rows.length ? 'out' : 'dim')
      break
    }
    default: {
      // « git --version », « node -v »… pour ce qui a été installé
      const r = versionOf(word, arg)
      if (r) return print(r.text, r.tone)
      if (APPS[APP_ALIAS[word] ?? word]) return print(t('cmd.ins.unknownApp', { cmd: first, x: APP_ALIAS[word] ?? word }), 'err')
      print(t('cmd.unknown', { cmd: first }), 'err')
    }
  }
}

async function submit() {
  const value = input.value
  input.value = ''
  if (busy.value) {
    print(value, 'in') // en attente : la commande s'affiche mais rien ne part
    return scrollDown()
  }
  if (mode.value === 'python') runPython(value)
  else run(value)
  scrollDown()
}
function runChip(value) {
  if (busy.value) return
  input.value = value
  submit()
  field.value?.focus({ preventScroll: true })
}

function interrupt() {
  if (job) {
    job.cancelled = true
    print('^C', 'in')
    print(mode.value === 'python' ? 'KeyboardInterrupt' : t('cmd.ins.cancelled'), 'err')
  } else if (mode.value === 'python') {
    print('KeyboardInterrupt', 'err')
  } else print('^C', 'in')
  input.value = ''
  scrollDown()
}

function onKey(event) {
  if (event.key === 'Escape') {
    event.stopPropagation() // la console se ferme ; la page, elle, ne bouge pas
    emit('close')
  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
    event.preventDefault()
    interrupt()
  } else if (event.ctrlKey && event.key.toLowerCase() === 'l') {
    event.preventDefault()
    lines.value = []
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (!history.length) return
    event.preventDefault()
    recall = event.key === 'ArrowUp' ? (recall < 0 ? history.length - 1 : Math.max(0, recall - 1)) : recall < 0 ? -1 : recall + 1
    if (recall >= history.length) recall = -1
    input.value = recall < 0 ? '' : history[recall]
  } else if (event.key === 'Tab') {
    const value = input.value.trimStart().toLowerCase()
    if (!value || value.includes(' ')) return
    event.preventDefault()
    const found = NAMES.filter((name) => name.startsWith(value))
    if (found.length === 1) input.value = `${found[0]} `
    else if (found.length > 1) {
      print(`${PROMPT}${input.value}`, 'in')
      print(found.join('  '), 'dim')
      scrollDown()
    }
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      if (job) job.cancelled = true
      return
    }
    if (!lines.value.length) banner()
    await nextTick()
    field.value?.focus({ preventScroll: true })
    scrollDown()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (job) job.cancelled = true
})
</script>

<template>
  <div
    v-if="open"
    class="leon-cmd fixed inset-x-1 top-1 z-[75] sm:inset-x-auto sm:bottom-3 sm:left-1/2 sm:top-auto sm:w-[min(52rem,calc(100vw-1.5rem))] sm:-translate-x-1/2"
    role="dialog"
    :aria-label="t('tools.cmd')"
  >
    <div class="leon-cmd-bar">
      <span class="min-w-0 truncate">{{ mode === 'python' ? 'C:\\LEONTECHLAB\\PYTHON.EXE' : t('cmd.title') }}</span>
      <span class="flex items-center gap-2">
        <button v-if="busy" type="button" class="leon-cmd-x" :title="t('cmd.ins.cancelTip')" @click="interrupt">[Ctrl+C]</button>
        <button type="button" class="leon-cmd-x" :aria-label="t('cmd.close')" @click="emit('close')">[X]</button>
      </span>
    </div>
    <div ref="screen" class="leon-cmd-screen" @click="field?.focus({ preventScroll: true })">
      <p v-for="(l, i) in lines" :key="i" :class="`leon-cmd-${l.tone}`">{{ l.text || '\u00a0' }}</p>
      <form class="flex items-baseline" @submit.prevent="submit">
        <label for="leon-cmd-input" class="shrink-0 text-leon-ink">{{ busy ? '' : prompt }}</label>
        <input
          id="leon-cmd-input"
          ref="field"
          v-model="input"
          type="text"
          class="leon-cmd-input"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          enterkeyhint="send"
          :aria-label="t('cmd.input')"
          :aria-busy="busy"
          @keydown="onKey"
        />
      </form>
    </div>
    <div class="leon-cmd-chips">
      <span class="text-leon-dim">{{ t('cmd.quick') }} :</span>
      <button v-for="c in chips" :key="c" type="button" class="leon-btn" :disabled="busy" @click="runChip(c)">{{ c }}</button>
    </div>
  </div>
</template>
