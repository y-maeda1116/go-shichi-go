import { eq, count, and, inArray } from 'drizzle-orm'
import * as schema from '../schema'
import type { Db } from './shared'

export async function getLikeCount(db: Db, postId: string) {
  const rows = await db.select({ count: count() })
    .from(schema.likes)
    .where(eq(schema.likes.postId, postId))
  return rows[0]?.count ?? 0
}

export async function getLikeCountsBatch(db: Db, postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map()

  const rows = await db.select({
    postId: schema.likes.postId,
    count: count(),
  })
    .from(schema.likes)
    .where(inArray(schema.likes.postId, postIds))
    .groupBy(schema.likes.postId)

  const map = new Map<string, number>()
  for (const row of rows) {
    map.set(row.postId, row.count)
  }
  return map
}

export async function toggleLike(db: Db, userId: string, postId: string): Promise<'liked' | 'unliked'> {
  const existing = await db.select()
    .from(schema.likes)
    .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(schema.likes)
      .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    return 'unliked'
  }

  await db.insert(schema.likes).values({ userId, postId })
  return 'liked'
}

export async function hasUserLiked(db: Db, userId: string, postId: string) {
  const rows = await db.select()
    .from(schema.likes)
    .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    .limit(1)
  return rows.length > 0
}
