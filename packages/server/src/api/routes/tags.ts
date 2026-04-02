import { Hono } from 'hono'
import { eq, and, like } from 'drizzle-orm'
import type { Env } from '../../types'
import { tags } from '../../db/schema'
import { z } from 'zod'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { getTagForUser } from '../helpers/ownership'

const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().max(20).optional(),
})

const updateTagSchema = createTagSchema.partial()

const app = new Hono<Env>()

app.get('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const search = c.req.query('search')

  if (search) {
    const result = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), like(tags.name, `%${search}%`)))
      .orderBy(tags.name)
    return c.json({ success: true, data: result })
  }

  const result = await db.query.tags.findMany({
    where: eq(tags.userId, userId),
    orderBy: (t, { asc }) => [asc(t.name)],
  })
  c.header('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')
  return c.json({ success: true, data: result })
})

app.post('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = createTagSchema.parse(await c.req.json())
  const tag = {
    id: generateUlid(),
    userId,
    ...body,
    createdAt: now(),
  }
  await db.insert(tags).values(tag)
  return c.json({ success: true, data: tag }, 201)
})

app.put('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = updateTagSchema.parse(await c.req.json())

  const existing = await getTagForUser(db, id, userId)

  await db
    .update(tags)
    .set(body)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
  return c.json({ success: true, data: { ...existing, ...body } })
})

app.delete('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')

  await getTagForUser(db, id, userId)

  await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
  return c.json({ success: true })
})

export default app
