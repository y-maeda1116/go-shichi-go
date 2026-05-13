import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from '@/server/middleware/error'
import postsRoutes from '@/server/routes/posts'
import usersRoutes from '@/server/routes/users'
import uploadRoutes from '@/server/routes/upload'
import followRoutes from '@/server/routes/follow'
import ogpRoutes from '@/server/routes/ogp'
import pagesRoutes from '@/server/routes/pages'

const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors())

app.route('/', pagesRoutes)
app.route('/api/posts', postsRoutes)
app.route('/api/users', usersRoutes)
app.route('/api/upload', uploadRoutes)
app.route('/api/follow', followRoutes)
app.route('/ogp', ogpRoutes)

app.onError(errorHandler)

export default app
