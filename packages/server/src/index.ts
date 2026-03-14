import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createDb } from './db'
import type { Env } from './types'
import { authMiddleware } from './api/middleware/auth'
import { errorHandler } from './api/middleware/error-handler'
import categoriesRoutes from './api/routes/categories'
import tagsRoutes from './api/routes/tags'
import questionSetsRoutes from './api/routes/question-sets'
import questionsRoutes from './api/routes/questions'
import sessionsRoutes from './api/routes/sessions'
import statsRoutes from './api/routes/stats'
import confidenceRoutes from './api/routes/confidence'

const app = new Hono<Env>()

app.onError(errorHandler)

app.use('*', cors())

app.use('/api/*', async (c, next) => {
  const db = createDb(c.env.DB)
  c.set('db', db)
  await next()
})

app.use('/api/*', authMiddleware)

const api = app.basePath('/api/v1')

api.route('/categories', categoriesRoutes)
api.route('/tags', tagsRoutes)
api.route('/question-sets', questionSetsRoutes)
api.route('/question-sets', questionsRoutes)
api.route('/sessions', sessionsRoutes)
api.route('/stats', statsRoutes)
api.route('/confidence', confidenceRoutes)

app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
