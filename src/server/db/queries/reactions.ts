import { eq, count, and, inArray } from 'drizzle-orm'
import * as schema from '../schema'
import type { ReactionType } from '@/types'
import type { Db } from './shared'

export async function toggleReaction(db: Db, userId: string, postId: string, reactionType: ReactionType): Promise<{ action: 'added' | 'removed'; reactionType: ReactionType }> {
  const existing = await db.select()
    .from(schema.likes)
    .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(schema.likes)
      .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    return { action: 'removed', reactionType }
  }

  await db.insert(schema.likes).values({ userId, postId, reactionType })
  return { action: 'added', reactionType }
}

export async function getReactions(db: Db, postId: string): Promise<Partial<Record<ReactionType, number>>> {
  const rows = await db.select({
    reactionType: schema.likes.reactionType,
    count: count(),
  })
    .from(schema.likes)
    .where(eq(schema.likes.postId, postId))
    .groupBy(schema.likes.reactionType)

  const result: Partial<Record<ReactionType, number>> = {}
  for (const row of rows) {
    result[row.reactionType as ReactionType] = row.count
  }
  return result
}

export async function getReactionsBatch(db: Db, postIds: string[]): Promise<Map<string, Partial<Record<ReactionType, number>>>> {
  if (postIds.length === 0) return new Map()

  const rows = await db.select({
    postId: schema.likes.postId,
    reactionType: schema.likes.reactionType,
    count: count(),
  })
    .from(schema.likes)
    .where(inArray(schema.likes.postId, postIds))
    .groupBy(schema.likes.postId, schema.likes.reactionType)

  const map = new Map<string, Partial<Record<ReactionType, number>>>()
  for (const row of rows) {
    const existing = map.get(row.postId) ?? {}
    existing[row.reactionType as ReactionType] = row.count
    map.set(row.postId, existing)
  }
  return map
}

export async function getUserReactionsBatch(db: Db, userId: string, postIds: string[]): Promise<Map<string, ReactionType>> {
  if (postIds.length === 0 || !userId) return new Map()

  const rows = await db.select({
    postId: schema.likes.postId,
    reactionType: schema.likes.reactionType,
  })
    .from(schema.likes)
    .where(and(eq(schema.likes.userId, userId), inArray(schema.likes.postId, postIds)))

  const map = new Map<string, ReactionType>()
  for (const row of rows) {
    map.set(row.postId, row.reactionType as ReactionType)
  }
  return map
}

export async function getUserReaction(db: Db, userId: string, postId: string): Promise<ReactionType | null> {
  const rows = await db.select({ reactionType: schema.likes.reactionType })
    .from(schema.likes)
    .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    .limit(1)
  return rows[0]?.reactionType as ReactionType ?? null
}
