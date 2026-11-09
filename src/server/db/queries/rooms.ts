import { eq, desc, count } from 'drizzle-orm'
import * as schema from '../schema'
import type { Db } from './shared'

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
