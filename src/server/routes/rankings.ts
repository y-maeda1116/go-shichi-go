import { Hono } from 'hono'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'

const rankings = new Hono<{
  Bindings: { DATABASE_URL: string }
}>()

rankings.get('/weekly', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const posts = await queries.getRankedPosts(db, 'weekly')
  return c.json({ success: true, data: posts })
})

rankings.get('/monthly', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const posts = await queries.getRankedPosts(db, 'monthly')
  return c.json({ success: true, data: posts })
})

rankings.get('/streak/:userId', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const userId = c.req.param('userId')
  const streak = await queries.getUserStreak(db, userId)
  return c.json({ success: true, data: streak })
})

export default rankings
