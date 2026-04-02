import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { etag } from 'hono/etag'
import { bodyLimit } from 'hono/body-limit'
import { createDb } from './db'
import type { Env } from './types'
import { authMiddleware } from './api/middleware/auth'
import { errorHandler } from './api/middleware/error-handler'
import subjectsRoutes from './api/routes/subjects'
import tagsRoutes from './api/routes/tags'
import workbooksRoutes from './api/routes/workbooks'
import questionsRoutes from './api/routes/questions'
import sessionsRoutes from './api/routes/sessions'
import statsRoutes from './api/routes/stats'
import confidenceRoutes from './api/routes/confidence'

const app = new Hono<Env>()

app.onError(errorHandler)

function isAllowedOrigin(origin: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1)
      return origin.endsWith(suffix) || origin === `https://${pattern.slice(2)}`
    }
    return origin === pattern
  })
}

const corsPatternCache = new Map<string, string[]>()

app.use('*', async (c, next) => {
  const key = c.env.CORS_ORIGIN ?? ''
  let patterns = corsPatternCache.get(key)
  if (!patterns) {
    patterns = key ? key.split(',') : ['http://localhost:5173']
    corsPatternCache.set(key, patterns)
  }

  return cors({
    origin: (origin) =>
      isAllowedOrigin(origin, patterns) ? origin : null,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next)
})

app.use('*', secureHeaders({
  xFrameOptions: 'DENY',
  referrerPolicy: 'strict-origin-when-cross-origin',
}))

app.use('/api/*', etag())
app.use('/api/*', bodyLimit({ maxSize: 5 * 1024 * 1024 }))

app.use('/api/*', async (c, next) => {
  const db = createDb(c.env.DB)
  c.set('db', db)
  await next()
})

app.use('/api/*', authMiddleware)

const api = app.basePath('/api/v1')

api.route('/subjects', subjectsRoutes)
api.route('/tags', tagsRoutes)
api.route('/workbooks', workbooksRoutes)
api.route('/workbooks', questionsRoutes)
api.route('/sessions', sessionsRoutes)
api.route('/stats', statsRoutes)
api.route('/confidence', confidenceRoutes)

app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
