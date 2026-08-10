const players = new Map()
const MAX_NAME = 24

function safePlayer(raw, id) {
  return {
    id,
    name: String(raw?.name || 'GUEST').slice(0, MAX_NAME),
    skin: Math.max(0, Math.min(3, Number(raw?.skin) || 0)),
    x: Number(raw?.x) || 0,
    y: Number(raw?.y) || 0,
    z: Number(raw?.z) || 0,
    ry: Number(raw?.ry) || 0,
    state: String(raw?.state || 'idle').slice(0, 16),
    updatedAt: Date.now()
  }
}

export default class Server {
  constructor(room) {
    this.room = room
  }

  onConnect(conn) {
    conn.send(JSON.stringify({ type: 'snapshot', players: [...players.values()] }))
  }

  onMessage(message, sender) {
    let data
    try { data = JSON.parse(String(message)) } catch { return }

    if (data.type === 'hello' || data.type === 'move' || data.type === 'skin') {
      const player = safePlayer(data.player, sender.id)
      players.set(sender.id, player)
      this.room.broadcast(JSON.stringify({ type: 'player', player }), [sender.id])
      return
    }

    if (data.type === 'dj') {
      this.room.broadcast(JSON.stringify({
        type: 'dj',
        by: sender.id,
        track: Math.max(0, Math.min(3, Number(data.track) || 0)),
        at: Date.now()
      }))
    }
  }

  onClose(conn) {
    players.delete(conn.id)
    this.room.broadcast(JSON.stringify({ type: 'leave', id: conn.id }))
  }
}
