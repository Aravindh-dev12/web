import * as THREE from 'three/webgpu'

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  draw(ctx, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

export function makeProjectTexture(project, variant = 0) {
  return canvasTexture(1200, 700, (ctx, w, h) => {
    const accent = project.accent
    ctx.fillStyle = variant === 0 ? '#141116' : '#07090c'
    ctx.fillRect(0, 0, w, h)
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, `${accent}cc`)
    grad.addColorStop(.46, `${accent}24`)
    grad.addColorStop(1, '#07080b')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    for (let i = 0; i < 28; i++) {
      const x = (i * 137 + variant * 83) % w
      const y = (i * 79 + variant * 31) % h
      ctx.globalAlpha = .08 + (i % 4) * .025
      ctx.fillStyle = i % 3 ? '#ffffff' : accent
      ctx.fillRect(x, y, 3 + (i % 5) * 3, 40 + (i % 7) * 16)
    }
    ctx.globalAlpha = 1

    ctx.strokeStyle = `${accent}aa`
    ctx.lineWidth = 2
    ctx.strokeRect(34, 34, w - 68, h - 68)
    ctx.strokeStyle = 'rgba(255,255,255,.22)'
    ctx.beginPath()
    ctx.moveTo(34, 152); ctx.lineTo(w - 34, 152)
    ctx.moveTo(760, 34); ctx.lineTo(760, h - 34)
    ctx.stroke()

    ctx.fillStyle = '#f4f3f5'
    ctx.font = '900 82px Arial Black, Arial'
    ctx.fillText(project.title, 68, 128)
    ctx.font = '700 28px Arial'
    ctx.fillStyle = accent
    ctx.fillText(project.subtitle, 70, 202)

    ctx.fillStyle = 'rgba(255,255,255,.72)'
    ctx.font = '600 20px monospace'
    ctx.fillText(`ARV / GEN-02 / ${project.index}`, 70, 252)
    ctx.fillText(project.disciplines, 70, 292)
    ctx.fillText(`YEAR ${project.year}`, 70, 332)

    const cx = 920, cy = 360
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 8
    ctx.beginPath(); ctx.arc(cx, cy, 118, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = accent
    ctx.lineWidth = 3
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * 148, cy + Math.sin(a) * 148)
      ctx.lineTo(cx + Math.cos(a) * 190, cy + Math.sin(a) * 190)
      ctx.stroke()
    }
    ctx.fillStyle = accent
    ctx.font = '900 120px Arial Black, Arial'
    ctx.textAlign = 'center'
    ctx.fillText(project.index, cx, cy + 40)
    ctx.textAlign = 'left'

    ctx.font = '500 18px monospace'
    ctx.fillStyle = 'rgba(255,255,255,.58)'
    ctx.fillText('SELECT / ENTER TO OPEN', 70, h - 78)
    ctx.fillText('REALTIME GRAPHICS ENGINE', 760, h - 78)
  })
}

export function makeSystemTexture(title, accent = '#62ffd8', seed = 0) {
  return canvasTexture(900, 470, (ctx, w, h) => {
    ctx.fillStyle = '#07100f'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = accent
    ctx.lineWidth = 2
    ctx.strokeRect(22, 22, w - 44, h - 44)
    ctx.fillStyle = accent
    ctx.font = '900 54px Arial Black, Arial'
    ctx.fillText(title, 48, 82)
    ctx.fillStyle = 'rgba(255,255,255,.72)'
    ctx.font = '600 15px monospace'
    const labels = ['RENDER PIPELINE', 'USER PORT', 'LIVE SESSION', 'GPU BUFFER', 'NETWORK SYNC', 'TSL NODE GRAPH']
    labels.forEach((label, i) => {
      const y = 130 + i * 48
      ctx.fillText(label, 48, y)
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.18)' : `${accent}66`
      ctx.beginPath(); ctx.moveTo(240, y - 7); ctx.lineTo(760 - ((i + seed) % 4) * 44, y - 7); ctx.stroke()
    })
    ctx.font = '900 88px Arial Black, Arial'
    ctx.fillStyle = `${accent}dd`
    ctx.fillText(String(90 + seed).padStart(3, '0'), 700, 112)
  })
}

export function makeSignTexture(text, accent = '#ff174c', dark = '#08070a') {
  return canvasTexture(640, 180, (ctx, w, h) => {
    ctx.fillStyle = dark
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = accent
    ctx.lineWidth = 4
    ctx.strokeRect(8, 8, w - 16, h - 16)
    ctx.fillStyle = accent
    ctx.font = '900 64px Arial Black, Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + 3)
  })
}
