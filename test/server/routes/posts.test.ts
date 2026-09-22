import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { Post, User } from '@/types'

const mockUser: User = {
  id: 'u1',
  accessEmail: 'basho@example.com',
  displayName: '芭蕉',
  bio: null,
  iconUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPost: Post = {
  id: 'p1',
  userId: 'u1',
  type: 'haiku',
  line1: '古池や',
  line2: '蛙飛び込む',
  line3: '水の音',
  line4: null,
  line5: null,
  authorNote: null,
  imageUrl: null,
  seasonWord: null,
  createdAt: new Date(),
}

const mockPostWithAuthor = {
  post: mockPost,
  author: { id: 'u1', displayName: '芭蕉', iconUrl: null },
}

const dbMock = {
  timelineResult: { data: [mockPostWithAuthor], nextCursor: null },
  postById: mockPostWithAuthor,
  likeCount: 5,
  likedByMe: false,
  reactions: {} as Record<string, number>,
  myReaction: null,
}

vi.mock('@/server/db/client', () => ({
  getDb: () => 'mock-db',
}))

vi.mock('@/server/db/queries', () => ({
  getTimelinePosts: (_db: unknown, cursor?: string, season?: string) => {
    if (season === 'empty') return Promise.resolve({ data: [], nextCursor: null })
    return Promise.resolve(dbMock.timelineResult)
  },
  getPostById: (_db: unknown, id: string) => {
    if (id === 'not-found') return Promise.resolve(null)
    return Promise.resolve(dbMock.postById)
  },
  getLikeCount: () => Promise.resolve(dbMock.likeCount),
  hasUserLiked: () => Promise.resolve(dbMock.likedByMe),
  getReactions: () => Promise.resolve(dbMock.reactions),
  getUserReaction: () => Promise.resolve(dbMock.myReaction),
  getReactionsBatch: () => Promise.resolve(new Map()),
  getUserReactionsBatch: () => Promise.resolve(new Map()),
  createPost: (_db: unknown, data: Record<string, unknown>) =>
    Promise.resolve({ ...mockPost, ...data }),
  deletePost: (_db: unknown, id: string, _userId: string) =>
    Promise.resolve(id !== 'not-found'),
  toggleLike: () => Promise.resolve('liked'),
  toggleReaction: (_db: unknown, userId: string, postId: string, reactionType: string) =>
    Promise.resolve({ action: 'added' as const, reactionType }),
}))

vi.mock('@/server/middleware/auth', () => ({
  authMiddleware: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'u1', accessEmail: 'test@example.com', displayName: 'テスト', bio: null, iconUrl: null })
    await next()
  },
  optionalAuthMiddleware: async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'u1', accessEmail: 'test@example.com', displayName: 'テスト', bio: null, iconUrl: null })
    await next()
  },
}))

vi.mock('@/server/middleware/cache', () => ({
  cacheMiddleware: () => async (_c: unknown, next: () => Promise<void>) => {
    await next()
  },
}))

vi.mock('@/server/utils/share-image', () => ({
  generateShareSvg: () => '<svg>mock</svg>',
}))

import postsRoutes from '@/server/routes/posts'

function createApp() {
  const app = new Hono()
  app.route('/api/posts', postsRoutes)
  return app
}

describe('Posts API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/posts', () => {
    it('returns timeline posts', async () => {
      const app = createApp()
      const res = await app.request('/api/posts', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.data).toHaveLength(1)
      expect(body.data.data[0].line1).toBe('古池や')
    })

    it('returns nextCursor as null when no more pages', async () => {
      const app = createApp()
      const res = await app.request('/api/posts', {}, { DATABASE_URL: 'test' })

      const body = await res.json()
      expect(body.data.nextCursor).toBeNull()
    })
  })

  describe('GET /api/posts/:id', () => {
    it('returns a single post', async () => {
      const app = createApp()
      const res = await app.request('/api/posts/p1', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.line1).toBe('古池や')
      expect(body.data.likeCount).toBe(5)
    })

    it('returns 404 for non-existent post', async () => {
      const app = createApp()
      const res = await app.request('/api/posts/not-found', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('投稿が見つかりません')
    })
  })

  describe('POST /api/posts', () => {
    it('creates a new haiku post', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/posts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line1: '古池や',
            line2: '蛙飛び込む',
            line3: '水の音',
          }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('rejects invalid input (empty line1)', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/posts',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line1: '',
            line2: '蛙飛び込む',
            line3: '水の音',
          }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
    })
  })

  describe('DELETE /api/posts/:id', () => {
    it('deletes an existing post', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/posts/p1',
        { method: 'DELETE' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('returns 404 for non-existent post', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/posts/not-found',
        { method: 'DELETE' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/posts/:id/like', () => {
    it('toggles like on a post', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/posts/p1/like',
        { method: 'POST' },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.action).toBe('liked')
    })
  })

  describe('POST /api/posts/:id/react', () => {
    it('adds a reaction with valid type', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/posts/p1/react',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reactionType: 'heart' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })

    it('rejects invalid reaction type', async () => {
      const app = createApp()
      const res = await app.request(
        '/api/posts/p1/react',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reactionType: 'invalid' }),
        },
        { DATABASE_URL: 'test' },
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toBe('Invalid reaction type')
    })
  })

  describe('GET /api/posts/:id/share-image', () => {
    it('returns SVG share image', async () => {
      const app = createApp()
      const res = await app.request('/api/posts/p1/share-image', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('image/svg+xml')
      const text = await res.text()
      expect(text).toContain('svg')
    })

    it('defaults to washi style', async () => {
      const app = createApp()
      const res = await app.request('/api/posts/p1/share-image', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
    })

    it('supports modern style', async () => {
      const app = createApp()
      const res = await app.request('/api/posts/p1/share-image?style=modern', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(200)
    })

    it('returns 404 for non-existent post', async () => {
      const app = createApp()
      const res = await app.request('/api/posts/not-found/share-image', {}, { DATABASE_URL: 'test' })

      expect(res.status).toBe(404)
    })
  })
})
