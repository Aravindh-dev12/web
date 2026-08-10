<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { projects } from './data/projects.js'
import { World } from './scene/World.js'

const canvas = ref(null)
const loaded = ref(false)
const progress = ref(0)
const renderer = ref('INIT')
const network = ref('LOCAL')
const mode = ref('explore')
const selectedProject = ref(null)
const soundOn = ref(false)
const tutorialOpen = ref(true)
const questOpen = ref(false)
const skinOpen = ref(false)
const djOpen = ref(false)
const skin = ref(0)
const currentTrack = ref(0)
const notification = ref('')
const quests = ref([
  { id: 'move', label: 'MOVE THROUGH THE CITY', done: false },
  { id: 'skin', label: 'TRY A DIFFERENT SKIN', done: false },
  { id: 'works', label: 'VISIT THE WORK BILLBOARD', done: false },
  { id: 'dj', label: 'REQUEST A TRACK', done: false }
])
let world, loaderTimer, noticeTimer, audioCtx, master, osc, pulse

const selected = computed(() => selectedProject.value === null ? null : projects[selectedProject.value])
const completed = computed(() => quests.value.filter(q => q.done).length)

function completeQuest(id) {
  const q = quests.value.find(q => q.id === id)
  if (q && !q.done) { q.done = true; flash(`QUEST COMPLETE / ${q.label}`) }
}
function flash(text) { notification.value = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => notification.value = '', 2500) }
function changeMode(next) {
  mode.value = next
  selectedProject.value = null
  tutorialOpen.value = false
  if (next === 'works') { completeQuest('works'); world?.teleport('works') }
  world?.setMode(next)
  nextTick(() => gsap.fromTo('.mode-panel.is-visible', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .65, ease: 'power3.out' }))
}
function openProject(index) { selectedProject.value = index; mode.value = 'works'; completeQuest('works'); world?.focusProject(index) }
function setSkin(index) { skin.value = index; world?.setSkin(index); completeQuest('skin') }
function interact(type) { if (type === 'dj') djOpen.value = true; if (type === 'npc') questOpen.value = true }

function startAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    master = audioCtx.createGain(); master.gain.value = .035; master.connect(audioCtx.destination)
    osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 54
    const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 220
    osc.connect(filter); filter.connect(master); osc.start()
    pulse = setInterval(() => {
      if (!soundOn.value) return
      const now = audioCtx.currentTime
      master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(.02, now); master.gain.linearRampToValueAtTime(.065, now + .025); master.gain.exponentialRampToValueAtTime(.018, now + .28)
    }, 500)
  }
  audioCtx.resume()
}
function toggleSound() {
  soundOn.value = !soundOn.value
  if (soundOn.value) { startAudio(); master.gain.setTargetAtTime(.035, audioCtx.currentTime, .08) }
  else if (audioCtx) master.gain.setTargetAtTime(.0001, audioCtx.currentTime, .08)
}
function playTrack(index, remote = false) {
  currentTrack.value = index
  if (!soundOn.value) toggleSound()
  startAudio()
  osc.frequency.setTargetAtTime([48,55,64,72][index], audioCtx.currentTime, .2)
  completeQuest('dj')
  if (!remote) world?.broadcastDj(index)
  flash(remote ? `DJ SYNC / TRACK 0${index + 1}` : `REQUEST SENT / TRACK 0${index + 1}`)
}

onMounted(async () => {
  loaderTimer = setInterval(() => progress.value = Math.min(progress.value + Math.ceil(Math.random() * 4), 94), 80)
  world = new World({
    canvas: canvas.value,
    projects,
    callbacks: {
      onRenderer: label => renderer.value = label,
      onNetwork: label => network.value = label,
      onProject: openProject,
      onInteract: interact,
      onDj: playTrack,
      onReady: () => {
        clearInterval(loaderTimer); progress.value = 100
        setTimeout(() => {
          loaded.value = true
          nextTick(() => {
            gsap.from('.hud > *', { opacity: 0, y: -16, stagger: .055, duration: .75, ease: 'power3.out' })
            gsap.from('.identity > *', { opacity: 0, x: -22, stagger: .065, duration: .8, ease: 'power3.out' })
          })
        }, 480)
      }
    }
  })
  await world.init()
  window.addEventListener('keydown', e => { if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) completeQuest('move') }, { once: true })
})

onBeforeUnmount(() => {
  clearInterval(loaderTimer); clearInterval(pulse); clearTimeout(noticeTimer); world?.destroy(); audioCtx?.close()
})
</script>

<template>
  <main class="experience">
    <canvas ref="canvas" class="world-canvas" aria-label="Interactive cyberpunk portfolio world" />
    <div class="crt"></div><div class="grain"></div>

    <Transition name="loader">
      <section v-if="!loaded" class="boot">
        <div class="boot-logo">ARV°<span>26′</span></div>
        <div class="boot-jp">リアルタイム・グラフィックス・システム</div>
        <div class="boot-track"><i :style="{ width: `${progress}%` }"></i></div>
        <div class="boot-meta"><span>LOADING GEN-02 WORLD</span><strong>{{ String(progress).padStart(3, '0') }}%</strong></div>
      </section>
    </Transition>

    <template v-if="loaded">
      <header class="hud">
        <button class="brand-mini" @click="changeMode('explore')">ARV°26′</button>
        <nav>
          <button :class="{ active: mode === 'explore' }" @click="changeMode('explore')">EXPLORE</button>
          <button :class="{ active: mode === 'works' }" @click="changeMode('works')">WORKS</button>
          <button :class="{ active: mode === 'about' }" @click="changeMode('about')">ABOUT</button>
        </nav>
        <div class="hud-right">
          <button class="icon-btn" :class="{ active: soundOn }" @click="toggleSound">{{ soundOn ? '◼' : '▷' }}</button>
          <button class="icon-btn" @click="skinOpen = !skinOpen">◉</button>
          <div class="perf"><i></i><span>{{ renderer }} / {{ network }}</span></div>
        </div>
      </header>

      <aside class="identity">
        <h1>ARV°26′</h1><p class="jp">クリエイティブテクノロジスト</p><p>CREATIVE GRAPHICS ENGINEER<br>& EXPERIENCE DEVELOPER<br>BASED IN DIGITAL SPACE</p>
      </aside>

      <section class="controls">
        <div class="keys"><i></i><kbd>W</kbd><i></i><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div>
        <div><b>CONTROL</b><span>MOVE</span></div><kbd class="space">SPACE</kbd><div><b>JUMP</b><span>INTERACT / CLICK</span></div>
      </section>

      <section v-if="mode === 'about'" class="mode-panel about-panel is-visible">
        <button class="close" @click="changeMode('explore')">×</button><div class="panel-index">ABOUT / 00</div>
        <h2>BUILDING<br>REALTIME<br>WORLDS.</h2>
        <p>Creative development focused on WebGPU, WebGL, Three.js, shader systems, immersive interfaces and playful interaction.</p>
        <dl><dt>STACK</dt><dd>VUE / THREE.JS / TSL / GSAP / PARTYKIT</dd><dt>FOCUS</dt><dd>INTERACTIVE 3D / CREATIVE TECHNOLOGY / EXPERIENCE DESIGN</dd><dt>STATUS</dt><dd>AVAILABLE FOR SELECT COLLABORATIONS</dd></dl>
      </section>

      <section v-if="mode === 'works'" class="mode-panel works-panel is-visible">
        <div class="works-head"><div><span>SELECTED WORK / GEN-02</span><h2>{{ selected ? selected.title : 'WORKS' }}</h2></div><button class="close" @click="changeMode('explore')">×</button></div>
        <template v-if="!selected">
          <button v-for="(project,index) in projects" :key="project.id" class="work-row" @click="openProject(index)"><span>{{ project.index }}</span><strong>{{ project.title }}</strong><em>{{ project.subtitle }}</em><b>{{ project.year }}</b><i>↗</i></button>
        </template>
        <template v-else>
          <div class="work-detail"><div><p>{{ selected.description }}</p><small>{{ selected.disciplines }}</small></div><div class="detail-actions"><button @click="selectedProject = null">← ALL WORK</button><button>OPEN CASE STUDY ↗</button></div></div>
        </template>
      </section>

      <aside v-if="tutorialOpen" class="tutorial">
        <button @click="tutorialOpen = false">×</button><span>TUTORIAL / 01</span><h3>WELCOME TO<br>GEN-02.</h3><p>Use WASD to move. Drag the world to look. Click characters, the DJ booth and project displays to interact.</p><button class="primary" @click="tutorialOpen = false">ENTER WORLD</button>
      </aside>

      <aside v-if="questOpen" class="floating-card quest-card"><button class="close" @click="questOpen = false">×</button><span>NPC / QUEST LOG</span><h3>WORLD CHECKLIST</h3><div v-for="q in quests" :key="q.id" class="quest" :class="{ done: q.done }"><i>{{ q.done ? '✓' : '○' }}</i>{{ q.label }}</div><strong>{{ completed }}/{{ quests.length }} COMPLETE</strong></aside>

      <aside v-if="skinOpen" class="floating-card skin-card"><button class="close" @click="skinOpen = false">×</button><span>AVATAR / SKINS</span><h3>SELECT SIGNAL</h3><div class="skin-grid"><button v-for="n in 4" :key="n" :class="[`skin-${n-1}`, { active: skin === n-1 }]" @click="setSkin(n-1)"><i></i><b>0{{ n }}</b></button></div></aside>

      <aside v-if="djOpen" class="floating-card dj-card"><button class="close" @click="djOpen = false">×</button><span>DJ BOOTH / PERSONAL FEED</span><h3>REQUEST TRACK</h3><button v-for="n in 4" :key="n" class="track" :class="{ active: currentTrack === n-1 }" @click="playTrack(n-1)"><span>0{{ n }}</span><b>SIGNAL {{ ['NIGHT','VOID','PULSE','RAIN'][n-1] }}</b><i>▶</i></button></aside>

      <button class="quest-button" @click="questOpen = !questOpen"><i>{{ completed }}</i> QUEST</button>
      <button class="dj-button" @click="world?.teleport('dj'); djOpen = true">DJ</button>
      <footer class="footer-ui"><span>ARV / GEN-02</span><span>WASD + SPACE / DRAG TO LOOK</span><span>{{ renderer }} · {{ network }}</span></footer>
      <Transition name="notice"><div v-if="notification" class="notice">{{ notification }}</div></Transition>
    </template>
  </main>
</template>
