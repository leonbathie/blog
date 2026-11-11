import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

/** Procedural, articulated inhabitants for Arcade 221's 3D village.
 * The collision engine remains authoritative; these models are purely visual.
 * Coordinates are in engine pixels, with Y up and Z towards the camera.
 */
export function createHero(THREE) {
  const rig = makePerson(THREE, { hero: true })
  let distance = 0
  let previousX = null
  let lastFacing = 1
  let elapsed = 0
  return {
    group: rig.group,
    dispose() {},
    update({ x = 0, y = 0, facing = 1, grounded = true, speed = 0, dt = 1 / 60 } = {}) {
      const delta = previousX === null ? 0 : x - previousX
      // Do not animate a long stride when a level reloads or the player respawns.
      if (Math.abs(delta) < 30 && grounded) distance += Math.abs(delta)
      previousX = x
      elapsed += Math.max(0, Math.min(dt, 0.1))
      lastFacing = facing < 0 ? -1 : facing > 0 ? 1 : lastFacing
      rig.group.position.set(x, y, 0)
      // Turn enough to show the direction without hiding the character's face.
      rig.group.rotation.y = lastFacing * 1.05
      const moving = grounded && (Math.abs(delta) > 0.025 || Math.abs(speed) > 0.08)
      rig.pose({ distance, moving, grounded, time: elapsed, dt })
    },
  }
}

/** Creates background actors, independently animated and without gameplay collisions. */
export function createVillageLife(THREE) {
  const group = new THREE.Group()
  group.name = 'village-life'
  const residents = [
    { x: 80, z: -37, range: 26, rate: 0.25, colors: [0xb85532, 0x416c69] },
    { x: 220, z: -47, range: 19, rate: 0.20, colors: [0x2c7881, 0xb6613b] },
    { x: 475, z: -40, range: 24, rate: 0.21, colors: [0xce8c36, 0x4c6683] },
    { x: 680, z: -46, range: 20, rate: 0.19, colors: [0x75578b, 0xbc7244] },
    { x: 920, z: -38, range: 21, rate: 0.23, colors: [0x477b66, 0xc08347] },
  ].map((spec, i) => {
    const rig = makePerson(THREE, { shirt: spec.colors[0], trousers: spec.colors[1], skin: i % 2 ? 0x754328 : 0x945534 })
    rig.group.scale.setScalar(0.68 + (i % 2) * 0.08)
    rig.group.position.z = spec.z
    group.add(rig.group)
    return { rig, ...spec, phase: i * 1.7 }
  })

  // Rigged CC0 models replace the procedural placeholders when available.
  const cancelModels = residents.map((resident, index) => attachResidentModel(THREE, resident.rig, index % 2 ? 'woman' : 'man'))

  // A child in the branches and birds in and around the canopy bring the tree to life.
  const treeChild = makePerson(THREE, { shirt: 0xd6a441, trousers: 0x705f89, skin: 0x8c4d2d })
  treeChild.group.scale.setScalar(0.48)
  treeChild.group.position.set(350, 24, -40)
  treeChild.group.rotation.y = -0.5
  group.add(treeChild.group)
  const animals = [
    makeGoat(THREE, 145, -32, 0), makeGoat(THREE, 570, -41, 2),
    makeChicken(THREE, 195, -30, 0), makeChicken(THREE, 520, -32, 1),
    makeChicken(THREE, 785, -38, 2),
  ]
  animals.forEach((animal) => group.add(animal.group))
  cancelModels.push(attachAnimalModel(THREE, animals[0], 'cow'))
  cancelModels.push(attachAnimalModel(THREE, animals[1], 'donkey'))
  const birds = [makeBird(THREE, 341, 35, -38, 0), makeBird(THREE, 360, 40, -41, 1.8), makeBird(THREE, 846, 37, -41, 3)]
  birds.forEach((bird) => group.add(bird.group))
  return {
    group,
    dispose() { cancelModels.forEach((cancel) => cancel()) },
    update(time = 0, dt = 1 / 60) {
      for (const r of residents) {
        const angle = time * r.rate + r.phase
        const x = r.x + Math.sin(angle) * r.range
        const velocity = Math.cos(angle)
        r.rig.group.position.x = x
        r.rig.group.rotation.y = velocity >= 0 ? 1.05 : -1.05
        // Arc length of a sinusoidal patrol, continuous through each turnaround.
        const halfTurns = Math.floor(angle / Math.PI)
        const local = angle - halfTurns * Math.PI
        const travelled = (halfTurns * 2 + 1 - Math.cos(local)) * r.range
        r.rig.pose({ distance: Math.abs(travelled) / r.rig.group.scale.x, moving: Math.abs(velocity) > 0.08, grounded: true, time, dt })
        if (r.rig.modelAnimation) r.rig.modelAnimation(Math.abs(travelled) / r.rig.group.scale.x, Math.abs(velocity) > 0.08, time, true)
      }
      treeChild.pose({ distance: 0, moving: false, grounded: true, time, dt })
      treeChild.group.rotation.z = Math.sin(time * 1.5) * 0.04
      animals.forEach((animal) => {
        animal.update(time)
        if (animal.modelAnimation) animal.modelAnimation(time)
      })
      birds.forEach((bird) => bird.update(time))
    },
  }
}

const residentModels = new Map()
function attachResidentModel(T, rig, name) {
  let cancelled = false
  let mixer = null
  if (!residentModels.has(name)) {
    const base = import.meta.env.BASE_URL || '/'
    const request = new GLTFLoader().loadAsync(`${base}arcade/models/${name}.glb`)
    residentModels.set(name, request)
    request.catch(() => { if (residentModels.get(name) === request) residentModels.delete(name) })
  }
  residentModels.get(name).then((gltf) => {
    if (cancelled) return
    const model = cloneSkeleton(gltf.scene)
    // Each mounted world owns its GPU resources; disposing it cannot invalidate
    // the cached source models or a different running instance.
    model.traverse((object) => {
      if (object.geometry) object.geometry = object.geometry.clone()
      if (object.material) object.material = Array.isArray(object.material) ? object.material.map((material) => material.clone()) : object.material.clone()
    })
    model.updateMatrixWorld(true)
    const bounds = new T.Box3().setFromObject(model)
    const height = bounds.max.y - bounds.min.y
    if (!Number.isFinite(height) || height <= 0) return
    const size = 21 / height
    model.scale.setScalar(size)
    model.position.y = -bounds.min.y * size
    mixer = new T.AnimationMixer(model)
    const idle = gltf.animations.find((clip) => /_Idle$/.test(clip.name))
    const walk = gltf.animations.find((clip) => /_Walk$/.test(clip.name))
    const jump = gltf.animations.find((clip) => /_Jump$/.test(clip.name))
    if (!idle || !walk || !jump) return
    const idleAction = mixer.clipAction(idle).play()
    const walkAction = mixer.clipAction(walk).play()
    const jumpAction = mixer.clipAction(jump).play()
    rig.group.children.forEach((child) => { child.visible = false })
    rig.group.add(model)
    rig.modelAnimation = (distance, moving, time, grounded) => {
      idleAction.enabled = grounded && !moving
      walkAction.enabled = grounded && moving
      jumpAction.enabled = !grounded
      // Distance controls walking phase, even when the game slows or pauses.
      mixer.setTime(!grounded ? jump.duration * 0.48 : moving ? distance / 15 * walk.duration : time % idle.duration)
    }
  }).catch(() => {})
  return () => { cancelled = true; if (mixer) mixer.stopAllAction() }
}

function attachAnimalModel(T, animal, name) {
  let cancelled = false
  let mixer = null
  const base = import.meta.env.BASE_URL || '/'
  new GLTFLoader().loadAsync(`${base}arcade/models/${name}.glb`).then((gltf) => {
    if (cancelled) return
    const model = gltf.scene
    model.updateMatrixWorld(true)
    const bounds = new T.Box3().setFromObject(model)
    const height = bounds.max.y - bounds.min.y
    if (!Number.isFinite(height) || height <= 0) return
    const size = 7.5 / height
    model.scale.setScalar(size)
    model.position.y = -bounds.min.y * size
    model.rotation.y = Math.PI / 2
    const walk = gltf.animations.find((clip) => clip.name === 'Walk')
    if (!walk) return
    mixer = new T.AnimationMixer(model)
    mixer.clipAction(walk).play()
    animal.group.children.forEach((child) => { child.visible = false })
    animal.group.add(model)
    animal.modelAnimation = (time) => { mixer.setTime(time * 0.7) }
  }).catch(() => {})
  return () => { cancelled = true; if (mixer) mixer.stopAllAction() }
}

function makePerson(T, { hero = false, shirt = 0x29827d, trousers = 0x3b5269, skin = 0x8d5030 } = {}) {
  const group = new T.Group()
  const body = new T.Group()
  group.add(body)
  const material = (color, roughness = 0.85) => new T.MeshStandardMaterial({ color, roughness })
  const skinMat = material(skin)
  const shirtMat = material(hero ? 0x328783 : shirt)
  const pantsMat = material(hero ? 0x34546b : trousers)
  const shoeMat = material(0x493029)
  const dark = material(0x221814)
  const white = material(0xf9efdc)
  const iris = material(0x211713)
  const accent = material(0xf0ae41)
  const sphere = new T.SphereGeometry(1, 12, 9)
  const cylinder = new T.CylinderGeometry(1, 1, 1, 10)
  const cone = new T.CylinderGeometry(0.8, 1, 1, 12)
  const addShape = (parent, geo, mat, x, y, z, sx, sy, sz) => {
    const mesh = new T.Mesh(geo, mat)
    mesh.position.set(x, y, z)
    mesh.scale.set(sx, sy, sz)
    parent.add(mesh)
    return mesh
  }
  // Rounded tunic, layered vest and neck. All dimensions are pixels.
  addShape(body, cone, shirtMat, 0, 11.7, 0, 3.0, 6.5, 1.65)
  addShape(body, sphere, shirtMat, 0, 14.4, 0, 3.0, 1.5, 1.65)
  addShape(body, cylinder, skinMat, 0, 15.55, 0, 0.9, 1.5, 0.9)
  const head = new T.Group(); head.position.y = 18.0; body.add(head)
  addShape(head, sphere, skinMat, 0, 0, 0, 2.55, 2.95, 2.05)
  addShape(head, sphere, skinMat, -2.45, -0.1, 0, 0.48, 0.75, 0.5)
  addShape(head, sphere, skinMat, 2.45, -0.1, 0, 0.48, 0.75, 0.5)
  addShape(head, sphere, dark, 0, 2.15, -0.2, 2.5, 0.92, 1.95)
  // Individual curls give the silhouette depth without any sprite billboard.
  for (let i = 0; i < 7; i++) {
    const a = i / 6 * Math.PI
    addShape(head, sphere, dark, Math.cos(a) * 1.8, 2.15 + Math.sin(a) * 0.45, 0.35, 0.58, 0.58, 0.58)
  }
  for (const side of [-1, 1]) {
    addShape(head, sphere, white, side * 0.91, 0.25, 1.73, 0.51, 0.37, 0.18)
    addShape(head, sphere, iris, side * 0.91, 0.23, 1.9, 0.20, 0.23, 0.13)
    addShape(head, sphere, white, side * 0.87, 0.30, 2.02, 0.055, 0.06, 0.04)
    const brow = addShape(head, sphere, dark, side * 0.92, 0.78, 1.65, 0.55, 0.10, 0.12)
    brow.rotation.z = -side * 0.12
  }
  addShape(head, sphere, skinMat, 0, -0.25, 1.98, 0.34, 0.36, 0.35)
  addShape(head, sphere, dark, 0, -1.13, 1.78, 0.62, 0.10, 0.10)
  // Woven scarf with a moving tail marks the playable explorer.
  let scarfTail = null
  if (hero) {
    addShape(body, cylinder, accent, 0, 15.1, 0, 1.45, 0.75, 1.4)
    scarfTail = addShape(body, new T.BoxGeometry(1, 1, 1), accent, -1.4, 13.8, -0.9, 1.2, 3.1, 0.35)
    scarfTail.rotation.z = -0.35
    addShape(body, sphere, material(0xc68a35), 0, 11.0, -1.6, 2.0, 2.4, 0.8)
    addShape(body, new T.BoxGeometry(1, 1, 1), material(0xdbbd78), 0, 11.4, 1.57, 0.45, 4.9, 0.18)
  }
  const arms = []
  for (const side of [-1, 1]) {
    const arm = new T.Group(); arm.position.set(side * 3.0, 14, 0); body.add(arm)
    addShape(arm, cylinder, shirtMat, 0, -1.25, 0, 0.73, 2.5, 0.75)
    addShape(arm, cylinder, skinMat, 0, -3.1, 0, 0.54, 2.0, 0.58)
    addShape(arm, sphere, skinMat, 0, -4.15, 0, 0.7, 0.78, 0.62)
    arms.push(arm)
  }
  const makeLink = (mat, thickness) => {
    const mesh = new T.Mesh(cylinder, mat)
    mesh.userData.thickness = thickness
    group.add(mesh)
    return mesh
  }
  const legs = [-1, 1].map((side) => {
    const thigh = makeLink(pantsMat, 0.95)
    const shin = makeLink(pantsMat, 0.75)
    const knee = addShape(group, sphere, pantsMat, 0, 0, 0, 0.85, 0.85, 0.85)
    const shoe = addShape(group, sphere, shoeMat, 0, 0, 0, 0.95, 0.6, 1.55)
    const sole = addShape(group, sphere, material(0xc69b69), 0, 0, 0, 0.98, 0.17, 1.58)
    return { side, thigh, shin, knee, shoe, sole }
  })
  const up = new T.Vector3(0, 1, 0)
  const a = new T.Vector3(), b = new T.Vector3(), axis = new T.Vector3()
  function link(mesh, x1, y1, z1, x2, y2, z2) {
    a.set(x1, y1, z1); b.set(x2, y2, z2); axis.subVectors(b, a)
    mesh.position.copy(a).add(b).multiplyScalar(0.5)
    mesh.scale.set(mesh.userData.thickness, axis.length(), mesh.userData.thickness)
    mesh.quaternion.setFromUnitVectors(up, axis.normalize())
  }
  function pose({ distance = 0, moving = false, grounded = true, time = 0 }) {
    const stride = 5.2
    const phase = ((distance / (2 * stride)) % 1 + 1) % 1
    const breathing = Math.sin(time * 2.0) * 0.09
    body.position.y = grounded ? breathing + (moving ? Math.abs(Math.sin(phase * Math.PI * 2)) * 0.2 : 0) : 0.25
    head.rotation.z = Math.sin(time * 1.3) * 0.035
    if (scarfTail) scarfTail.rotation.x = -0.45 - (moving ? 0.4 : 0) + Math.sin(time * 5) * 0.12
    arms.forEach((arm, i) => { arm.rotation.x = grounded && moving ? Math.sin(phase * Math.PI * 2 + i * Math.PI) * 0.65 : !grounded ? -0.8 + i * 0.22 : Math.sin(time * 1.8 + i) * 0.08 })
    legs.forEach((leg, index) => {
      const p = (phase + index * 0.5) % 1
      let forward = 0, lift = 0
      if (!grounded) { forward = index ? -1.4 : 1.5; lift = index ? 1.5 : 0.65 }
      else if (moving) {
        if (p < 0.5) forward = stride / 2 - p * 2 * stride
        else { const t = (p - 0.5) * 2; forward = -stride / 2 + stride * (t * t * (3 - 2 * t)); lift = Math.sin(t * Math.PI) * 1.5 }
      }
      // The body is turned 1.05 rad to camera: compensate for projection so
      // the planted shoe travels backwards at the actual world displacement.
      if (grounded && moving) forward /= Math.sin(1.05)
      const x = leg.side * 1.28
      const hipY = 8.8 + body.position.y
      const footY = 0.62 + lift
      const kneeY = (hipY + footY) * 0.53
      const kneeZ = forward * 0.42 + 0.65 + lift * 0.3
      link(leg.thigh, x, hipY, 0, x, kneeY, kneeZ)
      link(leg.shin, x, kneeY, kneeZ, x, footY + 0.25, forward)
      leg.knee.position.set(x, kneeY, kneeZ)
      leg.shoe.position.set(x, footY, forward + 0.5)
      leg.sole.position.set(x, footY - 0.48, forward + 0.5)
      leg.shoe.rotation.x = leg.sole.rotation.x = lift * -0.12
    })
  }
  pose({})
  return { group, pose }
}

function makeGoat(T, x, z, phase) {
  const group = new T.Group()
  const coat = new T.MeshStandardMaterial({ color: 0xd5c09d, roughness: 1 })
  const dark = new T.MeshStandardMaterial({ color: 0x654d3b, roughness: 1 })
  const sphere = new T.SphereGeometry(1, 10, 8)
  const part = (mat, px, py, pz, sx, sy, sz) => { const m = new T.Mesh(sphere, mat); m.position.set(px, py, pz); m.scale.set(sx, sy, sz); group.add(m); return m }
  part(coat, 0, 4.2, 0, 4, 2.4, 1.7)
  part(coat, 3.4, 5.2, 0, 1.5, 1.6, 1.1)
  part(dark, 4.4, 4.9, 0.7, 0.65, 0.55, 0.45)
  part(dark, 3.1, 6.5, 0.6, 0.22, 0.9, 0.22)
  const legs = [-2.3, 2.3].flatMap((px) => [-0.9, 0.9].map((pz) => part(dark, px, 1.4, pz, 0.4, 1.5, 0.4)))
  group.position.set(x, 0, z); group.scale.setScalar(0.85)
  return { group, update(t) { group.position.x = x + Math.sin(t * 0.19 + phase) * 12; group.scale.x = Math.cos(t * 0.19 + phase) < 0 ? -0.85 : 0.85; legs.forEach((leg, i) => { leg.rotation.z = Math.sin(t * 3 + phase + (i % 3) * Math.PI) * 0.25 }); } }
}

function makeChicken(T, x, z, phase) {
  const group = new T.Group(), geo = new T.SphereGeometry(1, 9, 7)
  const feather = new T.MeshStandardMaterial({ color: 0xe9ddbb, roughness: 1 })
  const red = new T.MeshStandardMaterial({ color: 0xb53c2d, roughness: 1 })
  const gold = new T.MeshStandardMaterial({ color: 0xe39a31, roughness: 1 })
  const part = (mat, px, py, pz, sx, sy, sz) => { const m = new T.Mesh(geo, mat); m.position.set(px, py, pz); m.scale.set(sx, sy, sz); group.add(m); return m }
  part(feather, 0, 1.9, 0, 1.7, 1.4, 1.1); part(feather, 1.15, 2.9, 0, 0.8, 0.85, 0.7)
  part(red, 1.15, 3.7, 0, 0.35, 0.4, 0.25); part(gold, 1.9, 2.9, 0, 0.5, 0.22, 0.3)
  group.position.set(x, 0, z)
  return { group, update(t) { group.position.x = x + Math.sin(t * 0.45 + phase) * 8; group.position.y = Math.abs(Math.sin(t * 4 + phase)) * 0.3; group.scale.x = Math.cos(t * 0.45 + phase) < 0 ? -1 : 1 } }
}

function makeBird(T, x, y, z, phase) {
  const group = new T.Group(), mat = new T.MeshStandardMaterial({ color: 0x6c4738, roughness: 1 })
  const body = new T.Mesh(new T.SphereGeometry(1, 8, 6), mat); body.scale.set(1.4, 0.8, 0.7); group.add(body)
  const wings = [-1, 1].map((side) => { const wing = new T.Mesh(new T.SphereGeometry(1, 8, 6), mat); wing.scale.set(0.8, 0.2, 1.2); wing.position.z = side * 0.6; group.add(wing); return wing })
  group.position.set(x, y, z)
  return { group, update(t) { const flutter = Math.max(0, Math.sin(t * 0.8 + phase) - 0.65); wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * flutter * Math.sin(t * 14) }); group.position.y = y + flutter * 0.8 } }
}
