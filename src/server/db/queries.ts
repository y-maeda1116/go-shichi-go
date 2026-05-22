import { eq, desc, count, and, lt } from 'drizzle-orm'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

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
