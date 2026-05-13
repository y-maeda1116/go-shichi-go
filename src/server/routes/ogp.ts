import { Hono } from 'hono'
import { getDb } from '@/server/db/client'
import * as queries from '@/server/db/queries'
import { generateOgSvg } from '@/server/utils/ogp'

const ogp = new Hono<{ Bindings: { DATABASE_URL: string } }>()

ogp.get('/posts/:id', async (c) => {
  const postId = c.req.param('id')
  const db = getDb(c.env.DATABASE_URL)
  const row = await queries.getPostById(db, postId)

  if (!row) {
    return c.notFound()
  }

  const svg = generateOgSvg({
    line1: row.post.line1,
    line2: row.post.line2,
    line3: row.post.line3,
    line4: row.post.line4,
    line5: row.post.line5,
    author: row.author.displayName,
    type: row.post.type,
  })

  return c.body(svg, 200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'public, max-age=3600',
  })
})

export default ogp
