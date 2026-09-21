import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { User } from '@/types'

const mockUser: User = {
  id: 'u1',
  accessEmail: 'basho@example.com',
  displayName: '芭蕉',
  bio: '俳人です',
  iconUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

vi.mock('@/server/db/client', () => ({
  getDb: () => 'mock-db',
}))

vi.mock('@/server/db/queries', () => ({
  findUserById: (_db: unknown, id: string) => {
    if (id === 'not-found') return Promise.resolve(null)
    return Promise.resolve(mockUser)
  },
  getUserPosts: () => Promise.resolve({ data: [], nextCursor: null }),
  findUserByEmail: () => Promise.resolve(mockUser),
  createUser: (_db: unknown, data: Record<string, unknown>) =>
    Promise.resolve({ ...mockUser, ...data }),
  updateUser: (_db: unknown, _id: string, data: Record<string, unknown>) =>
    Promise.resolve({ ...mockUser, ...data }),
}))

vi.mock('@/server/middleware/auth', () => ({
  authMiddleware: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'u1', accessEmail: 'test@example.com', displayName: 'テスト', bio: null, iconUrl: null })
    await next()
  },
}))

import usersRoutes from '@/server/routes/users'

function createApp() {
  const app = new Hono()
  app.route('/api/users', usersRoutes)
  return app
}

describe('Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/users/:id', () => {
    it('returns user profile', async () => {
      const app = createApp()
      const res = await app.request('/api/users/u1', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.displayName).toBe('芭蕉')
      expect(body.data.bio).toBe('俳人です')
    })

    it('returns 404 for non-existent user', async () => {
      const app = createApp()
      const res = await app.request('/api/users/not-found', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('ユーザーが見つかりません')
    })
  })

  describe('GET /api/users/:id/posts', () => {
    it('returns user posts', async () => {
      const app = createApp()
      const res = await app.request('/api/users/u1/posts', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.data).toEqual([])
      expect(body.data.nextCursor).toBeNull()
    })
  })

  describe('PUT /api/users/me', () => {
    it('updates user profile', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/users/me',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: '松尾芭蕉', bio: '奥の細道' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('rejects empty displayName', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/users/me',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: '  ' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('表示名は必須です')
    })
  })
})
