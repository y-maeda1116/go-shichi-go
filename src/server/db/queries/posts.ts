import { eq, desc, count, and, lt, sql } from 'drizzle-orm'
import * as schema from '../schema'
import type { Db } from './shared'

const POSTS_PAGE_SIZE = 20

function buildPaginatedResult<T extends { post: { id: string } }>(rows: T[]) {
  const hasMore = rows.length > POSTS_PAGE_SIZE
  const data = hasMore ? rows.slice(0, -1) : rows
  const nextCursor = hasMore ? data[data.length - 1].post.id : null
  return { data, nextCursor }
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
