import { Hono } from 'hono'
import { authMiddleware, optionalAuthMiddleware } from '@/server/middleware/auth'
import { cacheMiddleware } from '@/server/middleware/cache'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { createPostWithValidation, deletePostWithAuth } from '@/server/services/post.service'
import { generateShareSvg } from '@/server/utils/share-image'
import type { AuthUser, ReactionType } from '@/types'

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
    const postIds = result.data.map(r => r.post.id)

    const [reactionsMap, myReactionsMap] = await Promise.all([
      queries.getReactionsBatch(db, postIds),
      user ? queries.getUserReactionsBatch(db, user.id, postIds) : Promise.resolve(new Map()),
    ])

    const dataWithLikes = await Promise.all(
      result.data.map(async (row) => {
        const likeCount = await queries.getLikeCount(db, row.post.id)
        return {
          ...row.post,
          author: row.author,
          likeCount,
          likedByMe: myReactionsMap.has(row.post.id),
          reactions: reactionsMap.get(row.post.id) ?? {},
          myReaction: myReactionsMap.get(row.post.id) ?? null,
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

posts.get('/:id/share-image', cacheMiddleware(86400), optionalAuthMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const postId = c.req.param('id')
  const style = c.req.query('style') === 'modern' ? 'modern' : 'washi'

  const row = await queries.getPostById(db, postId)
  if (!row) {
    return c.json({ success: false, error: '投稿が見つかりません' }, 404)
  }

  const svg = generateShareSvg({
    line1: row.post.line1,
    line2: row.post.line2,
    line3: row.post.line3,
    line4: row.post.line4,
    line5: row.post.line5,
    author: row.author.displayName,
    type: row.post.type as 'haiku' | 'tanka',
    style,
  })

  return c.body(svg, 200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=86400',
  })
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
  const reactions = await queries.getReactions(db, postId)
  const myReaction = user
    ? await queries.getUserReaction(db, user.id, postId)
    : null

  return c.json({
    success: true,
    data: { ...row.post, author: row.author, likeCount, likedByMe, reactions, myReaction },
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

posts.post('/:id/react', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)
  const body = await c.req.json() as { reactionType: string }
  const reactionType = (body.reactionType ?? 'heart') as ReactionType
  const validTypes: ReactionType[] = ['heart', 'aware', 'okashi', 'zabuton', 'clap']
  if (!validTypes.includes(reactionType)) {
    return c.json({ success: false, error: 'Invalid reaction type' }, 400)
  }

  const result = await queries.toggleReaction(db, user.id, postId, reactionType)
  return c.json({ success: true, data: result })
})

export default posts
