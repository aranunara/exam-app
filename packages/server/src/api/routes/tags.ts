import { Hono } from 'hono'
import { eq, like } from 'drizzle-orm'
import type { Env } from '../../types'
import { tags } from '../../db/schema'
import { z } from 'zod'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { AppError } from '../middleware/error-handler'

const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().max(20).optional(),
})

const updateTagSchema = createTagSchema.partial()

const app = new Hono<Env>()

app.get('/', async (c) => {
  const db = c.get('db')
  const search = c.req.query('search')

  if (search) {
    const result = await db
      .select()
      .from(tags)
      .where(like(tags.name, `%${search}%`))
      .orderBy(tags.name)
    return c.json({ success: true, data: result })
  }

  const result = await db.query.tags.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  })
  return c.json({ success: true, data: result })
})

app.post('/', async (c) => {
  const db = c.get('db')
  const body = createTagSchema.parse(await c.req.json())
  const tag = {
    id: generateUlid(),
    ...body,
    createdAt: now(),
  }
  await db.insert(tags).values(tag)
  return c.json({ success: true, data: tag }, 201)
})

app.put('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const body = updateTagSchema.parse(await c.req.json())

  const existing = await db.query.tags.findFirst({
    where: eq(tags.id, id),
  })
  if (!existing) {
    throw new AppError('Tag not found', 404)
  }

  await db.update(tags).set(body).where(eq(tags.id, id))
  return c.json({ success: true, data: { ...existing, ...body } })
})

app.delete('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  const existing = await db.query.tags.findFirst({
    where: eq(tags.id, id),
  })
  if (!existing) {
    throw new AppError('Tag not found', 404)
  }

  await db.delete(tags).where(eq(tags.id, id))
  return c.json({ success: true })
})

export default app
