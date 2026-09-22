import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockPost = {
  post: { id: 'p1', userId: 'u1' },
  author: { id: 'u1', displayName: '芭蕉' },
}

const mockReply = {
  id: 'r1',
  postId: 'p1',
  userId: 'u2',
  line1: '閑さや',
  line2: '岩にしみ入る',
  line3: '蝉の声',
  createdAt: new Date(),
}

vi.mock('@/server/db/client', () => ({
  getDb: () => 'mock-db',
}))

vi.mock('@/server/db/queries', () => ({
  getReplies: () =>
    Promise.resolve([
      { reply: mockReply, author: { id: 'u2', displayName: '蕪村', iconUrl: null } },
    ]),
  createReply: (_db: unknown, data: Record<string, unknown>) =>
    Promise.resolve({ ...mockReply, ...data }),
  deleteReply: (_db: unknown, id: string, _userId: string) =>
    Promise.resolve(id !== 'not-found'),
  getPostById: (_db: unknown, id: string) => {
    if (id === 'not-found') return Promise.resolve(null)
    return Promise.resolve(mockPost)
  },
}))

vi.mock('@/server/middleware/auth', () => ({
  authMiddleware: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'u2', accessEmail: 'test@example.com', displayName: 'テスト', bio: null, iconUrl: null })
    await next()
  },
}))

import repliesRoutes from '@/server/routes/replies'

function createApp() {
  const app = new Hono()
  app.route('/api/replies', repliesRoutes)
  return app
}

describe('Replies API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/replies/:postId/replies', () => {
    it('returns replies for a post', async () => {
      const app = createApp()
      const res = await app.request('/api/replies/p1/replies', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].line1).toBe('閑さや')
    })
  })

  describe('POST /api/replies/:postId/replies', () => {
    it('creates a reply with valid input', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/replies/p1/replies',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line1: '閑さや',
            line2: '岩にしみ入る',
            line3: '蝉の声',
          }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('rejects empty lines', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/replies/p1/replies',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line1: '', line2: 'test', line3: 'test' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('三行すべて入力してください')
    })

    it('rejects lines exceeding 20 characters', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/replies/p1/replies',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line1: 'あ'.repeat(21),
            line2: 'test',
            line3: 'test',
          }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('各行は20文字以内で入力してください')
    })

    it('returns 404 for non-existent post', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/replies/not-found/replies',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line1: 'test',
            line2: 'test',
            line3: 'test',
          }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/replies/:replyId', () => {
    it('deletes an existing reply', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/replies/r1',
        { method: 'DELETE' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('returns 404 for non-existent reply', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/replies/not-found',
        { method: 'DELETE' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toBe('削除できませんでした')
    })
  })
})
