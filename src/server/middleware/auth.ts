import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import type { AuthUser } from '@/types'

type Env = {
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}

function getEmailFromAccess(c: Context): string | undefined {
  const headerEmail = c.req.header('Cf-Access-Authenticated-User-Email')
  if (headerEmail) return headerEmail

  const cookie = c.req.header('cookie') || ''
  const match = cookie.match(/CF_Authorization=([^;]+)/)
  if (!match) return undefined

  try {
    const jwt = match[1]
    const payload = jwt.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded.email
  } catch {
    return undefined
  }
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const email = getEmailFromAccess(c)

  if (!email) {
    return c.json({ success: false, error: '認証が必要です' }, 401)
  }

  const { getDb } = await import('@/server/db/client')
  const { findUserByEmail } = await import('@/server/db/queries')
  const db = getDb(c.env.DATABASE_URL)
  const user = await findUserByEmail(db, email)

  if (!user) {
    if (c.req.path.startsWith('/api/')) {
      return c.json({ success: false, error: 'プロフィール登録が必要です' }, 403)
    }
    return c.redirect('/register')
  }

  c.set('user', {
    id: user.id,
    accessEmail: user.accessEmail,
    displayName: user.displayName,
    iconUrl: user.iconUrl,
  })

  await next()
})

export const optionalAuthMiddleware = createMiddleware<Env>(async (c, next) => {
  const email = getEmailFromAccess(c)

  if (email) {
    const { getDb } = await import('@/server/db/client')
    const { findUserByEmail } = await import('@/server/db/queries')
    const db = getDb(c.env.DATABASE_URL)
    const user = await findUserByEmail(db, email)

    if (user) {
      c.set('user', {
        id: user.id,
        accessEmail: user.accessEmail,
        displayName: user.displayName,
        iconUrl: user.iconUrl,
      })
    }
  }

  await next()
})

export function getEmailFromHeader(c: Context): string | undefined {
  return getEmailFromAccess(c)
}
