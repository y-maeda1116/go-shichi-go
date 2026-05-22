import { pgTable, uuid, text, timestamp, date, uniqueIndex } from 'drizzle-orm/pg-core'

export const dailyThemes = pgTable('daily_themes', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull(),
  themeText: text('theme_text').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('daily_themes_date_unique').on(table.date),
])
