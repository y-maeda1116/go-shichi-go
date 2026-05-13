import { Hono } from 'hono'
import { renderToString } from 'react-dom/server'
import { Layout } from '@/client/components/Layout'
import { Timeline } from '@/client/components/Timeline'
import { ProfileForm } from '@/client/components/ProfileForm'
import { UserProfile } from '@/client/components/UserProfile'
import { PostDetail } from '@/client/components/PostDetail'
import { authMiddleware, optionalAuthMiddleware, getEmailFromHeader } from '@/server/middleware/auth'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { findUserByEmail } from '@/server/db/queries'
import type { AuthUser } from '@/types'

const pages = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

function renderPage(component: React.ReactElement, user?: AuthUser, title?: string, ogImage?: string) {
  const html = renderToString(
    <Layout user={user}>
      {component}
    </Layout>,
  )

  const ogTags = ogImage
    ? `
  <meta property="og:image" content="${ogImage}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${ogImage}">`
    : ''

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title ?? '五七五 — 俳句・短歌SNS'}</title>
  <meta property="og:title" content="${title ?? '五七五 — 俳句・短歌SNS'}">
  <meta property="og:site_name" content="五七五">
  ${ogTags}
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

pages.get('/profile', authMiddleware, async (c) => {
  const user = c.get('user')
  const html = renderPage(
    <UserProfile user={{ ...user, bio: null }} isOwn={true} />,
    user,
    `${user.displayName} — 五七五`,
  )
  return c.html(html)
})

pages.get('/profile/edit', authMiddleware, async (c) => {
  const user = c.get('user')
  const html = renderPage(
    <ProfileForm
      mode="edit"
      initialData={{
        displayName: user.displayName,
        bio: '',
        iconUrl: user.iconUrl ?? '',
      }}
    />,
    user,
    'プロフィール編集 — 五七五',
  )
  return c.html(html)
})

pages.get('/users/:id', optionalAuthMiddleware, async (c) => {
  const currentUser = c.get('user')
  const targetId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)
  const targetUser = await queries.findUserById(db, targetId)

  if (!targetUser) {
    return c.html('<h1>404 Not Found</h1>', 404)
  }

  const isOwn = currentUser?.id === targetId
  const html = renderPage(
    <UserProfile
      user={{
        id: targetUser.id,
        displayName: targetUser.displayName,
        bio: targetUser.bio,
        iconUrl: targetUser.iconUrl,
      }}
      isOwn={isOwn}
    />,
    currentUser,
    `${targetUser.displayName} — 五七五`,
  )
  return c.html(html)
})

pages.get('/posts/:id', optionalAuthMiddleware, async (c) => {
  const currentUser = c.get('user')
  const postId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)
  const row = await queries.getPostById(db, postId)

  if (!row) {
    return c.html('<h1>404 Not Found</h1>', 404)
  }

  const likeCount = await queries.getLikeCount(db, postId)
  const likedByMe = currentUser
    ? await queries.hasUserLiked(db, currentUser.id, postId)
    : false

  const post = {
    ...row.post,
    author: row.author,
    likeCount,
    likedByMe,
  }

  const html = renderPage(
    <PostDetail post={post} />,
    currentUser,
    `${post.line1}${post.line2}${post.line3} — 五七五`,
    `/ogp/posts/${postId}`,
  )
  return c.html(html)
})

export default pages
