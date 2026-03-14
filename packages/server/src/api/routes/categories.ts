import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env } from '../../types'
import { categories } from '../../db/schema'
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/categories'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { AppError } from '../middleware/error-handler'

const app = new Hono<Env>()

app.get('/', async (c) => {
  const db = c.get('db')
  const result = await db.query.categories.findMany({
    orderBy: (cat, { asc }) => [asc(cat.sortOrder), asc(cat.name)],
  })
  return c.json({ success: true, data: result })
})

app.get('/:id', async (c) => {
  const db = c.get('db')
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, c.req.param('id')),
  })
  if (!category) {
    throw new AppError('Category not found', 404)
  }
  return c.json({ success: true, data: category })
})

app.post('/', async (c) => {
  const db = c.get('db')
  const body = createCategorySchema.parse(await c.req.json())
  const timestamp = now()
  const category = {
    id: generateUlid(),
    ...body,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.insert(categories).values(category)
  return c.json({ success: true, data: category }, 201)
})

app.put('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const body = updateCategorySchema.parse(await c.req.json())

  const existing = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  })
  if (!existing) {
    throw new AppError('Category not found', 404)
  }

  const updated = { ...body, updatedAt: now() }
  await db.update(categories).set(updated).where(eq(categories.id, id))

  return c.json({
    success: true,
    data: { ...existing, ...updated },
  })
})

app.delete('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  const existing = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  })
  if (!existing) {
    throw new AppError('Category not found', 404)
  }

  await db.delete(categories).where(eq(categories.id, id))
  return c.json({ success: true })
})

export default app
