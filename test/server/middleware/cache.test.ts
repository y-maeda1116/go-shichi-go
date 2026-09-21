import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { cacheMiddleware } from '@/server/middleware/cache'

describe('cacheMiddleware', () => {
  function createApp(maxAge: number, sMaxAge?: number) {
    const app = new Hono()
    app.get('/ok', cacheMiddleware(maxAge, sMaxAge), (c) => c.json({ ok: true }))
    app.get('/error', cacheMiddleware(maxAge, sMaxAge), (c) => {
      return c.json({ error: 'fail' }, 500)
    })
    app.get('/not-found', cacheMiddleware(maxAge, sMaxAge), (c) => {
      return c.json({ error: 'not found' }, 404)
    })
    return app
  }

  it('sets Cache-Control with max-age only', async () => {
    const app = createApp(30)
    const res = await app.request('/ok')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30')
  })

  it('sets Cache-Control with both max-age and s-maxage', async () => {
    const app = createApp(30, 60)
    const res = await app.request('/ok')
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=30, s-maxage=60')
  })

  it('sets no-store for 500 errors', async () => {
    const app = createApp(30, 60)
    const res = await app.request('/error')
    expect(res.status).toBe(500)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('sets no-store for 404 errors', async () => {
    const app = createApp(30, 60)
    const res = await app.request('/not-found')
    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
