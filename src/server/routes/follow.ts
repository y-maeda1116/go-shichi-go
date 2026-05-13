import { Hono } from 'hono'
import { authMiddleware } from '@/server/middleware/auth'
import { getDb } from '@/server/db/client'
import { followUser, unfollowUser, isFollowing, getFollowerCount, getFollowingCount } from '@/server/db/follow-queries'
import type { AuthUser } from '@/types'

const follow = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

follow.post('/:userId', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = c.req.param('userId')
  const db = getDb(c.env.DATABASE_URL)

  try {
    await followUser(db, user.id, targetId)
  } catch {
    return c.json({ success: false, error: 'すでにフォローしています' }, 400)
  }
  return c.json({ success: true })
})

follow.delete('/:userId', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = c.req.param('userId')
  const db = getDb(c.env.DATABASE_URL)

  await unfollowUser(db, user.id, targetId)
  return c.json({ success: true })
})

follow.get('/status/:userId', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetId = c.req.param('userId')
  const db = getDb(c.env.DATABASE_URL)

  const following = await isFollowing(db, user.id, targetId)
  const followers = await getFollowerCount(db, targetId)
  const followingCount = await getFollowingCount(db, targetId)

  return c.json({
    success: true,
    data: { following, followers, followingCount },
  })
})

export default follow
