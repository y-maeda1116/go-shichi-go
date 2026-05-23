import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { users } from './schema'

export const rooms = pgTable('linked_verse_rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: text('status', { enum: ['active', 'closed'] }).notNull().default('active'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const roomLines = pgTable('linked_verse_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').notNull().references(() => rooms.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  line: text('line').notNull(),
  lineNumber: integer('line_number').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('room_lines_room_id_idx').on(table.roomId),
])
