import { eq, desc, and } from 'drizzle-orm'
import * as schema from '../schema'
import type { Db } from './shared'

export async function getReplies(db: Db, postId: string) {
  return db.select({
    reply: schema.replies,
    author: {
      id: schema.users.id,
      displayName: schema.users.displayName,
      iconUrl: schema.users.iconUrl,
    },
  })
    .from(schema.replies)
    .innerJoin(schema.users, eq(schema.replies.userId, schema.users.id))
    .where(eq(schema.replies.postId, postId))
    .orderBy(desc(schema.replies.createdAt))
}

export async function createReply(db: Db, data: {
  postId: string
  userId: string
  line1: string
  line2: string
  line3: string
}) {
  const rows = await db.insert(schema.replies).values(data).returning()
  return rows[0]
}

export async function deleteReply(db: Db, replyId: string, userId: string) {
  const result = await db.delete(schema.replies)
    .where(and(eq(schema.replies.id, replyId), eq(schema.replies.userId, userId)))
    .returning()
  return result.length > 0
}
