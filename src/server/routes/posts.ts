import { Hono } from 'hono'
import { authMiddleware, optionalAuthMiddleware } from '@/server/middleware/auth'
import { cacheMiddleware } from '@/server/middleware/cache'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { createPostWithValidation, deletePostWithAuth } from '@/server/services/post.service'
import type { AuthUser } from '@/types'

const posts = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

posts.get('/',
  cacheMiddleware(30, 60),
  optionalAuthMiddleware,
  async (c) => {
    const db = getDb(c.env.DATABASE_URL)
    const cursor = c.req.query('cursor')
    const season = c.req.query('season')
    const result = await queries.getTimelinePosts(db, cursor, season)

    const user = c.get('user')
    const dataWithLikes = await Promise.all(
      result.data.map(async (row) => {
        const likeCount = await queries.getLikeCount(db, row.post.id)
        const likedByMe = user
          ? await queries.hasUserLiked(db, user.id, row.post.id)
          : false
        return {
          ...row.post,
          author: row.author,
          likeCount,
          likedByMe,
        }
      }),
    )

    return c.json({
      success: true,
      data: { data: dataWithLikes, nextCursor: result.nextCursor },
    })
  },
)

posts.post('/', authMiddleware, async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const db = getDb(c.env.DATABASE_URL)

  const result = await createPostWithValidation(
    { createPost: (data) => queries.createPost(db, data), deletePost: (id, uid) => queries.deletePost(db, id, uid) },
    { ...body, userId: user.id },
  )

  if (!result.success) {
    return c.json(result, 400)
  }
  return c.json(result, 201)
})

posts.get('/:id', cacheMiddleware(60), optionalAuthMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const postId = c.req.param('id')
  const row = await queries.getPostById(db, postId)

  if (!row) {
    return c.json({ success: false, error: '投稿が見つかりません' }, 404)
  }

  const likeCount = await queries.getLikeCount(db, postId)
  const user = c.get('user')
  const likedByMe = user
    ? await queries.hasUserLiked(db, user.id, postId)
    : false

  return c.json({
    success: true,
    data: { ...row.post, author: row.author, likeCount, likedByMe },
  })
})

posts.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)

  const result = await deletePostWithAuth(
    { createPost: () => Promise.resolve({} as Awaited<ReturnType<typeof queries.createPost>>), deletePost: (id, uid) => queries.deletePost(db, id, uid) },
    postId,
    user.id,
  )

  if (!result.success) {
    return c.json(result, 404)
  }
  return c.json({ success: true })
})

posts.post('/:id/like', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)

  const action = await queries.toggleLike(db, user.id, postId)
  return c.json({ success: true, data: { action } })
})

export default posts
