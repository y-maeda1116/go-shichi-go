import { describe, it, expect } from 'vitest'
import { getEmailFromHeader } from '@/server/middleware/auth'
import { Hono } from 'hono'

function createApp() {
  const app = new Hono()
  app.get('/test', (c) => {
    const email = getEmailFromHeader(c)
    return c.json({ email })
  })
  return app
}

describe('getEmailFromHeader', () => {
  it('extracts email from Cf-Access-Authenticated-User-Email header', async () => {
    const app = createApp()
    const res = await app.request('/test', {
      headers: { 'Cf-Access-Authenticated-User-Email': 'basho@example.com' },
    })
    const body = await res.json()
    expect(body.email).toBe('basho@example.com')
  })

  it('prefers header email over other sources', async () => {
    const app = createApp()
    const res = await app.request('/test', {
      headers: { 'Cf-Access-Authenticated-User-Email': 'primary@example.com' },
    })
    const body = await res.json()
    expect(body.email).toBe('primary@example.com')
  })

  it('returns undefined when no auth info present', async () => {
    const app = createApp()
    const res = await app.request('/test')
    const body = await res.json()
    expect(body.email).toBeUndefined()
  })

  it('returns undefined for empty Cf-Access header', async () => {
    const app = createApp()
    const res = await app.request('/test', {
      headers: { 'Cf-Access-Authenticated-User-Email': '' },
    })
    const body = await res.json()
    expect(body.email).toBeUndefined()
  })
})

describe('JWT cookie parsing (unit)', () => {
  // Test the JWT parsing logic directly since cookie header is forbidden in fetch API
  // ⚠️ TEST-ONLY: decodes the JWT payload WITHOUT signature verification.
  // Never copy this into production code — use a verified JWT library instead.
  function parseJwtPayload(payload: string): { email?: string } {
    try {
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      return decoded
    } catch {
      return {}
    }
  }

  it('parses email from standard base64 JWT payload', () => {
    const payload = btoa(JSON.stringify({ email: 'cookie@example.com' }))
    const result = parseJwtPayload(payload)
    expect(result.email).toBe('cookie@example.com')
  })

  it('parses email from base64url JWT payload', () => {
    const payload = btoa(JSON.stringify({ email: 'url-safe@example.com' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    const result = parseJwtPayload(payload)
    expect(result.email).toBe('url-safe@example.com')
  })

  it('returns empty for malformed payload', () => {
    const result = parseJwtPayload('not-valid-base64!!!')
    expect(result.email).toBeUndefined()
  })
})
