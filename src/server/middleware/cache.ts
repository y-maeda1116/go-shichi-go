import { createMiddleware } from 'hono/factory'

export const cacheMiddleware = (maxAge: number, sMaxAge?: number) =>
  createMiddleware(async (c, next) => {
    await next()
    const parts = [`public, max-age=${maxAge}`]
    if (sMaxAge !== undefined) {
      parts.push(`s-maxage=${sMaxAge}`)
    }
    c.header('Cache-Control', parts.join(', '))
  })
