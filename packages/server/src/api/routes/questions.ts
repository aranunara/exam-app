import { Hono } from 'hono'
import { eq, and, inArray } from 'drizzle-orm'
import type { Env } from '../../types'
import { questions, questionTags, choices, tags } from '../../db/schema'
import {
  createQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
} from '../validators/questions'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { AppError } from '../middleware/error-handler'
import { getQuestionSetForUser } from '../helpers/ownership'

const app = new Hono<Env>()

app.post('/:setId/questions', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const setId = c.req.param('setId')
  await getQuestionSetForUser(db, setId, userId)
  const body = createQuestionSchema.parse(await c.req.json())
  const timestamp = now()

  const correctCount = body.choices.filter((c) => c.isCorrect).length
  const isMultiAnswer = correctCount > 1

  const questionId = generateUlid()
  const question = {
    id: questionId,
    questionSetId: setId,
    body: body.body,
    explanation: body.explanation,
    isMultiAnswer,
    sortOrder: body.sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.insert(questions).values(question)

  if (body.tagIds?.length) {
    const userTags = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(inArray(tags.id, body.tagIds), eq(tags.userId, userId)))
    if (userTags.length !== body.tagIds.length) {
      throw new AppError('One or more tags not found', 404)
    }
    await db.insert(questionTags).values(
      body.tagIds.map((tagId) => ({
        questionId,
        tagId,
      })),
    )
  }

  const createdChoices = body.choices.map((ch) => ({
    id: generateUlid(),
    questionId,
    body: ch.body,
    isCorrect: ch.isCorrect,
    explanation: ch.explanation,
    sortOrder: ch.sortOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
  await db.insert(choices).values(createdChoices)

  return c.json(
    { success: true, data: { ...question, choices: createdChoices } },
    201,
  )
})

app.put('/:setId/questions/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const setId = c.req.param('setId')
  await getQuestionSetForUser(db, setId, userId)
  const id = c.req.param('id')
  const body = updateQuestionSchema.parse(await c.req.json())

  const existing = await db.query.questions.findFirst({
    where: eq(questions.id, id),
  })
  if (!existing) {
    throw new AppError('Question not found', 404)
  }

  const { tagIds, choices: newChoices, ...updateData } = body
  const timestamp = now()

  if (newChoices !== undefined) {
    const correctCount = newChoices.filter((c) => c.isCorrect).length
    updateData.isMultiAnswer = correctCount > 1
  }

  await db
    .update(questions)
    .set({
      ...updateData,
      version: (existing.version ?? 1) + 1,
      updatedAt: timestamp,
    })
    .where(eq(questions.id, id))

  if (tagIds !== undefined) {
    if (tagIds.length > 0) {
      const userTags = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(inArray(tags.id, tagIds), eq(tags.userId, userId)))
      if (userTags.length !== tagIds.length) {
        throw new AppError('One or more tags not found', 404)
      }
    }
    await db.delete(questionTags).where(eq(questionTags.questionId, id))
    if (tagIds.length > 0) {
      await db.insert(questionTags).values(
        tagIds.map((tagId) => ({
          questionId: id,
          tagId,
        })),
      )
    }
  }

  if (newChoices !== undefined) {
    await db.delete(choices).where(eq(choices.questionId, id))
    if (newChoices.length > 0) {
      await db.insert(choices).values(
        newChoices.map((ch) => ({
          id: generateUlid(),
          questionId: id,
          body: ch.body,
          isCorrect: ch.isCorrect,
          explanation: ch.explanation,
          sortOrder: ch.sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
    }
  }

  return c.json({ success: true })
})

app.delete('/:setId/questions/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const setId = c.req.param('setId')
  await getQuestionSetForUser(db, setId, userId)
  const id = c.req.param('id')

  const existing = await db.query.questions.findFirst({
    where: eq(questions.id, id),
  })
  if (!existing) {
    throw new AppError('Question not found', 404)
  }

  await db.delete(questions).where(eq(questions.id, id))
  return c.json({ success: true })
})

app.patch('/:setId/questions/reorder', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const setId = c.req.param('setId')
  await getQuestionSetForUser(db, setId, userId)
  const body = reorderQuestionsSchema.parse(await c.req.json())

  const timestamp = now()
  await Promise.all(
    body.orders.map(({ id, sortOrder }) =>
      db
        .update(questions)
        .set({ sortOrder, updatedAt: timestamp })
        .where(eq(questions.id, id)),
    ),
  )

  return c.json({ success: true })
})

export default app
