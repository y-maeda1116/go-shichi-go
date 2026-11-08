import { eq } from 'drizzle-orm'
import * as schema from '../schema'
import type { Db } from './shared'

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
