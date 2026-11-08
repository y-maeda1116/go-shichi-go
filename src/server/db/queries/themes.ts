import { eq } from 'drizzle-orm'
import * as schema from '../schema'
import type { Db } from './shared'

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
