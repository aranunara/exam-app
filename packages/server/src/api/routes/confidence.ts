import { Hono } from 'hono'
import { eq, and, inArray } from 'drizzle-orm'
import type { Env } from '../../types'
import { questionConfidence } from '../../db/schema'
import {
  upsertConfidenceSchema,
  batchGetConfidenceSchema,
} from '../validators/confidence'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'

const app = new Hono<Env>()

app.put('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = upsertConfidenceSchema.parse(await c.req.json())

  const existing = await db.query.questionConfidence.findFirst({
    where: and(
      eq(questionConfidence.userId, userId),
      eq(questionConfidence.questionId, body.questionId),
    ),
  })

  if (body.level === 0) {
    if (existing) {
      await db
        .delete(questionConfidence)
        .where(eq(questionConfidence.id, existing.id))
    }
    return c.json({ success: true, data: { questionId: body.questionId, level: 0 } })
  }

  if (existing) {
    await db
      .update(questionConfidence)
      .set({ level: body.level, updatedAt: now() })
      .where(eq(questionConfidence.id, existing.id))
  } else {
    await db.insert(questionConfidence).values({
      id: generateUlid(),
      userId,
      questionId: body.questionId,
      level: body.level,
      updatedAt: now(),
    })
  }

  return c.json({ success: true, data: { questionId: body.questionId, level: body.level } })
})

app.post('/batch', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = batchGetConfidenceSchema.parse(await c.req.json())

  const rows = await db
    .select({
      questionId: questionConfidence.questionId,
      level: questionConfidence.level,
    })
    .from(questionConfidence)
    .where(
      and(
        eq(questionConfidence.userId, userId),
        inArray(questionConfidence.questionId, body.questionIds),
      ),
    )

  const record: Record<string, number> = {}
  for (const row of rows) {
    record[row.questionId] = row.level
  }

  return c.json({ success: true, data: record })
})

export default app
