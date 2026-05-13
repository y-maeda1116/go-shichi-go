import { eq, and, count } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { follows } from './follow-schema'

type Db = NeonHttpDatabase<typeof schema>

export async function followUser(db: Db, followerId: string, followingId: string) {
  if (followerId === followingId) return false
  await db.insert(follows).values({ followerId, followingId })
  return true
}

export async function unfollowUser(db: Db, followerId: string, followingId: string) {
  await db.delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
  return true
}

export async function isFollowing(db: Db, followerId: string, followingId: string) {
  const rows = await db.select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1)
  return rows.length > 0
}

export async function getFollowerCount(db: Db, userId: string) {
  const rows = await db.select({ count: count() })
    .from(follows)
    .where(eq(follows.followingId, userId))
  return rows[0]?.count ?? 0
}

export async function getFollowingCount(db: Db, userId: string) {
  const rows = await db.select({ count: count() })
    .from(follows)
    .where(eq(follows.followerId, userId))
  return rows[0]?.count ?? 0
}
