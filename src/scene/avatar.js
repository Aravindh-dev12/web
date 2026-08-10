import * as THREE from 'three/webgpu'

const SKINS = [
  { body: 0xff174c, glow: 0xff174c },
  { body: 0x4d92ff, glow: 0x5bb9ff },
  { body: 0x9cff57, glow: 0xb6ff72 },
  { body: 0xf7e8ff, glow: 0xff66cd }
]

function material(color, emissive = color, intensity = .2) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: .65,
    metalness: .08
  })
}

export function createCatAvatar(skin = 0, remote = false) {
  const palette = SKINS[skin % SKINS.length]
  const group = new THREE.Group()
  group.userData.skin = skin

  const bodyMat = material(palette.body, palette.glow, remote ? .4 : .7)
  const black = material(0x09080b, 0x000000, 0)
  const white = material(0xffffff, 0xffffff, 1.4)

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.34, .55, 5, 10), bodyMat)
  body.scale.set(1.05, 1, .88)
  body.position.y = .78
  group.add(body)

  const head = new THREE.Mesh(new THREE.SphereGeometry(.42, 18, 14), bodyMat)
  head.scale.set(1.05, .9, .93)
  head.position.y = 1.47
  group.add(head)

  const earGeo = new THREE.ConeGeometry(.18, .34, 4)
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, bodyMat)
    ear.position.set(side * .25, 1.79, 0)
    ear.rotation.y = Math.PI / 4
    group.add(ear)
  }

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), white)
    eye.position.set(side * .15, 1.51, .37)
    group.add(eye)
  }

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(.1, .025, 6, 12, Math.PI), black)
  mouth.position.set(0, 1.35, .38)
  mouth.rotation.set(Math.PI / 2, 0, 0)
  group.add(mouth)

  const tail = new THREE.Mesh(new THREE.TorusGeometry(.31, .065, 7, 20, Math.PI * 1.35), bodyMat)
  tail.position.set(-.42, .74, -.02)
  tail.rotation.set(.5, .8, -.2)
  group.add(tail)

  const glow = new THREE.PointLight(palette.glow, remote ? 1.2 : 2.2, 4.5, 2)
  glow.position.y = .85
  group.add(glow)

  group.userData.bodyMaterial = bodyMat
  return group
}

export function setAvatarSkin(group, skin) {
  const palette = SKINS[skin % SKINS.length]
  const material = group.userData.bodyMaterial
  if (material) {
    material.color.setHex(palette.body)
    material.emissive.setHex(palette.glow)
  }
  const light = group.children.find((child) => child.isPointLight)
  if (light) light.color.setHex(palette.glow)
  group.userData.skin = skin
}
