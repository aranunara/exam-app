import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env } from '../../types'
import { questions, questionTags, choices } from '../../db/schema'
import {
  createQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
} from '../validators/questions'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { AppError } from '../middleware/error-handler'

const app = new Hono<Env>()

app.post('/:setId/questions', async (c) => {
  const db = c.get('db')
  const setId = c.req.param('setId')
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
    await db.insert(questionTags).values(
      body.tagIds.map((tagId) => ({
        questionId,
        tagId,
      })),
    )
  }

  const createdChoices = []
  for (const ch of body.choices) {
    const choice = {
      id: generateUlid(),
      questionId,
      body: ch.body,
      isCorrect: ch.isCorrect,
      explanation: ch.explanation,
      sortOrder: ch.sortOrder,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await db.insert(choices).values(choice)
    createdChoices.push(choice)
  }

  return c.json(
    { success: true, data: { ...question, choices: createdChoices } },
    201,
  )
})

app.put('/:setId/questions/:id', async (c) => {
  const db = c.get('db')
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
    for (const ch of newChoices) {
      await db.insert(choices).values({
        id: generateUlid(),
        questionId: id,
        body: ch.body,
        isCorrect: ch.isCorrect,
        explanation: ch.explanation,
        sortOrder: ch.sortOrder,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }
  }

  return c.json({ success: true })
})

app.delete('/:setId/questions/:id', async (c) => {
  const db = c.get('db')
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
  const body = reorderQuestionsSchema.parse(await c.req.json())

  for (const { id, sortOrder } of body.orders) {
    await db
      .update(questions)
      .set({ sortOrder, updatedAt: now() })
      .where(eq(questions.id, id))
  }

  return c.json({ success: true })
})

export default app
