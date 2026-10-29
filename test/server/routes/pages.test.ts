import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import type { AuthUser, User } from '@/types'

// 表示名にスクリプト断片を仕込んだユーザー(XSS ペイロード)
const xssDisplayName = '</script><script>alert(1)</script>'
const mockUser: User = {
  id: 'u1',
  accessEmail: 'basho@example.com',
  displayName: xssDisplayName,
  bio: '俳人です',
  iconUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

vi.mock('@/server/db/client', () => ({
  getDb: () => 'mock-db',
}))

vi.mock('@/server/db/queries', () => ({
  findUserById: () => Promise.resolve(mockUser),
  findUserByEmail: () => Promise.resolve(mockUser),
  getPostById: () =>
    Promise.resolve({
      post: { id: 'p1', line1: '古池や', line2: '蛙飛び込む', line3: '水の音', authorId: 'u1' },
      author: mockUser,
    }),
  getLikeCount: () => Promise.resolve(0),
  hasUserLiked: () => Promise.resolve(false),
  getReactions: () => Promise.resolve([]),
  getUserReaction: () => Promise.resolve(null),
}))

// 認証済みユーザーとして XSS ペイロード付きの user を注入
const authUser: AuthUser = {
  id: 'u1',
  accessEmail: 'basho@example.com',
  displayName: xssDisplayName,
  bio: null,
  iconUrl: null,
}

vi.mock('@/server/middleware/auth', () => ({
  authMiddleware: async (
    c: { set: (k: string, v: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', authUser)
    await next()
  },
  optionalAuthMiddleware: async (
    c: { set: (k: string, v: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', authUser)
    await next()
  },
  getEmailFromHeader: () => 'basho@example.com',
}))

import pagesRoutes from '@/server/routes/pages'

function createApp() {
  const app = new Hono()
  app.route('/', pagesRoutes)
  return app
}

describe('Pages SSR escaping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /users/:id — displayName をエスケープし script ブレイクアウトを防ぐ', async () => {
    const app = createApp()
    const res = await app.request('/users/u1', {}, { DATABASE_URL: 'test' })
    expect(res.status).toBe(200)
    const html = await res.text()
    // 生の </script> は HTML に存在してはならない
    expect(html).not.toContain('</script><script>alert(1)</script>')
    // <title> 内もエスケープされている
    expect(html).toContain('<title>')
    expect(html).toMatch(/<title>[^<]*&lt;\/script&gt;/)
  })

  it('GET /profile — window.__INITIAL_USER__ をブレイクアウト不能にする', async () => {
    const app = createApp()
    const res = await app.request('/profile', {}, { DATABASE_URL: 'test' })
    expect(res.status).toBe(200)
    const html = await res.text()
    // JSON 埋め込み部分に生の </script> が混入しない
    expect(html).not.toContain('</script><script>alert(1)</script>')
    expect(html).toContain('window.__INITIAL_USER__')
  })

  it('GET /posts/:id — 投稿本文の title をエスケープする', async () => {
    const app = createApp()
    const res = await app.request('/posts/p1', {}, { DATABASE_URL: 'test' })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).not.toContain('</script><script>alert(1)</script>')
  })
})
