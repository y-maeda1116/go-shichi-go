import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { errorHandler } from '@/server/middleware/error'

describe('errorHandler', () => {
  it('returns JSON error for API routes', async () => {
    const app = new Hono()
    app.onError(errorHandler)
    app.get('/api/something', () => {
      throw new Error('test error')
    })

    const res = await app.request('/api/something')
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('サーバーエラーが発生しました')
  })

  it('returns HTML error for non-API routes', async () => {
    const app = new Hono()
    app.onError(errorHandler)
    app.get('/pages/home', () => {
      throw new Error('test error')
    })

    const res = await app.request('/pages/home')
    expect(res.status).toBe(500)

    const body = await res.text()
    expect(body).toContain('500 Internal Server Error')
  })
})
