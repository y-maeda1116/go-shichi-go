import type { ErrorHandler } from 'hono'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`Error: ${err.message}`, err.stack)

  if (c.req.path.startsWith('/api/')) {
    return c.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      500,
    )
  }

  return c.html('<h1>500 Internal Server Error</h1>', 500)
}
