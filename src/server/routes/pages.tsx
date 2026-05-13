import { Hono } from 'hono'
import { renderToString } from 'react-dom/server'
import { Layout } from '@/client/components/Layout'
import { Timeline } from '@/client/components/Timeline'
import { ProfileForm } from '@/client/components/ProfileForm'
import { optionalAuthMiddleware, getEmailFromHeader } from '@/server/middleware/auth'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { findUserByEmail } from '@/server/db/queries'
import type { AuthUser } from '@/types'

const pages = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

function renderPage(component: React.ReactElement, user?: AuthUser) {
  const html = renderToString(
    <Layout user={user}>
      {component}
    </Layout>,
  )

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>五七五 — 俳句・短歌SNS</title>
  <link rel="stylesheet" href="/styles/vertical.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sawarabi+Mincho&display=swap">
</head>
<body>
  <div id="root">${html}</div>
  <script>window.__INITIAL_USER__ = ${user ? JSON.stringify(user) : 'null'};</script>
  <script src="/client/entry.js"></script>
</body>
</html>`
}

pages.get('/', optionalAuthMiddleware, async (c) => {
  const user = c.get('user')
  const html = renderPage(<Timeline />, user)
  return c.html(html)
})

pages.get('/register', async (c) => {
  const email = getEmailFromHeader(c)
  if (!email) {
    return c.redirect('/')
  }

  const db = getDb(c.env.DATABASE_URL)
  const existing = await findUserByEmail(db, email)
  if (existing) {
    return c.redirect('/')
  }

  const html = renderPage(<ProfileForm mode="register" email={email} />)
  return c.html(html)
})

pages.post('/register', async (c) => {
  const email = getEmailFromHeader(c)
  if (!email) {
    return c.redirect('/')
  }

  const body = await c.req.formData()
  const db = getDb(c.env.DATABASE_URL)

  const existing = await findUserByEmail(db, email)
  if (existing) {
    return c.redirect('/')
  }

  await queries.createUser(db, {
    accessEmail: email,
    displayName: body.get('displayName') as string,
    bio: body.get('bio') as string || undefined,
    iconUrl: body.get('iconUrl') as string || undefined,
  })

  return c.redirect('/')
})

export default pages
