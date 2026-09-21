import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockRoom = {
  id: 'room1',
  createdBy: 'u1',
  status: 'active',
  createdAt: new Date(),
}

const mockRoomLine = {
  id: 'rl1',
  roomId: 'room1',
  userId: 'u1',
  line: '古池や',
  lineNumber: 1,
  createdAt: new Date(),
}

vi.mock('@/server/db/client', () => ({
  getDb: () => 'mock-db',
}))

vi.mock('@/server/db/queries', () => ({
  getActiveRooms: () =>
    Promise.resolve([
      { room: mockRoom, creator: { id: 'u1', displayName: '芭蕉' }, lineCount: 1 },
    ]),
  createRoom: () => Promise.resolve(mockRoom),
  getRoomById: (_db: unknown, id: string) => {
    if (id === 'not-found') return Promise.resolve(null)
    if (id === 'closed-room') return Promise.resolve({ ...mockRoom, status: 'closed' })
    return Promise.resolve(mockRoom)
  },
  getRoomLines: (_db: unknown, roomId: string) => {
    if (roomId === 'full-room') {
      return Promise.resolve([
        { line: { ...mockRoomLine, lineNumber: 1 }, author: { id: 'u1', displayName: '芭蕉' } },
        { line: { ...mockRoomLine, lineNumber: 2 }, author: { id: 'u2', displayName: '蕪村' } },
        { line: { ...mockRoomLine, lineNumber: 3 }, author: { id: 'u1', displayName: '芭蕉' } },
        { line: { ...mockRoomLine, lineNumber: 4 }, author: { id: 'u2', displayName: '蕪村' } },
        { line: { ...mockRoomLine, lineNumber: 5 }, author: { id: 'u1', displayName: '芭蕉' } },
      ])
    }
    return Promise.resolve([
      { line: mockRoomLine, author: { id: 'u1', displayName: '芭蕉' } },
    ])
  },
  addRoomLine: (_db: unknown, roomId: string, userId: string, line: string, lineNumber: number) =>
    Promise.resolve({ id: 'rl-new', roomId, userId, line, lineNumber, createdAt: new Date() }),
  closeRoom: (_db: unknown, roomId: string) =>
    Promise.resolve({ ...mockRoom, id: roomId, status: 'closed' }),
}))

vi.mock('@/server/middleware/auth', () => ({
  authMiddleware: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'u1', accessEmail: 'test@example.com', displayName: 'テスト', bio: null, iconUrl: null })
    await next()
  },
}))

import roomsRoutes from '@/server/routes/rooms'

function createApp() {
  const app = new Hono()
  app.route('/api/rooms', roomsRoutes)
  return app
}

describe('Rooms API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/rooms', () => {
    it('returns active rooms', async () => {
      const app = createApp()
      const res = await app.request('/api/rooms', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].lineCount).toBe(1)
    })
  })

  describe('POST /api/rooms', () => {
    it('creates a new room', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/rooms',
        { method: 'POST' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.status).toBe('active')
    })
  })

  describe('GET /api/rooms/:id', () => {
    it('returns room with lines', async () => {
      const app = createApp()
      const res = await app.request('/api/rooms/room1', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.lines).toHaveLength(1)
      expect(body.data.lines[0].line).toBe('古池や')
    })

    it('returns 404 for non-existent room', async () => {
      const app = createApp()
      const res = await app.request('/api/rooms/not-found', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('ルームが見つかりません')
    })
  })

  describe('POST /api/rooms/:id/lines', () => {
    it('adds a line to an active room', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/rooms/room1/lines',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line: '蛙飛び込む' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('rejects empty line', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/rooms/room1/lines',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line: '' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('行を入力してください')
    })

    it('rejects line for non-existent room', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/rooms/not-found/lines',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line: 'test' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(404)
    })

    it('rejects line for closed room', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/rooms/closed-room/lines',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line: 'test' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('このルームは終了しています')
    })
  })

  describe('POST /api/rooms/:id/close', () => {
    it('closes an active room', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/rooms/room1/close',
        { method: 'POST' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.status).toBe('closed')
    })

    it('returns 404 for non-existent room', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/rooms/not-found/close',
        { method: 'POST' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(404)
    })
  })
})
