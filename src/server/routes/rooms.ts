import { Hono } from 'hono'
import { authMiddleware } from '@/server/middleware/auth'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import type { AuthUser } from '@/types'

const rooms = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

rooms.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const rows = await queries.getActiveRooms(db)

  const data = rows.map(row => ({
    ...row.room,
    creator: row.creator,
    lineCount: row.lineCount,
  }))

  return c.json({ success: true, data })
})

rooms.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = getDb(c.env.DATABASE_URL)
  const room = await queries.createRoom(db, user.id)
  return c.json({ success: true, data: room }, 201)
})

rooms.get('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const roomId = c.req.param('id')
  const room = await queries.getRoomById(db, roomId)

  if (!room) {
    return c.json({ success: false, error: 'ルームが見つかりません' }, 404)
  }

  const lines = await queries.getRoomLines(db, roomId)

  return c.json({
    success: true,
    data: {
      ...room,
      lines: lines.map(l => ({
        ...l.line,
        author: l.author,
      })),
    },
  })
})

rooms.post('/:id/lines', authMiddleware, async (c) => {
  const user = c.get('user')
  const roomId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)
  const body = await c.req.json() as { line: string }

  if (!body.line) {
    return c.json({ success: false, error: '行を入力してください' }, 400)
  }

  const room = await queries.getRoomById(db, roomId)
  if (!room) {
    return c.json({ success: false, error: 'ルームが見つかりません' }, 404)
  }
  if (room.status === 'closed') {
    return c.json({ success: false, error: 'このルームは終了しています' }, 400)
  }

  const existingLines = await queries.getRoomLines(db, roomId)
  const lineNumber = existingLines.length + 1

  if (lineNumber > 5) {
    return c.json({ success: false, error: 'このルームは5行で完成しています' }, 400)
  }

  const line = await queries.addRoomLine(db, roomId, user.id, body.line, lineNumber)
  return c.json({ success: true, data: line }, 201)
})

rooms.post('/:id/close', authMiddleware, async (c) => {
  const user = c.get('user')
  const roomId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)

  const room = await queries.getRoomById(db, roomId)
  if (!room) {
    return c.json({ success: false, error: 'ルームが見つかりません' }, 404)
  }
  if (room.createdBy !== user.id) {
    return c.json({ success: false, error: '作成者のみ終了できます' }, 403)
  }

  const closed = await queries.closeRoom(db, roomId)
  return c.json({ success: true, data: closed })
})

export default rooms
