import { Hono } from 'hono'
import { authMiddleware } from '@/server/middleware/auth'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import type { AuthUser } from '@/types'

const replies = new Hono<{
  Variables: { user: AuthUser }
  Bindings: { DATABASE_URL: string }
}>()

replies.get('/:postId/replies', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const postId = c.req.param('postId')
  const rows = await queries.getReplies(db, postId)

  const data = rows.map(row => ({
    ...row.reply,
    author: row.author,
  }))

  return c.json({ success: true, data })
})

replies.post('/:postId/replies', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('postId')
  const body = await c.req.json() as { line1: string; line2: string; line3: string }

  if (!body.line1 || !body.line2 || !body.line3) {
    return c.json({ success: false, error: '三行すべて入力してください' }, 400)
  }

  if (body.line1.length > 20 || body.line2.length > 20 || body.line3.length > 20) {
    return c.json({ success: false, error: '各行は20文字以内で入力してください' }, 400)
  }

  const db = getDb(c.env.DATABASE_URL)

  const post = await queries.getPostById(db, postId)
  if (!post) {
    return c.json({ success: false, error: '投稿が見つかりません' }, 404)
  }
  const reply = await queries.createReply(db, {
    postId,
    userId: user.id,
    line1: body.line1,
    line2: body.line2,
    line3: body.line3,
  })

  return c.json({ success: true, data: reply }, 201)
})

replies.delete('/:replyId', authMiddleware, async (c) => {
  const user = c.get('user')
  const replyId = c.req.param('replyId')
  const db = getDb(c.env.DATABASE_URL)

  const deleted = await queries.deleteReply(db, replyId, user.id)
  if (!deleted) {
    return c.json({ success: false, error: '削除できませんでした' }, 404)
  }

  return c.json({ success: true })
})

export default replies
