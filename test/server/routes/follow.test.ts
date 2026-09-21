import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

let shouldThrowOnFollow = false

vi.mock('@/server/db/client', () => ({
  getDb: () => 'mock-db',
}))

vi.mock('@/server/db/follow-queries', () => ({
  followUser: () => {
    if (shouldThrowOnFollow) throw new Error('unique constraint')
    return Promise.resolve(true)
  },
  unfollowUser: () => Promise.resolve(true),
  isFollowing: () => Promise.resolve(true),
  getFollowerCount: () => Promise.resolve(10),
  getFollowingCount: () => Promise.resolve(5),
}))

vi.mock('@/server/middleware/auth', () => ({
  authMiddleware: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'u1', accessEmail: 'test@example.com', displayName: 'テスト', bio: null, iconUrl: null })
    await next()
  },
}))

import followRoutes from '@/server/routes/follow'

function createApp() {
  const app = new Hono()
  app.route('/api/follow', followRoutes)
  return app
}

describe('Follow API', () => {
  beforeEach(() => {
    shouldThrowOnFollow = false
  })

  describe('POST /api/follow/:userId', () => {
    it('follows a user successfully', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/follow/u2',
        { method: 'POST' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('returns 400 when already following', async () => {
      shouldThrowOnFollow = true

      const app = createApp()
      const res = await app.request(
        '/api/follow/u2',
        { method: 'POST' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('すでにフォローしています')
    })
  })

  describe('DELETE /api/follow/:userId', () => {
    it('unfollows a user successfully', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/follow/u2',
        { method: 'DELETE' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })
  })

  describe('GET /api/follow/status/:userId', () => {
    it('returns follow status', async () => {
      const app = createApp()
      const res = await app.request('/api/follow/status/u2', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.following).toBe(true)
      expect(body.data.followers).toBe(10)
      expect(body.data.followingCount).toBe(5)
    })
  })
})
