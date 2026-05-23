import { createMiddleware } from 'hono/factory'

export const cacheMiddleware = (maxAge: number, sMaxAge?: number) =>
  createMiddleware(async (c, next) => {
    await next()
    if (c.res.status >= 400) {
      c.header('Cache-Control', 'no-store')
      return
    }
    const parts = [`public, max-age=${maxAge}`]
    if (sMaxAge !== undefined) {
      parts.push(`s-maxage=${sMaxAge}`)
    }
    c.header('Cache-Control', parts.join(', '))
  })
