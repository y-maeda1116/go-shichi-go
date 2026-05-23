import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  accessEmail: text('access_email').notNull().unique(),
  displayName: text('display_name').notNull(),
  bio: text('bio'),
  iconUrl: text('icon_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: text('type', { enum: ['haiku', 'tanka'] }).notNull(),
  line1: text('line1').notNull(),
  line2: text('line2').notNull(),
  line3: text('line3').notNull(),
  line4: text('line4'),
  line5: text('line5'),
  authorNote: text('author_note'),
  imageUrl: text('image_url'),
  seasonWord: text('season_word'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export { dailyThemes } from './themes-schema'

export const likes = pgTable('likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  postId: uuid('post_id').notNull().references(() => posts.id),
  reactionType: text('reaction_type').notNull().default('heart'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('likes_user_post_unique').on(table.userId, table.postId),
])
