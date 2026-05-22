import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

const mockTheme = {
  id: '1',
  date: '2026-05-22',
  themeText: '五月晴れ',
  description: '初夏の天気',
  createdAt: new Date(),
}

vi.mock('@/server/db/client', () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([mockTheme]),
        }),
      }),
    }),
  }),
}))

import themesRoutes from '@/server/routes/themes'

describe('themes API', () => {
  it('GET /api/themes/today returns today theme', async () => {
    const app = new Hono()
    app.route('/api/themes', themesRoutes)

    const res = await app.request('/api/themes/today', {}, { DATABASE_URL: 'test' })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.themeText).toBe('五月晴れ')
    expect(body.data.description).toBe('初夏の天気')
  })

  it('GET /api/themes/:date returns theme for specific date', async () => {
    const app = new Hono()
    app.route('/api/themes', themesRoutes)

    const res = await app.request('/api/themes/2026-05-22', {}, { DATABASE_URL: 'test' })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.themeText).toBe('五月晴れ')
  })
})
