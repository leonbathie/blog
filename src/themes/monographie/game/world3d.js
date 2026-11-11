import * as THREE from 'three'
import { LEVEL_H, LEVEL_W, TILE } from './levels.js'
import { createHero, createVillageLife } from './actors3d.js'

// The simulation remains two-dimensional. One Three.js unit is one simulation
// pixel; the gameplay plane is z=0 and the feet meet y=0 at the ground line.
const GROUND = (LEVEL_H - 3) * TILE
const WIDTH = 320
const HEIGHT = 180

export function createWorld3D(canvas) {
  // This may throw on devices without WebGL. The caller owns the 2D fallback.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  // Bound the drawing buffer on large/high-DPI screens, especially phones.
  // CSS still stretches it to the full available size.
  renderer.setPixelRatio(1)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#c97856')
  const camera = new THREE.OrthographicCamera(-WIDTH / 2, WIDTH / 2, HEIGHT / 2, -HEIGHT / 2, 1, 1000)
  camera.position.z = 450
  scene.add(new THREE.HemisphereLight('#ffe5b2', '#704633', 2.1))
  const sunLight = new THREE.DirectionalLight('#ffe4b2', 2.3)
  sunLight.position.set(-100, 180, 160)
  scene.add(sunLight)
  const materials = new Map()
  const geometries = new Set()
  const material = (color, extra = {}) => {
    const key = `${color}:${JSON.stringify(extra)}`
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...extra }))
    return materials.get(key)
  }
  const geo = (g) => { geometries.add(g); return g }
  const boxGeo = geo(new THREE.BoxGeometry(1, 1, 1))
  const sphereGeo = geo(new THREE.SphereGeometry(1, 12, 8))
  const coneGeo = geo(new THREE.ConeGeometry(1, 1, 10))
  const cylGeo = geo(new THREE.CylinderGeometry(1, 1, 1, 10))
  const coinGeo = geo(new THREE.TorusGeometry(4.2, 1.1, 8, 16))
  const box = (parent, x, y, z, w, h, d, color, rotation = 0) => {
    const m = new THREE.Mesh(boxGeo, material(color))
    m.position.set(x, y, z); m.scale.set(w, h, d); m.rotation.y = rotation; parent.add(m); return m
  }
  const ball = (parent, x, y, z, sx, sy, sz, color) => {
    const m = new THREE.Mesh(sphereGeo, material(color)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m
  }
  const cone = (parent, x, y, z, radius, height, color, scaleZ = 1) => {
    const m = new THREE.Mesh(coneGeo, material(color)); m.position.set(x, y, z); m.scale.set(radius, height, radius * scaleZ); parent.add(m); return m
  }
  const cylinder = (parent, x, y, z, radius, height, color, sx = 1, sz = 1) => {
    const m = new THREE.Mesh(cylGeo, material(color)); m.position.set(x, y, z); m.scale.set(radius * sx, height, radius * sz); parent.add(m); return m
  }

  // Painted atmospheric gradient and sun are attached to the camera so the
  // horizon never ends while travelling through a level.
  const skyCanvas = document.createElement('canvas')
  skyCanvas.width = 8; skyCanvas.height = 256
  const skyCtx = skyCanvas.getContext('2d')
  const grad = skyCtx.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#566787'); grad.addColorStop(0.38, '#ce867b'); grad.addColorStop(0.75, '#f5b67e'); grad.addColorStop(1, '#f5d09a')
  skyCtx.fillStyle = grad; skyCtx.fillRect(0, 0, 8, 256)
  const skyTexture = new THREE.CanvasTexture(skyCanvas)
  skyTexture.colorSpace = THREE.SRGBColorSpace
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTexture, depthWrite: false })
  const sky = new THREE.Mesh(geo(new THREE.PlaneGeometry(WIDTH * 1.1, HEIGHT * 1.1)), skyMat)
  sky.position.z = -250; scene.add(sky)
  const sunMat = new THREE.MeshBasicMaterial({ color: '#ffe4a0' })
  const sun = new THREE.Mesh(geo(new THREE.CircleGeometry(20, 32)), sunMat)
  sun.position.z = -240; scene.add(sun)

  const scenery = new THREE.Group(); scene.add(scenery)
  // Distant scrubland, low hills, and a deep sandy village square.
  box(scenery, 512, -8, -95, 1150, 12, 150, '#c28a59')
  for (let i = 0; i < 18; i++) {
    const x = i * 67 - 40
    ball(scenery, x, -1, -135, 58 + (i % 3) * 8, 16 + (i % 4) * 4, 9, i % 2 ? '#a88769' : '#b98d6c')
  }
  // Homes have dimensional earthen walls, pitched roofs, lit doors, beams,
  // and shaded side walls. They sit behind the playable lane.
  const house = (x, z, scale = 1, round = false) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); scenery.add(g)
    if (round) {
      cylinder(g, 0, 15, 0, 15, 30, '#dc9b66')
      cone(g, 0, 36, 0, 19, 19, '#8d5339')
      box(g, 0, 9, 14.5, 6.5, 18, 1, '#513d31')
      box(g, 0, 28, 14.5, 27, 2, 1, '#efbd7a')
    } else {
      box(g, 0, 16, 0, 41, 32, 25, '#d9a374', -0.06)
      box(g, 18, 16, 1, 5, 32, 24, '#bb825c', -0.06)
      const roof = cone(g, 0, 39, 0, 30, 19, '#955940', .62)
      roof.rotation.y = Math.PI / 4
      box(g, -9, 10, 13.3, 8, 20, 1.4, '#654639')
      box(g, 8, 19, 13.3, 9, 8, 1.4, '#6e5946')
      box(g, 8, 19, 14.1, 1, 8, 0.6, '#edc68f')
      box(g, 8, 19, 14.1, 9, 1, 0.6, '#edc68f')
      box(g, 0, 29, 13.4, 39, 2, 1, '#edc091')
    }
    box(g, 0, 1, 1, round ? 31 : 43, 2, 30, '#a76d49')
  }
  for (const [x,z,s,r] of [[24,-74,.8,1],[85,-63,1,0],[185,-72,.85,1],[257,-65,1,0],[430,-75,1,1],[500,-70,1.1,0],[565,-90,.8,1],[675,-68,1,0],[745,-75,.9,1],[920,-71,1,0],[1010,-82,.85,1]]) house(x,z,s,r)
  const tree = (x, z, s = 1) => {
    const g = new THREE.Group(); g.position.set(x,0,z); g.scale.setScalar(s); scenery.add(g)
    cylinder(g, 0, 22, 0, 4, 44, '#76503c')
    const branch = box(g, -6, 36, 0, 4, 27, 4, '#76503c'); branch.rotation.z = -.55
    const branch2 = box(g, 6, 38, -1, 3, 23, 3, '#76503c'); branch2.rotation.z = .58
    for (const [dx,y,dz,sx,sy] of [[-15,50,0,16,10],[0,56,0,19,12],[15,50,0,17,10],[-6,62,-4,13,9],[11,61,-3,12,8]]) ball(g, dx,y,dz,sx,sy,9, (dx > 0 ? '#567d55' : '#668b5b'))
  }
  tree(350,-55,1.08); tree(135,-75,.8); tree(610,-78,1); tree(850,-62,1.05)
  // Repeated vegetation adds foreground depth without obscuring obstacles.
  for (let i = 0; i < 42; i++) {
    const x = i * 27 + (i * 13 % 16)
    ball(scenery, x, 2, -24 - (i % 3) * 7, 5 + i % 4, 2.5 + i % 3, 3, i % 2 ? '#78945c' : '#8b9d62')
  }
  const hero = createHero(THREE)
  scene.add(hero.group)
  const life = createVillageLife(THREE)
  scene.add(life.group)
  // The exit marker is fixed to the edge of the viewport until the terminal
  // comes into view. It uses the same camera coordinates as the game.
  const guide = new THREE.Group(); scene.add(guide)
  const arrow = cone(guide, 0, 0, 0, 4, 9, '#ffe18a', .5)
  arrow.rotation.z = -Math.PI / 2
  box(guide, -6, 0, 0, 8, 2, 2, '#ffe18a')
  const flashMaterial = new THREE.MeshBasicMaterial({ color: '#e33c2d', transparent: true, opacity: 0, depthTest: false, depthWrite: false })
  const flash = new THREE.Mesh(geo(new THREE.PlaneGeometry(WIDTH, HEIGHT)), flashMaterial)
  flash.renderOrder = 1000; scene.add(flash)
  // A bounded particle pool supplies feedback without allocating every frame.
  const sparks = Array.from({ length: 30 }, (_, i) => {
    const mesh = new THREE.Mesh(sphereGeo, material(i % 3 ? '#ffd365' : '#fff4c3', { emissive: '#ad520e', emissiveIntensity: .35 }))
    mesh.visible = false; scene.add(mesh)
    return { mesh, age: 0, life: 0, vx: 0, vy: 0 }
  })
  let sparkCursor = 0, flashStrength = 0, previous = null
  function burst(x, y, count, power) {
    for (let i = 0; i < count; i++) {
      const spark = sparks[sparkCursor++ % sparks.length]
      const angle = (i / count) * Math.PI * 2
      const speed = power * (.65 + (i % 3) * .18)
      spark.mesh.position.set(x, y, 16)
      spark.mesh.scale.setScalar(1.2 + (i % 2) * .45)
      spark.mesh.visible = true
      spark.vx = Math.cos(angle) * speed; spark.vy = Math.sin(angle) * speed + .3
      spark.age = 0; spark.life = 24 + (i % 4) * 4
    }
  }
  let levelGroup = null
  let currentTiles = null
  let chipMeshes = [], walkerMeshes = [], gateMeshes = []
  const makeLevel = state => {
    if (levelGroup) scene.remove(levelGroup)
    levelGroup = new THREE.Group(); scene.add(levelGroup)
    chipMeshes = []; walkerMeshes = []; gateMeshes = []
    // The background village continues behind a gap; a dark inset makes the
    // actual collision-free pit unmistakable from the side-on camera.
    const floor = state.tiles[LEVEL_H - 3]
    for (let x = 0; floor && x < Math.min(LEVEL_W, floor.length);) {
      if (floor[x] === '#') { x++; continue }
      let end = x + 1
      while (end < LEVEL_W && floor[end] !== '#') end++
      const width = (end - x) * TILE, centre = (x + end) * TILE / 2
      box(levelGroup, centre, -28, -11, width, 56, 1, '#382322')
      box(levelGroup, centre, -48, -10.3, width, 16, 1, '#21191e')
      box(levelGroup, centre, -1, -10, width, 2, 1, '#6a4234')
      x = end
    }
    // Runs of tiles are merged to reduce draw calls and retain exact collision edges.
    for (let ty = 0; ty < state.tiles.length; ty++) {
      for (let tx = 0; tx < LEVEL_W;) {
        const t = state.tiles[ty][tx]
        if (t !== '#' && t !== '-') { tx++; continue }
        let end = tx + 1
        while (end < LEVEL_W && state.tiles[ty][end] === t) end++
        const width = (end - tx) * TILE, x = tx * TILE + width / 2, top = GROUND - ty * TILE
        if (t === '#') {
          box(levelGroup, x, top - TILE / 2, 0, width, TILE, 20, (ty % 2) ? '#ad6843' : '#b97648')
          if (ty === 0 || state.tiles[ty - 1][tx] !== '#') {
            box(levelGroup, x, top - 1.5, 1, width, 3, 22, '#e6ac67')
            box(levelGroup, x, top - 4, 11, width, 1.2, 0.6, '#885039')
          }
        } else {
          box(levelGroup, x, top - 2.7, 0, width, 5.4, 15, '#a45e38')
          box(levelGroup, x, top - .65, 0, width, 1.3, 16, '#f6cf8b')
          for (let a = tx; a < end; a++) box(levelGroup, a * TILE + 8, top - 3.2, 8, 5, 1.5, .7, '#56a39a')
        }
        tx = end
      }
    }
    for (const c of state.chips) {
      const group = new THREE.Group(); levelGroup.add(group)
      const coin = new THREE.Mesh(coinGeo, material('#ffd36b', { metalness: .45, roughness: .3, emissive: '#8f4b06', emissiveIntensity: .25 }))
      group.add(coin); ball(group,0,0,0,2.2,2.2,1.5,'#fff0a6'); chipMeshes.push(group)
    }
    for (const s of state.spikes) {
      for (let i = 0; i < 3; i++) cone(levelGroup, s.x + 2 + i * 4, GROUND - (s.y + s.h) + s.h / 2, 0, 2.5, s.h, '#ed7258', 1.7)
    }
    for (const gate of state.gates || []) {
      const group = new THREE.Group(); levelGroup.add(group)
      box(group, 0, 0, 0, 5, gate.h, 5, '#ff6d48')
      box(group, 0, 0, 3, 1.5, gate.h, 1, '#fff2a1')
      gateMeshes.push(group)
    }
    for (const w of state.walkers) {
      const g = new THREE.Group(); levelGroup.add(g)
      ball(g, 0, 6, 0, 7, 6, 5, '#a94c3d')
      box(g, 0, 7, 5, 9, 3, 1, '#412d2e')
      ball(g, -2.5, 7, 6, .9, .9, .6, '#ffdb7b'); ball(g, 2.5, 7, 6, .9, .9, .6, '#ffdb7b')
      box(g,-4,1,0,3,2,5,'#523932'); box(g,4,1,0,3,2,5,'#523932')
      walkerMeshes.push(g)
    }
    const e = state.exit
    const portal = new THREE.Group(); portal.position.set(e.x + e.w/2, GROUND - (e.y + e.h), 0); levelGroup.add(portal)
    box(portal, 0, 14, 0, 18, 28, 8, '#a86c44')
    box(portal, 0, 17, 4.2, 12, 18, .8, '#63b5a6')
    box(portal, 0, 17, 4.7, 8, 13, .3, '#d4f5cf')
    ball(portal,0,31,0,3,3,3,'#ffe092')
  }
  let prevTime = null, lastWidth = 0, lastHeight = 0, disposed = false
  return {
    render(state, cam, time = 0) {
      const cssWidth = canvas.clientWidth || 640, cssHeight = canvas.clientHeight || 360
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, 1280 / cssWidth, 720 / cssHeight)
      const width = Math.max(1, Math.round(cssWidth * pixelRatio))
      const height = Math.max(1, Math.round(cssHeight * pixelRatio))
      if (width !== lastWidth || height !== lastHeight) { renderer.setSize(width, height, false); lastWidth = width; lastHeight = height }
      if (currentTiles !== state.tiles) { currentTiles = state.tiles; makeLevel(state) }
      const cx = cam.x + WIDTH / 2, cy = GROUND - (cam.y + HEIGHT / 2)
      camera.position.set(cx, cy, 450)
      sky.position.set(cx, cy, -250); sun.position.set(cx + 90, cy + 27, -240)
      const frameDelta = prevTime === null ? 1 : Math.max(0, Math.min(3, time - prevTime))
      const dt = frameDelta / 60
      prevTime = time
      const p = state.player
      if (previous && previous.tiles === state.tiles) {
        if (state.lives < previous.lives) {
          flashStrength = .55
          burst(p.x + p.w / 2, GROUND - p.y - p.h / 2, 14, 1.9)
        }
        if ((previous.grounded && !p.onGround && p.vy < 0) ||
            (previous.airAvailable && !p.airJumpAvailable && !p.onGround && p.vy < 0)) {
          burst(p.x + p.w / 2, GROUND - p.y - p.h, 8, 1.1)
        }
        state.chips.forEach((chip, i) => {
          if (chip.taken && !previous.taken[i]) burst(chip.x + chip.w / 2, GROUND - chip.y - chip.h / 2, 10, 1.4)
        })
      }
      previous = { tiles: state.tiles, lives: state.lives, grounded: p.onGround, airAvailable: p.airJumpAvailable, taken: state.chips.map(c => c.taken) }
      for (const spark of sparks) {
        if (!spark.mesh.visible) continue
        spark.age += frameDelta
        if (spark.age >= spark.life) { spark.mesh.visible = false; continue }
        spark.mesh.position.x += spark.vx * frameDelta
        spark.mesh.position.y += spark.vy * frameDelta
        spark.vy -= .035 * frameDelta
        spark.mesh.scale.setScalar(Math.max(.1, 1.5 * (1 - spark.age / spark.life)))
      }
      flashStrength *= Math.pow(.93, frameDelta)
      flashMaterial.opacity = flashStrength
      flash.position.set(cx, cy, 400)
      const exitX = state.exit.x + state.exit.w / 2
      guide.visible = state.phase === 'playing' && exitX > cam.x + WIDTH - 15
      guide.position.set(cam.x + WIDTH - 15, Math.max(cy - HEIGHT / 2 + 12, Math.min(cy + HEIGHT / 2 - 12, GROUND - state.exit.y - state.exit.h / 2)), 20)
      hero.update({ x: p.x + p.w / 2, y: GROUND - (p.y + p.h), facing: p.dir, grounded: p.onGround, speed: p.vx, dt })
      life.update(time / 60, dt)
      state.chips.forEach((c, i) => {
        const m = chipMeshes[i]; if (!m) return
        m.visible = !c.taken; m.position.set(c.x + c.w / 2, GROUND - (c.y + c.h / 2) + Math.sin(time / 16 + i) * 1.3, 0); m.rotation.y = time / 30
      })
      state.walkers.forEach((w, i) => {
        const m = walkerMeshes[i]; if (!m) return
        m.visible = w.alive; m.position.set(w.x + w.w / 2, GROUND - (w.y + w.h), 0); m.rotation.z = Math.sin(time / 7 + i) * .06
      })
      ;(state.gates || []).forEach((g, i) => {
        const m = gateMeshes[i]; if (!m) return
        m.position.set(g.x + g.w / 2, GROUND - (g.y + g.h / 2), 0); m.visible = g.active || Math.floor(time / 12) % 2 === 0; m.scale.x = g.active ? 1 : .35
      })
      renderer.render(scene, camera)
    },
    dispose() {
      if (disposed) return
      disposed = true
      hero.dispose()
      life.dispose()
      // Actor modules own their own materials and geometries; traverse all scene
      // objects to clean them up too, including detached previous level assets.
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose())
      })
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
      skyTexture.dispose(); skyMat.dispose(); sunMat.dispose(); renderer.dispose()
    },
  }
}




