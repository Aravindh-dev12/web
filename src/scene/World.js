import * as THREE from 'three/webgpu'
import { bloom, color, film, pass, reflector, rgbShift, screenUV, time } from 'three/tsl'
import { gsap } from 'gsap'
import PartySocket from 'partysocket'
import { createCatAvatar, setAvatarSkin } from './avatar.js'
import { makeProjectTexture, makeSignTexture, makeSystemTexture } from './textures.js'

const clamp = THREE.MathUtils.clamp
const lerp = THREE.MathUtils.lerp

export class World {
  constructor({ canvas, projects, callbacks = {} }) {
    this.canvas = canvas
    this.projects = projects
    this.callbacks = callbacks
    this.clock = new THREE.Clock()
    this.keys = new Set()
    this.pointer = new THREE.Vector2()
    this.velocity = new THREE.Vector3()
    this.yaw = 0
    this.pitch = -.05
    this.mode = 'explore'
    this.onGround = true
    this.projectMeshes = []
    this.remotePlayers = new Map()
    this.lastNetwork = 0
    this.skin = 0
    this.playerState = 'idle'
    this.quality = matchMedia('(max-width: 760px)').matches ? .7 : 1
    this.raycaster = new THREE.Raycaster()
  }

  async init() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x050609)
    this.scene.fog = new THREE.FogExp2(0x07090d, .020)
    this.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .08, 240)
    this.camera.position.set(0, 3.3, 12.8)

    this.renderer = new THREE.WebGPURenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.quality === 1 ? 1.6 : 1.15))
    this.renderer.setSize(innerWidth, innerHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.18
    this.renderer.shadowMap.enabled = true
    await this.renderer.init()
    this.callbacks.onRenderer?.(navigator.gpu ? 'WEBGPU' : 'WEBGL2')

    this.addLights()
    this.addGround()
    this.addCity()
    this.addBillboards()
    this.addInteractiveProps()
    this.addPlayer()
    this.setupPost()
    this.bindEvents()
    this.connectMultiplayer()
    this.renderer.setAnimationLoop(() => this.tick())
    this.callbacks.onReady?.()
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight(0xa6b8ff, 0x130611, 1.4))
    const moon = new THREE.DirectionalLight(0xd8e8ff, 2.2)
    moon.position.set(-8, 22, 12)
    moon.castShadow = true
    this.scene.add(moon)
    ;[
      [0xff174c, -8, 4, 2, 18],
      [0x60ffe2, 8, 6, -8, 12],
      [0x8d5cff, -4, 11, -22, 14]
    ].forEach(([c,x,y,z,i]) => {
      const l = new THREE.PointLight(c, i, 30, 2)
      l.position.set(x,y,z)
      this.scene.add(l)
    })
  }

  addGround() {
    const mirror = reflector({ resolutionScale: this.quality === 1 ? .55 : .32, bounces: false })
    const material = new THREE.MeshBasicNodeMaterial()
    const line = screenUV.y.mul(180).add(time.mul(1.5)).fract().step(.035).mul(.018)
    material.colorNode = mirror.mul(.42).add(color(0x06070a)).add(line)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(130,170), material)
    ground.rotation.x = -Math.PI / 2
    ground.add(mirror.target)
    ground.receiveShadow = true
    this.scene.add(ground)
    const grid = new THREE.GridHelper(130, 52, 0xff174c, 0x18202c)
    grid.material.transparent = true
    grid.material.opacity = .2
    grid.position.y = .015
    this.scene.add(grid)
  }

  addCity() {
    const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x11131b, roughness: .62, metalness: .52 })
    const trim = [0xff174c,0x5dffe0,0x876bff,0xff8a2a].map(c => new THREE.MeshBasicMaterial({ color:c, toneMapped:false }))
    const placements = []
    for (let row = 0; row < 8; row++) for (const side of [-1,1]) placements.push([side*(12+(row%3)*4),4-row*11+(row%2)*2,7+((row*7)%19),7+((row*11)%9)])
    placements.push([-27,-10,19,14],[26,-28,27,11],[-22,-45,34,12],[23,-60,22,15])
    placements.forEach(([x,z,h,w], index) => {
      const group = new THREE.Group()
      const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,7+(index%4)*1.7), blockMaterial.clone())
      b.position.y = h/2
      b.castShadow = true
      group.add(b)
      for (let i=0;i<4+index%4;i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(w*.78,.08,.045), trim[(index+i)%trim.length])
        s.position.set(0,2.3+i*(h-3)/(4+index%4),3.52+(index%4)*.85)
        group.add(s)
      }
      group.position.set(x,0,z)
      this.scene.add(group)
    })
    ;['VIRTUAL','SHADER','DRIFT','ARV°26','NODE','LIVE','渋谷','REALTIME'].forEach((word,i) => {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6,1.58), new THREE.MeshBasicMaterial({ map:makeSignTexture(word,['#ff174c','#64ffe0','#966dff','#ffb32e'][i%4]), toneMapped:false }))
      sign.position.set((i%2?1:-1)*(9.5+(i%3)*4.2),4.5+(i%4)*3.2,1-i*8.5)
      sign.rotation.y = i%2 ? -.32 : .32
      this.scene.add(sign)
    })
    const count = this.quality===1?900:420
    const positions = new Float32Array(count*3)
    for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*90;positions[i*3+1]=Math.random()*36;positions[i*3+2]=10-Math.random()*115}
    const g = new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(positions,3))
    this.scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xdbe7ff,size:.035,transparent:true,opacity:.4})))
  }

  addBillboards() {
    const system = new THREE.Mesh(new THREE.PlaneGeometry(13.4,7), new THREE.MeshBasicMaterial({ map:makeSystemTexture('ARV SYSTEM','#67f2dd',7), toneMapped:false }))
    system.position.set(0,10.8,-16.5)
    this.scene.add(system)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(14.2,7.8,.34), new THREE.MeshStandardMaterial({color:0x0f1519,metalness:.82,roughness:.24}))
    frame.position.copy(system.position); frame.position.z -= .24; this.scene.add(frame)
    this.projects.forEach((project,i) => {
      const billboard = new THREE.Mesh(new THREE.PlaneGeometry(13.2,7.7), new THREE.MeshBasicMaterial({ map:makeProjectTexture(project,i), toneMapped:false }))
      const lane=i-2
      billboard.position.set(lane*14.5,5.2+Math.abs(lane)*.2,-35-Math.abs(lane)*3)
      billboard.rotation.y=-lane*.12
      billboard.userData.projectIndex=i
      billboard.userData.interactive='project'
      this.scene.add(billboard)
      this.projectMeshes.push(billboard)
      const backing = new THREE.Mesh(new THREE.BoxGeometry(13.8,8.3,.5),new THREE.MeshStandardMaterial({color:0x101116,metalness:.72,roughness:.25}))
      backing.position.copy(billboard.position); backing.position.z-=.28; backing.rotation.copy(billboard.rotation); this.scene.add(backing)
    })
  }

  addInteractiveProps() {
    const booth = new THREE.Group(); booth.position.set(8.7,0,-11)
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.5,1.3,3.2),new THREE.MeshStandardMaterial({color:0x11131a,metalness:.8,roughness:.25})); base.position.y=.65; booth.add(base)
    const dj = new THREE.Mesh(new THREE.PlaneGeometry(4.5,1.2),new THREE.MeshBasicMaterial({map:makeSignTexture('DJ / LIVE','#6affdd'),toneMapped:false})); dj.position.set(0,2.05,0); booth.add(dj)
    booth.traverse(o=>{if(o.isMesh)o.userData.interactive='dj'}); this.scene.add(booth)
    const npc=createCatAvatar(2,true); npc.position.set(-7.2,0,-8.5); npc.scale.setScalar(.92); npc.traverse(o=>{if(o.isMesh)o.userData.interactive='npc'}); this.scene.add(npc); this.npc=npc
  }

  addPlayer() {
    this.player=createCatAvatar(this.skin)
    this.player.position.set(0,0,5.8)
    this.player.rotation.y=Math.PI
    this.scene.add(this.player)
  }

  setupPost() {
    try {
      this.pipeline = new THREE.RenderPipeline(this.renderer)
      const scenePass = pass(this.scene,this.camera)
      const beauty = scenePass.getTextureNode('output')
      const glow = bloom(beauty,this.quality===1?.72:.52,.24,.68)
      this.pipeline.outputNode = rgbShift(film(beauty.add(glow),.08,screenUV),.00045)
    } catch (error) {
      console.warn('Post pipeline fallback:',error)
      this.pipeline=null
    }
  }

  bindEvents() {
    addEventListener('resize',()=>this.resize())
    addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.code==='Space'&&this.onGround){this.velocity.y=5.4;this.onGround=false}})
    addEventListener('keyup',e=>this.keys.delete(e.code))
    addEventListener('pointermove',e=>{this.pointer.x=e.clientX/innerWidth*2-1;this.pointer.y=-(e.clientY/innerHeight*2-1);if(e.buttons===1){this.yaw-=e.movementX*.0025;this.pitch=clamp(this.pitch-e.movementY*.0018,-.28,.24)}})
    this.canvas.addEventListener('pointerdown',()=>this.pointerDown())
  }

  pointerDown() {
    this.raycaster.setFromCamera(this.pointer,this.camera)
    const hit=this.raycaster.intersectObjects(this.scene.children,true).find(x=>x.object.userData.interactive)
    if(!hit)return
    const type=hit.object.userData.interactive
    if(type==='project')this.focusProject(hit.object.userData.projectIndex)
    else this.callbacks.onInteract?.(type)
  }

  connectMultiplayer() {
    const host=import.meta.env.VITE_PARTYKIT_HOST
    if(!host){this.callbacks.onNetwork?.('LOCAL');return}
    try {
      this.socket=new PartySocket({host,room:'lobby'})
      this.socket.addEventListener('open',()=>{this.callbacks.onNetwork?.('LIVE');this.sendPlayer('hello')})
      this.socket.addEventListener('close',()=>this.callbacks.onNetwork?.('OFFLINE'))
      this.socket.addEventListener('message',e=>this.onNetworkMessage(e.data))
    } catch { this.callbacks.onNetwork?.('LOCAL') }
  }

  onNetworkMessage(raw) {
    let data; try{data=JSON.parse(raw)}catch{return}
    if(data.type==='snapshot')data.players?.forEach(p=>this.upsertRemote(p))
    if(data.type==='player')this.upsertRemote(data.player)
    if(data.type==='leave')this.removeRemote(data.id)
    if(data.type==='dj')this.callbacks.onDj?.(data.track,true)
  }

  upsertRemote(data) {
    if(!data||data.id===this.socket?.id)return
    let remote=this.remotePlayers.get(data.id)
    if(!remote){remote=createCatAvatar(data.skin||0,true);remote.scale.setScalar(.92);this.remotePlayers.set(data.id,remote);this.scene.add(remote)}
    if(remote.userData.skin!==data.skin)setAvatarSkin(remote,data.skin||0)
    remote.userData.target=new THREE.Vector3(data.x,data.y,data.z)
    remote.userData.targetRy=data.ry||0
  }

  removeRemote(id){const r=this.remotePlayers.get(id);if(r){this.scene.remove(r);this.remotePlayers.delete(id)}}
  sendPlayer(type='move'){if(!this.socket||this.socket.readyState!==WebSocket.OPEN)return;this.socket.send(JSON.stringify({type,player:{name:'ARV GUEST',skin:this.skin,x:this.player.position.x,y:this.player.position.y,z:this.player.position.z,ry:this.player.rotation.y,state:this.playerState}}))}
  setSkin(index){this.skin=index%4;setAvatarSkin(this.player,this.skin);this.sendPlayer('skin')}
  broadcastDj(track){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type:'dj',track}))}
  setMode(mode){this.mode=mode;if(mode==='works'){gsap.to(this.player.position,{x:0,z:-17,duration:.9,ease:'power3.inOut'})}}
  teleport(target){const spots={spawn:[0,0,5.8],works:[0,0,-17],dj:[7.3,0,-7.8],npc:[-6,0,-5.5]};const p=spots[target];if(p)gsap.to(this.player.position,{x:p[0],y:p[1],z:p[2],duration:.85,ease:'power3.inOut'})}

  focusProject(index) {
    const mesh=this.projectMeshes[index]; if(!mesh)return
    this.callbacks.onProject?.(index)
    const target=mesh.position.clone().add(new THREE.Vector3(0,0,10.2).applyEuler(mesh.rotation))
    gsap.to(this.camera.position,{x:target.x,y:mesh.position.y+.2,z:target.z,duration:1.25,ease:'power3.inOut'})
  }

  updatePlayer(dt) {
    const f=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)
    const s=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)
    const moving=Math.abs(f)+Math.abs(s)>0
    const speed=this.keys.has('ShiftLeft')?6.8:4.2
    const forward=new THREE.Vector3(Math.sin(this.yaw),0,-Math.cos(this.yaw))
    const right=new THREE.Vector3(Math.cos(this.yaw),0,Math.sin(this.yaw))
    const move=forward.multiplyScalar(f).add(right.multiplyScalar(s))
    if(move.lengthSq()>0)move.normalize().multiplyScalar(speed*dt)
    this.player.position.add(move)
    this.player.position.x=clamp(this.player.position.x,-27,27)
    this.player.position.z=clamp(this.player.position.z,-75,11)
    this.velocity.y-=13*dt; this.player.position.y+=this.velocity.y*dt
    if(this.player.position.y<=0){this.player.position.y=0;this.velocity.y=0;this.onGround=true}
    if(moving){this.player.rotation.y=Math.atan2(move.x,move.z);this.playerState='walk'} else this.playerState='idle'
    const desired=new THREE.Vector3(this.player.position.x-Math.sin(this.yaw)*7.7,this.player.position.y+3.6+this.pitch*8,this.player.position.z+Math.cos(this.yaw)*7.7)
    this.camera.position.lerp(desired,1-Math.pow(.001,dt))
    this.camera.lookAt(this.player.position.x,this.player.position.y+1.35,this.player.position.z)
    if(performance.now()-this.lastNetwork>75){this.lastNetwork=performance.now();this.sendPlayer('move')}
  }

  updateRemotes(dt){for(const r of this.remotePlayers.values()){if(r.userData.target)r.position.lerp(r.userData.target,1-Math.pow(.005,dt));if(Number.isFinite(r.userData.targetRy))r.rotation.y=lerp(r.rotation.y,r.userData.targetRy,.12)}}
  tick(){const dt=Math.min(this.clock.getDelta(),.05);this.updatePlayer(dt);this.updateRemotes(dt);if(this.npc){this.npc.rotation.y=Math.sin(performance.now()*.0004)*.35+.4;this.npc.position.y=Math.sin(performance.now()*.002)*.035}if(this.pipeline)this.pipeline.render();else this.renderer.render(this.scene,this.camera)}
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight)}
  destroy(){this.renderer?.setAnimationLoop(null);this.socket?.close();this.renderer?.dispose()}
}
