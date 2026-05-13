import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './schema'

export const follows = pgTable('follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  followerId: uuid('follower_id').notNull().references(() => users.id),
  followingId: uuid('following_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('follows_unique').on(table.followerId, table.followingId),
])
