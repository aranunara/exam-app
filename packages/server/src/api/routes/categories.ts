import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import type { Env } from '../../types'
import { categories } from '../../db/schema'
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/categories'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { getCategoryForUser } from '../helpers/ownership'

const app = new Hono<Env>()

app.get('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const result = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
    orderBy: (cat, { asc }) => [asc(cat.sortOrder), asc(cat.name)],
  })
  c.header('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')
  return c.json({ success: true, data: result })
})

app.get('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const category = await getCategoryForUser(db, c.req.param('id'), userId)
  return c.json({ success: true, data: category })
})

app.post('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = createCategorySchema.parse(await c.req.json())
  const timestamp = now()
  const category = {
    id: generateUlid(),
    userId,
    ...body,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.insert(categories).values(category)
  return c.json({ success: true, data: category }, 201)
})

app.put('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = updateCategorySchema.parse(await c.req.json())

  const existing = await getCategoryForUser(db, id, userId)

  const updated = { ...body, updatedAt: now() }
  await db
    .update(categories)
    .set(updated)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))

  return c.json({
    success: true,
    data: { ...existing, ...updated },
  })
})

app.delete('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')

  await getCategoryForUser(db, id, userId)

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
  return c.json({ success: true })
})

export default app
