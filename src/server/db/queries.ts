import { eq, desc, count, and, lt, sql, inArray } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import type { ReactionType } from '@/types'

type Db = NeonHttpDatabase<typeof schema>

const POSTS_PAGE_SIZE = 20

function buildPaginatedResult<T extends { post: { id: string } }>(rows: T[]) {
  const hasMore = rows.length > POSTS_PAGE_SIZE
  const data = hasMore ? rows.slice(0, -1) : rows
  const nextCursor = hasMore ? data[data.length - 1].post.id : null
  return { data, nextCursor }
}

export async function findUserByEmail(db: Db, email: string) {
  const rows = await db.select().from(schema.users)
    .where(eq(schema.users.accessEmail, email))
    .limit(1)
  return rows[0] ?? null
}

export async function findUserById(db: Db, id: string) {
  const rows = await db.select().from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function createUser(db: Db, data: {
  accessEmail: string
  displayName: string
  bio?: string
  iconUrl?: string
}) {
  const rows = await db.insert(schema.users).values(data).returning()
  return rows[0]
}

export async function updateUser(db: Db, userId: string, data: {
  displayName?: string
  bio?: string
  iconUrl?: string
}) {
  const rows = await db.update(schema.users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning()
  return rows[0]
}

export async function getTimelinePosts(db: Db, cursor?: string, season?: string) {
  const seasonFilter = season ? eq(schema.posts.seasonWord, season) : undefined

  if (cursor) {
    const cursorPost = await db.select({ createdAt: schema.posts.createdAt })
      .from(schema.posts)
      .where(eq(schema.posts.id, cursor))
      .limit(1)
    if (cursorPost[0]) {
      const conditions = [lt(schema.posts.createdAt, cursorPost[0].createdAt)]
      if (seasonFilter) conditions.push(seasonFilter)
      const rows = await db.select({
        post: schema.posts,
        author: {
          id: schema.users.id,
          displayName: schema.users.displayName,
          iconUrl: schema.users.iconUrl,
        },
      })
        .from(schema.posts)
        .innerJoin(schema.users, eq(schema.posts.userId, schema.users.id))
        .where(and(...conditions))
        .orderBy(desc(schema.posts.createdAt))
        .limit(POSTS_PAGE_SIZE + 1)
      return buildPaginatedResult(rows)
    }
  }

  const rows = await db.select({
    post: schema.posts,
    author: {
      id: schema.users.id,
      displayName: schema.users.displayName,
      iconUrl: schema.users.iconUrl,
    },
  })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.posts.userId, schema.users.id))
    .where(seasonFilter)
    .orderBy(desc(schema.posts.createdAt))
    .limit(POSTS_PAGE_SIZE + 1)
  return buildPaginatedResult(rows)
}

export async function getPostById(db: Db, postId: string) {
  const rows = await db.select({
    post: schema.posts,
    author: {
      id: schema.users.id,
      displayName: schema.users.displayName,
      iconUrl: schema.users.iconUrl,
    },
  })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.posts.userId, schema.users.id))
    .where(eq(schema.posts.id, postId))
    .limit(1)
  return rows[0] ?? null
}

export async function getUserPosts(db: Db, userId: string, cursor?: string) {
  if (cursor) {
    const cursorPost = await db.select({ createdAt: schema.posts.createdAt })
      .from(schema.posts)
      .where(eq(schema.posts.id, cursor))
      .limit(1)
    if (cursorPost[0]) {
      const rows = await db.select({
        post: schema.posts,
        author: {
          id: schema.users.id,
          displayName: schema.users.displayName,
          iconUrl: schema.users.iconUrl,
        },
      })
        .from(schema.posts)
        .innerJoin(schema.users, eq(schema.posts.userId, schema.users.id))
        .where(
          and(
            eq(schema.posts.userId, userId),
            lt(schema.posts.createdAt, cursorPost[0].createdAt),
          ),
        )
        .orderBy(desc(schema.posts.createdAt))
        .limit(POSTS_PAGE_SIZE + 1)
      return buildPaginatedResult(rows)
    }
  }

  const rows = await db.select({
    post: schema.posts,
    author: {
      id: schema.users.id,
      displayName: schema.users.displayName,
      iconUrl: schema.users.iconUrl,
    },
  })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.posts.userId, schema.users.id))
    .where(eq(schema.posts.userId, userId))
    .orderBy(desc(schema.posts.createdAt))
    .limit(POSTS_PAGE_SIZE + 1)
  return buildPaginatedResult(rows)
}

export async function createPost(db: Db, data: {
  userId: string
  type: 'haiku' | 'tanka'
  line1: string
  line2: string
  line3: string
  line4?: string
  line5?: string
  authorNote?: string
  imageUrl?: string
  seasonWord?: string
}) {
  const rows = await db.insert(schema.posts).values(data).returning()
  return rows[0]
}

export async function deletePost(db: Db, postId: string, userId: string) {
  const result = await db.delete(schema.posts)
    .where(and(eq(schema.posts.id, postId), eq(schema.posts.userId, userId)))
    .returning()
  return result.length > 0
}

export async function getLikeCount(db: Db, postId: string) {
  const rows = await db.select({ count: count() })
    .from(schema.likes)
    .where(eq(schema.likes.postId, postId))
  return rows[0]?.count ?? 0
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

export async function hasUserLiked(db: Db, userId: string, postId: string) {
  const rows = await db.select()
    .from(schema.likes)
    .where(and(eq(schema.likes.userId, userId), eq(schema.likes.postId, postId)))
    .limit(1)
  return rows.length > 0
}

export async function getThemeByDate(db: Db, date: string) {
  const rows = await db.select().from(schema.dailyThemes)
    .where(eq(schema.dailyThemes.date, date))
    .limit(1)
  return rows[0] ?? null
}

export async function getTodayTheme(db: Db) {
  const today = new Date().toISOString().split('T')[0]
  return getThemeByDate(db, today)
}

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

export async function getUserStreak(db: Db, userId: string): Promise<{ currentStreak: number; maxStreak: number }> {
  const rows = await db.select({
    date: sql<string>`DATE(${schema.posts.createdAt})`.as('post_date'),
  })
    .from(schema.posts)
    .where(eq(schema.posts.userId, userId))
    .groupBy(sql`DATE(${schema.posts.createdAt})`)
    .orderBy(sql`DATE(${schema.posts.createdAt}) DESC`)

  if (rows.length === 0) return { currentStreak: 0, maxStreak: 0 }

  const dates = rows.map(r => r.date)
  let currentStreak = 1
  let maxStreak = 1

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (dates[0] !== today && dates[0] !== yesterday) {
    currentStreak = 0
  } else {
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = (prev.getTime() - curr.getTime()) / 86400000
      if (diff === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }

  let tempStreak = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = (prev.getTime() - curr.getTime()) / 86400000
    if (diff === 1) {
      tempStreak++
      if (tempStreak > maxStreak) maxStreak = tempStreak
    } else {
      tempStreak = 1
    }
  }
  if (currentStreak > maxStreak) maxStreak = currentStreak

  return { currentStreak, maxStreak }
}

export async function getRankedPosts(db: Db, period: 'weekly' | 'monthly') {
  const days = period === 'weekly' ? 7 : 30
  const since = new Date(Date.now() - days * 86400000)

  const rows = await db.select({
    postId: schema.likes.postId,
    likeCount: count(),
  })
    .from(schema.likes)
    .where(sql`${schema.likes.createdAt} >= ${since}`)
    .groupBy(schema.likes.postId)
    .orderBy(desc(count()))
    .limit(10)

  const results = await Promise.all(
    rows.map(async (row) => {
      const postRow = await getPostById(db, row.postId)
      if (!postRow) return null
      return {
        ...postRow.post,
        author: postRow.author,
        likeCount: row.likeCount,
      }
    }),
  )

  return results.filter(Boolean)
}

export async function getActiveRooms(db: Db) {
  return db.select({
    room: schema.rooms,
    creator: {
      id: schema.users.id,
      displayName: schema.users.displayName,
    },
    lineCount: count(),
  })
    .from(schema.rooms)
    .innerJoin(schema.users, eq(schema.rooms.createdBy, schema.users.id))
    .leftJoin(schema.roomLines, eq(schema.rooms.id, schema.roomLines.roomId))
    .where(eq(schema.rooms.status, 'active'))
    .groupBy(schema.rooms.id, schema.users.id)
    .orderBy(desc(schema.rooms.createdAt))
}

export async function getRoomById(db: Db, roomId: string) {
  const rows = await db.select().from(schema.rooms)
    .where(eq(schema.rooms.id, roomId))
    .limit(1)
  return rows[0] ?? null
}

export async function getRoomLines(db: Db, roomId: string) {
  return db.select({
    line: schema.roomLines,
    author: {
      id: schema.users.id,
      displayName: schema.users.displayName,
    },
  })
    .from(schema.roomLines)
    .innerJoin(schema.users, eq(schema.roomLines.userId, schema.users.id))
    .where(eq(schema.roomLines.roomId, roomId))
    .orderBy(schema.roomLines.lineNumber)
}

export async function createRoom(db: Db, userId: string) {
  const rows = await db.insert(schema.rooms).values({ createdBy: userId }).returning()
  return rows[0]
}

export async function addRoomLine(db: Db, roomId: string, userId: string, line: string, lineNumber: number) {
  const rows = await db.insert(schema.roomLines).values({ roomId, userId, line, lineNumber }).returning()
  return rows[0]
}

export async function closeRoom(db: Db, roomId: string) {
  const rows = await db.update(schema.rooms)
    .set({ status: 'closed' })
    .where(eq(schema.rooms.id, roomId))
    .returning()
  return rows[0]
}
