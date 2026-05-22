import { Hono } from 'hono'
import { getDb } from '@/server/db/client'
import { getTodayTheme, getThemeByDate } from '@/server/db/queries'

const themes = new Hono<{
  Bindings: { DATABASE_URL: string }
}>()

themes.get('/today', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const theme = await getTodayTheme(db)

  if (!theme) {
    return c.json({ success: true, data: null })
  }

  return c.json({
    success: true,
    data: {
      date: theme.date,
      themeText: theme.themeText,
      description: theme.description,
    },
  })
})

themes.get('/:date', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const date = c.req.param('date')
  const theme = await getThemeByDate(db, date)

  if (!theme) {
    return c.json({ success: true, data: null })
  }

  return c.json({
    success: true,
    data: {
      date: theme.date,
      themeText: theme.themeText,
      description: theme.description,
    },
  })
})

export default themes
