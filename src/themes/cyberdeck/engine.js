import * as THREE from 'three'

/**
 * Moteur WebGL de la forme « Cyber-deck 3D » :
 * nuage de 1400 particules qui se morphe entre 4 géométries, icosaèdre filaire,
 * anneau gyroscopique et drones sentinelles à abattre (raycasting).
 * Toute la logique de jeu (score, sons…) vit dans deck.js ; ce fichier ne fait que la 3D.
 */

const COUNT = 1400
const MODE_COLORS = [0x00f0ff, 0xf43f5e, 0x10b981, 0x8b5cf6]
const DRONE_LABELS = ['CVE_INJECTION_BOT', 'OWASP_SENTRY', 'BOR_GLITCH_NODE', 'QUANTUM_SNIFFER', 'ROGUE_MCP_AGENT', 'FIRMWARE_LOCK']

function buildShapes() {
  const shapes = [0, 1, 2, 3].map(() => new Float32Array(COUNT * 3))
  const gridSide = Math.ceil(Math.sqrt(COUNT))
  for (let i = 0; i < COUNT; i++) {
    const k = i * 3

    // 0 · Nœud torique « tesseract »
    const u = (i / COUNT) * Math.PI * 2 * 6
    const r = 3.6 + 1.4 * Math.cos(3 * u)
    shapes[0][k] = r * Math.cos(2 * u)
    shapes[0][k + 1] = r * Math.sin(2 * u)
    shapes[0][k + 2] = 1.8 * Math.sin(3 * u)

    // 1 · Wafer de silicium avec pic de glitch EMFI au centre
    const gx = ((i % gridSide) / gridSide - 0.5) * 14
    const gz = (Math.floor(i / gridSide) / gridSide - 0.5) * 14
    const dist = Math.hypot(gx, gz)
    shapes[1][k] = gx
    shapes[1][k + 1] = dist < 2.8 ? -4.8 * Math.exp(-dist * dist * 0.6) * Math.cos(dist * 3) : Math.sin(gx * 1.5) * 0.25
    shapes[1][k + 2] = gz

    // 2 · Anneaux orbitaux (constellation des dépôts GitHub)
    const ring = i % 3
    const radius = 3.2 + ring * 2.4
    const angle = (i / COUNT) * Math.PI * 24
    const tilt = (ring - 1) * 0.65
    shapes[2][k] = radius * Math.cos(angle)
    shapes[2][k + 1] = radius * Math.sin(angle) * Math.sin(tilt) + (Math.random() - 0.5) * 0.4
    shapes[2][k + 2] = radius * Math.sin(angle) * Math.cos(tilt)

    // 3 · Réseau euclidien 3D (cristal post-quantique Kyber)
    const side = 11
    shapes[3][k] = ((i % side) - 5) * 1.25
    shapes[3][k + 1] = ((Math.floor(i / side) % side) - 5) * 1.25
    shapes[3][k + 2] = ((Math.floor(i / (side * side)) % side) - 5) * 1.25
  }
  return shapes
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose()
    child.material?.dispose?.()
  })
}

export class DeckScene {
  /**
   * @param {HTMLElement} container  élément plein écran qui reçoit le canvas
   * @param {{ onShoot?: (x:number, y:number) => void, onRotate?: (x:number, y:number) => void }} hooks
   */
  constructor(container, hooks = {}) {
    this.hooks = hooks
    this.shape = 0
    this.boost = 0
    this.target = { x: 0.25, y: 0.65 }
    this.drones = []
    this.lasers = []
    this.drag = null
    this.lastRotationEmit = 0
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()

    // Couleurs « brutes » comme dans la maquette d'origine (pas de conversion sRGB)
    this.previousColorManagement = THREE.ColorManagement.enabled
    THREE.ColorManagement.enabled = false

    // Lève une erreur si WebGL est indisponible : la forme s'affiche alors sans 3D
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x030509, 0.035)
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.z = 15

    // Nuage de particules (dégradé cyan → violet)
    this.shapes = buildShapes()
    const geometry = new THREE.BufferGeometry()
    const colors = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const mix = i / COUNT
      colors[i * 3] = mix * 0.55
      colors[i * 3 + 1] = 0.94 - mix * 0.35
      colors[i * 3 + 2] = 1
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.shapes[0]), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending }),
    )
    this.scene.add(this.points)

    // Icosaèdre filaire intérieur
    this.wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.6, 1),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.14 }),
    )
    this.scene.add(this.wire)

    // Anneau gyroscopique extérieur
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(6.8, 0.02, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.25 }),
    )
    this.ring.rotation.x = Math.PI / 3
    this.scene.add(this.ring)

    // Drones sentinelles
    this.droneGroup = new THREE.Group()
    this.scene.add(this.droneGroup)
    this.spawnWave(6)

    this.bindEvents()
    this.frame = this.frame.bind(this)
    this.raf = requestAnimationFrame(this.frame)
  }

  bindEvents() {
    const canvas = this.renderer.domElement
    this.handlers = {
      down: (e) => {
        if (e.button !== 0) return
        this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, distance: 0 }
      },
      move: (e) => {
        if (this.drag && e.pointerId === this.drag.id) {
          const dx = e.clientX - this.drag.x
          const dy = e.clientY - this.drag.y
          this.drag.distance += Math.abs(dx) + Math.abs(dy)
          this.target.y += dx * 0.006
          this.target.x += dy * 0.006
          this.drag.x = e.clientX
          this.drag.y = e.clientY
        } else if (e.pointerType === 'mouse') {
          // Léger effet de parallaxe
          this.target.y += (e.clientX / window.innerWidth - 0.5) * 0.0008
        }
      },
      up: (e) => {
        if (!this.drag || e.pointerId !== this.drag.id) return
        const isTap = this.drag.distance < 6 && e.target === canvas
        this.drag = null
        if (isTap) this.hooks.onShoot?.(e.clientX, e.clientY)
      },
      cancel: () => {
        this.drag = null
      },
      wheel: (e) => {
        this.camera.position.z = Math.max(7, Math.min(24, this.camera.position.z + e.deltaY * 0.01))
      },
      resize: () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
      },
    }
    canvas.addEventListener('pointerdown', this.handlers.down)
    canvas.addEventListener('wheel', this.handlers.wheel, { passive: true })
    window.addEventListener('pointermove', this.handlers.move, { passive: true })
    window.addEventListener('pointerup', this.handlers.up)
    window.addEventListener('pointercancel', this.handlers.cancel)
    window.addEventListener('resize', this.handlers.resize)
  }

  frame(now) {
    this.raf = requestAnimationFrame(this.frame)

    // Morphing vers la géométrie cible
    const position = this.points.geometry.attributes.position
    const current = position.array
    const goal = this.shapes[this.shape]
    for (let i = 0; i < current.length; i++) current[i] += (goal[i] - current[i]) * 0.065
    position.needsUpdate = true

    // Rotation automatique + impulsion
    this.target.y += (this.reducedMotion ? 0.0007 : 0.0022) + this.boost
    this.boost *= 0.94
    const rotation = this.points.rotation
    rotation.y += (this.target.y - rotation.y) * 0.08
    rotation.x += (this.target.x - rotation.x) * 0.08
    this.wire.rotation.y = -rotation.y * 0.7
    this.wire.rotation.x = rotation.x * 0.7
    this.ring.rotation.z += 0.004

    // Orbite des drones
    const t = now * 0.001
    this.drones.forEach((drone, index) => {
      const data = drone.userData
      data.angle += data.speed
      drone.position.set(Math.cos(data.angle) * data.radius, Math.sin(t * 2 + index) * data.yAmp, Math.sin(data.angle) * data.radius)
      drone.rotation.x += 0.03
      drone.rotation.y += 0.04
    })

    // Disparition progressive des lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i]
      laser.material.opacity -= 0.06
      if (laser.material.opacity <= 0) {
        this.scene.remove(laser)
        disposeObject(laser)
        this.lasers.splice(i, 1)
      }
    }

    if (this.hooks.onRotate && now - this.lastRotationEmit > 120) {
      this.lastRotationEmit = now
      this.hooks.onRotate(rotation.x, rotation.y)
    }

    this.renderer.render(this.scene, this.camera)
  }

  /** Change la géométrie du nœud central (0 à 3) */
  setShape(index) {
    this.shape = index
    this.boost = 0.08
    this.wire.material.color.setHex(MODE_COLORS[index])
  }

  /** Impulsion de rotation */
  kick(amount) {
    this.boost = amount
  }

  get droneCount() {
    return this.drones.length
  }

  spawnWave(count = 6, boss = false) {
    this.clearDrones()
    for (let i = 0; i < count; i++) {
      const isBoss = boss && i === 0
      const size = isBoss ? 1.15 : 0.55
      const drone = new THREE.Mesh(
        new THREE.OctahedronGeometry(size, isBoss ? 1 : 0),
        new THREE.MeshBasicMaterial({ color: isBoss ? 0xa855f7 : 0xf43f5e, wireframe: true }),
      )
      drone.add(
        new THREE.Mesh(new THREE.OctahedronGeometry(size * 0.5, 0), new THREE.MeshBasicMaterial({ color: isBoss ? 0x00f0ff : 0xfbbf24 })),
      )
      drone.userData = {
        angle: (i / count) * Math.PI * 2,
        radius: isBoss ? 4.2 : 6.2 + (i % 2) * 1.8,
        speed: 0.006 + (i % 3) * 0.003,
        yAmp: 1.5 + (i % 3) * 0.8,
        hp: isBoss ? 3 : 1,
        label: isBoss ? 'BOSS_QUANTUM_GUARDIAN' : DRONE_LABELS[i % DRONE_LABELS.length],
      }
      this.droneGroup.add(drone)
      this.drones.push(drone)
    }
  }

  clearDrones() {
    for (const drone of this.drones) {
      this.droneGroup.remove(drone)
      disposeObject(drone)
    }
    this.drones = []
  }

  /** Drone sous le pointeur (coordonnées écran), ou null */
  pickDrone(clientX, clientY) {
    this.pointer.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hits = this.raycaster.intersectObjects(this.drones, true)
    if (!hits.length) return null
    let object = hits[0].object
    while (object.parent && object.parent !== this.droneGroup) object = object.parent
    return object
  }

  firstDrone() {
    return this.drones[0] ?? null
  }

  laserTo(point, color) {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -5.5, 9), point.clone()])
    const laser = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1 }))
    this.scene.add(laser)
    this.lasers.push(laser)
  }

  /** Tir manqué : le laser part dans la direction du dernier pointage */
  laserAlongRay(color) {
    const point = new THREE.Vector3()
    this.raycaster.ray.at(14, point)
    this.laserTo(point, color)
  }

  toScreen(point) {
    const projected = point.clone().project(this.camera)
    return {
      x: (projected.x * 0.5 + 0.5) * window.innerWidth,
      y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
    }
  }

  /** Inflige 1 dégât ; renvoie { destroyed, label } */
  damageDrone(drone) {
    drone.userData.hp -= 1
    if (drone.userData.hp > 0) {
      drone.scale.multiplyScalar(0.85)
      return { destroyed: false, label: drone.userData.label }
    }
    this.droneGroup.remove(drone)
    disposeObject(drone)
    this.drones = this.drones.filter((d) => d !== drone)
    return { destroyed: true, label: drone.userData.label }
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.handlers.down)
    canvas.removeEventListener('wheel', this.handlers.wheel)
    window.removeEventListener('pointermove', this.handlers.move)
    window.removeEventListener('pointerup', this.handlers.up)
    window.removeEventListener('pointercancel', this.handlers.cancel)
    window.removeEventListener('resize', this.handlers.resize)
    this.clearDrones()
    for (const laser of this.lasers) disposeObject(laser)
    this.lasers = []
    disposeObject(this.scene)
    this.renderer.dispose()
    canvas.remove()
    THREE.ColorManagement.enabled = this.previousColorManagement
  }
}
