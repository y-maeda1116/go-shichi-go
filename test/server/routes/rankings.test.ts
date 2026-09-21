import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'

const mockRankedPosts = [
  { id: 'p1', line1: '古池や', line2: '蛙飛び込む', line3: '水の音', likeCount: 10, author: { displayName: '芭蕉' } },
]

vi.mock('@/server/db/client', () => ({
  getDb: () => 'mock-db',
}))

vi.mock('@/server/db/queries', () => ({
  getRankedPosts: (_db: unknown, period: string) => {
    if (period === 'empty') return Promise.resolve([])
    return Promise.resolve(mockRankedPosts)
  },
  getUserStreak: () => Promise.resolve({ currentStreak: 5, maxStreak: 10 }),
}))

import rankingsRoutes from '@/server/routes/rankings'

function createApp() {
  const app = new Hono()
  app.route('/api/rankings', rankingsRoutes)
  return app
}

describe('Rankings API', () => {
  it('GET /api/rankings/weekly returns weekly rankings', async () => {
    const app = createApp()
    const res = await app.request('/api/rankings/weekly', {}, { DATABASE_URL: 'test' })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].likeCount).toBe(10)
  })

  it('GET /api/rankings/monthly returns monthly rankings', async () => {
    const app = createApp()
    const res = await app.request('/api/rankings/monthly', {}, { DATABASE_URL: 'test' })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('GET /api/rankings/streak/:userId returns streak data', async () => {
    const app = createApp()
    const res = await app.request('/api/rankings/streak/u1', {}, { DATABASE_URL: 'test' })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.currentStreak).toBe(5)
    expect(body.data.maxStreak).toBe(10)
  })
})
