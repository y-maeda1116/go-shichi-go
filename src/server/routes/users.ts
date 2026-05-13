import { Hono } from 'hono'
import { authMiddleware } from '@/server/middleware/auth'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { updateProfile } from '@/server/services/user.service'
import type { AuthUser } from '@/types'

const users = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

users.get('/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const userId = c.req.param('id')
  const user = await queries.findUserById(db, userId)

  if (!user) {
    return c.json({ success: false, error: 'ユーザーが見つかりません' }, 404)
  }

  return c.json({
    success: true,
    data: {
      id: user.id,
      displayName: user.displayName,
      bio: user.bio,
      iconUrl: user.iconUrl,
      createdAt: user.createdAt,
    },
  })
})

users.get('/:id/posts', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const userId = c.req.param('id')
  const cursor = c.req.query('cursor')
  const result = await queries.getUserPosts(db, userId, cursor)

  const dataWithLikes = await Promise.all(
    result.data.map(async (row: { post: { id: string }; [k: string]: unknown }) => {
      const likeCount = await queries.getLikeCount(db, row.post.id)
      return { ...row.post, author: row.author, likeCount, likedByMe: false }
    }),
  )

  return c.json({
    success: true,
    data: { data: dataWithLikes, nextCursor: result.nextCursor },
  })
})

users.put('/me', authMiddleware, async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const db = getDb(c.env.DATABASE_URL)

  const result = await updateProfile(
    {
      findUserByEmail: (email) => queries.findUserByEmail(db, email),
      findUserById: (id) => queries.findUserById(db, id),
      createUser: (data) => queries.createUser(db, data),
      updateUser: (id, data) => queries.updateUser(db, id, data),
    },
    user.id,
    body,
  )

  if (!result.success) {
    return c.json(result, 400)
  }
  return c.json(result)
})

export default users
