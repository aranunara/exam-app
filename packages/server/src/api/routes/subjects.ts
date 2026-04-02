import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import type { Env } from '../../types'
import { subjects } from '../../db/schema'
import {
  createSubjectSchema,
  updateSubjectSchema,
} from '../validators/subjects'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { getSubjectForUser } from '../helpers/ownership'

const app = new Hono<Env>()

app.get('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const result = await db.query.subjects.findMany({
    where: eq(subjects.userId, userId),
    orderBy: (sub, { asc }) => [asc(sub.sortOrder), asc(sub.name)],
  })
  c.header('Cache-Control', 'private, max-age=300, stale-while-revalidate=60')
  return c.json({ success: true, data: result })
})

app.get('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const subject = await getSubjectForUser(db, c.req.param('id'), userId)
  return c.json({ success: true, data: subject })
})

app.post('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = createSubjectSchema.parse(await c.req.json())
  const timestamp = now()
  const subject = {
    id: generateUlid(),
    userId,
    ...body,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.insert(subjects).values(subject)
  return c.json({ success: true, data: subject }, 201)
})

app.put('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = updateSubjectSchema.parse(await c.req.json())

  const existing = await getSubjectForUser(db, id, userId)

  const updated = { ...body, updatedAt: now() }
  await db
    .update(subjects)
    .set(updated)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))

  return c.json({
    success: true,
    data: { ...existing, ...updated },
  })
})

app.delete('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')

  await getSubjectForUser(db, id, userId)

  await db
    .delete(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
  return c.json({ success: true })
})

export default app
