import { reactive } from 'vue'
import { tone } from '../../core/audio.js'

/** Géométries du nœud 3D */
export const SHAPES = [
  { name: 'TESSERACT_CORE', button: '01. TESSERACT', short: '[01] HYPERCUBE', tone: 'cyan' },
  { name: 'ARM_SILICON_EMFI', button: '02. SILICON WAFER', short: '[02] EMFI CHIP', tone: 'rose' },
  { name: 'GITHUB_ORBITAL', button: '03. ORBITAL RING', short: '[03] GITHUB ORBIT', tone: 'emerald' },
  { name: 'KYBER_LATTICE_3D', button: '04. KYBER LATTICE', short: '[04] PQC LATTICE', tone: 'violet' },
]

export const WEAPONS = [
  { name: 'EMP GLITCHER', label: '⚡ FAULTY EMP', color: 0xf43f5e, freq: 880 },
  { name: 'KYBER RAILGUN', label: '🔐 KYBER BEAM', color: 0x00f0ff, freq: 1120 },
  { name: 'MCP SWARM LASER', label: '🛰️ MCP SWARM', color: 0x10b981, freq: 660 },
]

/** Géométrie associée à chaque catégorie d'article et à chaque simulateur */
const CATEGORY_SHAPES = { security: 1, 'speech-ai': 2, industrial: 0 }
export const shapeForCategory = (category) => CATEGORY_SHAPES[category] ?? 0
export const LAB_SHAPES = { glitch: 1, pqc: 3, weibull: 0 }

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

/**
 * État et actions de la forme (fourni aux composants via provide/inject).
 * La scène 3D est branchée après le montage ; sans WebGL, tout le reste fonctionne.
 */
export function createDeck() {
  const state = reactive({
    shape: 0,
    audio: true,
    webgl: true,
    terminalOpen: false,
    themesOpen: false,
    toast: { msg: '3D_ENGINE_READY', visible: false },
    stats: { score: 2450, level: 50, xp: 45, combo: 1, kills: 0, wave: 1, weapon: 0, skills: [5, 6, 4] },
    drones: 6,
    rotation: { x: 0.24, y: 0.81 },
    arenaLog: ['[SYSTÈME 2050] 6 Drones Firewall détectés en orbite.', 'Cliquez sur un octaèdre rouge en 3D pour faire feu !'],
    floats: [],
  })

  let scene = null
  let toastTimer = 0
  let floatSeq = 0
  const timers = new Set()

  function later(fn, ms) {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }

  function attachScene(instance) {
    scene = instance
    state.webgl = Boolean(instance)
    state.drones = instance ? instance.droneCount : 0
  }

  function synth(freq = 640, duration = 0.06) {
    if (state.audio) tone({ freq, to: freq * 1.25, duration, gain: 0.03 })
  }

  function toast(msg) {
    state.toast.msg = msg
    state.toast.visible = true
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => (state.toast.visible = false), 2400)
  }

  function setShape(index, { silent = false } = {}) {
    if (index === state.shape && !silent) return
    state.shape = index
    scene?.setShape(index)
    if (!silent) {
      synth(520 + index * 160, 0.07)
      toast(`Géométrie 3D : ${SHAPES[index].name}`)
    }
  }

  function cameraSpin(message = 'Impulsion cinétique 3D activée') {
    scene?.kick(0.22)
    synth(980, 0.12)
    if (message) toast(message)
  }

  function floatText(x, y, text, color) {
    const id = ++floatSeq
    state.floats.push({
      id,
      x: clamp(x, 40, window.innerWidth - 180),
      y: clamp(y, 60, window.innerHeight - 80),
      text,
      color,
    })
    later(() => {
      const i = state.floats.findIndex((f) => f.id === id)
      if (i >= 0) state.floats.splice(i, 1)
    }, 950)
  }

  function logArena(text) {
    state.arenaLog.push(text)
    if (state.arenaLog.length > 60) state.arenaLog.shift()
  }

  function addRewards(shards, xp) {
    const s = state.stats
    s.score += shards
    s.xp += xp
    if (s.xp >= 100) {
      s.level += 1
      s.xp -= 100
      synth(1320, 0.22)
      toast(`🎉 LEVEL UP ! LVL ${s.level} ARCH-ENGINEER`)
    }
  }

  function spawnWave(count = 6, boss = false) {
    if (!scene) return
    scene.spawnWave(count, boss)
    state.drones = scene.droneCount
  }

  function damage(drone, x, y) {
    const weapon = WEAPONS[state.stats.weapon]
    const result = scene.damageDrone(drone)
    if (!result.destroyed) {
      synth(520, 0.08)
      floatText(x, y, 'CRITICAL HIT! -500', '#fbbf24')
      return
    }

    synth(weapon.freq, 0.14)
    scene.kick(0.09)
    const s = state.stats
    s.kills += 1
    s.combo = Math.min(16, s.combo + 1)
    const points = 250 * s.combo
    addRewards(points, 18)
    floatText(x, y, `+${points} 💠 [${result.label}]`, '#00f0ff')
    logArena(`Cible neutralisée : ${result.label} (+${points} Shards)`)
    state.drones = scene.droneCount

    if (scene.droneCount === 0) {
      s.wave += 1
      toast(`Vague ${s.wave} générée ! +1000 Bonus Shards`)
      addRewards(1000, 45)
      later(() => spawnWave(6 + (s.wave % 3)), 600)
    }
  }

  /** Clic / tap sur la scène 3D */
  function shootAt(x, y) {
    if (!scene) return
    const weapon = WEAPONS[state.stats.weapon]
    const drone = scene.pickDrone(x, y)
    if (drone) {
      scene.laserTo(drone.position, weapon.color)
      damage(drone, x, y)
    } else {
      scene.laserAlongRay(weapon.color)
      synth(weapon.freq * 0.6, 0.05)
    }
  }

  /** Salve orbitale (bouton FIRE / barre espace) : vise le premier drone */
  function fire() {
    if (!scene) {
      toast('Moteur WebGL indisponible sur cet appareil')
      return
    }
    const target = scene.firstDrone()
    if (!target) {
      spawnWave(6)
      return
    }
    const weapon = WEAPONS[state.stats.weapon]
    scene.laserTo(target.position, weapon.color)
    const { x, y } = scene.toScreen(target.position)
    damage(target, x, y)
  }

  function spawnBoss() {
    state.stats.wave += 1
    spawnWave(5, true)
    setShape(3)
    toast('👾 BOSS QUANTUM GUARDIAN DÉTECTÉ !')
    logArena('ALERTE : Boss Quantum Guardian en orbite (3 impacts requis).')
  }

  function selectWeapon(index) {
    state.stats.weapon = index
    const weapon = WEAPONS[index]
    synth(weapon.freq, 0.07)
    toast(`Arme équipée : ${weapon.name}`)
  }

  function upgradeSkill(index) {
    const s = state.stats
    if (s.score < 500) {
      toast('500 Data Shards 💠 requis ! Détruisez des drones.')
      return
    }
    s.score -= 500
    s.skills[index] += 1
    addRewards(0, 35)
    cameraSpin(null)
    toast(`Implant Cyberware #0${index + 1} surcadencé au LVL ${s.skills[index]} !`)
  }

  function toggleAudio() {
    state.audio = !state.audio
    toast(state.audio ? 'Synthétiseur spatial activé' : 'Audio désactivé')
  }

  function dispose() {
    timers.forEach((id) => window.clearTimeout(id))
    timers.clear()
    window.clearTimeout(toastTimer)
    scene = null
  }

  return {
    state,
    attachScene,
    synth,
    toast,
    setShape,
    cameraSpin,
    floatText,
    logArena,
    addRewards,
    spawnWave,
    shootAt,
    fire,
    spawnBoss,
    selectWeapon,
    upgradeSkill,
    toggleAudio,
    dispose,
  }
}
