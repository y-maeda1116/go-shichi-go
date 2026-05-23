import { pgTable, uuid, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { posts } from './schema'
import { users } from './schema'

export const replies = pgTable('replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  line1: text('line1').notNull(),
  line2: text('line2').notNull(),
  line3: text('line3').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('replies_post_id_idx').on(table.postId),
])
