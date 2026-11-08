import { eq, sql } from 'drizzle-orm'
import * as schema from '../schema'
import type { Db } from './shared'

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
