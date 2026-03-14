import { Hono } from 'hono'
import { eq, and, count } from 'drizzle-orm'
import type { Env } from '../../types'
import {
  questionSets,
  questionSetTags,
  questions,
  questionTags,
  choices,
} from '../../db/schema'
import {
  createQuestionSetSchema,
  updateQuestionSetSchema,
} from '../validators/question-sets'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { AppError } from '../middleware/error-handler'

const app = new Hono<Env>()

app.get('/', async (c) => {
  const db = c.get('db')
  const categoryId = c.req.query('categoryId')
  const published = c.req.query('published')

  const conditions = []
  if (categoryId) {
    conditions.push(eq(questionSets.categoryId, categoryId))
  }
  if (published === 'true') {
    conditions.push(eq(questionSets.isPublished, true))
  } else if (published === 'false') {
    conditions.push(eq(questionSets.isPublished, false))
  }

  const result = await db.query.questionSets.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (qs, { desc }) => [desc(qs.createdAt)],
  })

  const counts = await db
    .select({
      questionSetId: questions.questionSetId,
      questionCount: count(questions.id),
    })
    .from(questions)
    .groupBy(questions.questionSetId)

  const countMap = new Map(
    counts.map((c) => [c.questionSetId, c.questionCount]),
  )

  const data = result.map((qs) => ({
    ...qs,
    questionCount: countMap.get(qs.id) ?? 0,
  }))

  return c.json({ success: true, data })
})

app.get('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  const questionSet = await db.query.questionSets.findFirst({
    where: eq(questionSets.id, id),
  })
  if (!questionSet) {
    throw new AppError('Question set not found', 404)
  }

  const setTags = await db
    .select()
    .from(questionSetTags)
    .where(eq(questionSetTags.questionSetId, id))

  const qs = await db.query.questions.findMany({
    where: eq(questions.questionSetId, id),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  })

  const questionsWithChoices = await Promise.all(
    qs.map(async (q) => {
      const qChoices = await db.query.choices.findMany({
        where: eq(choices.questionId, q.id),
        orderBy: (ch, { asc }) => [asc(ch.sortOrder)],
      })
      const qTags = await db
        .select()
        .from(questionTags)
        .where(eq(questionTags.questionId, q.id))
      return { ...q, choices: qChoices, tagIds: qTags.map((t) => t.tagId) }
    }),
  )

  return c.json({
    success: true,
    data: {
      ...questionSet,
      tagIds: setTags.map((t) => t.tagId),
      questions: questionsWithChoices,
    },
  })
})

app.post('/', async (c) => {
  const db = c.get('db')
  const body = createQuestionSetSchema.parse(await c.req.json())
  const timestamp = now()

  const setId = generateUlid()
  const questionSet = {
    id: setId,
    categoryId: body.categoryId,
    title: body.title,
    description: body.description,
    timeLimit: body.timeLimit,
    isPublished: body.isPublished,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.insert(questionSets).values(questionSet)

  if (body.tagIds?.length) {
    await db.insert(questionSetTags).values(
      body.tagIds.map((tagId) => ({
        questionSetId: setId,
        tagId,
      })),
    )
  }

  if (body.questions?.length) {
    for (const q of body.questions) {
      const questionId = generateUlid()
      await db.insert(questions).values({
        id: questionId,
        questionSetId: setId,
        body: q.body,
        explanation: q.explanation,
        isMultiAnswer: q.choices.filter((c) => c.isCorrect).length > 1,
        sortOrder: q.sortOrder,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      if (q.tagIds?.length) {
        await db.insert(questionTags).values(
          q.tagIds.map((tagId) => ({
            questionId,
            tagId,
          })),
        )
      }

      for (const ch of q.choices) {
        await db.insert(choices).values({
          id: generateUlid(),
          questionId,
          body: ch.body,
          isCorrect: ch.isCorrect,
          explanation: ch.explanation,
          sortOrder: ch.sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }
  }

  return c.json({ success: true, data: questionSet }, 201)
})

app.put('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const body = updateQuestionSetSchema.parse(await c.req.json())

  const existing = await db.query.questionSets.findFirst({
    where: eq(questionSets.id, id),
  })
  if (!existing) {
    throw new AppError('Question set not found', 404)
  }

  const { tagIds, ...updateData } = body
  await db
    .update(questionSets)
    .set({ ...updateData, updatedAt: now() })
    .where(eq(questionSets.id, id))

  if (tagIds !== undefined) {
    await db
      .delete(questionSetTags)
      .where(eq(questionSetTags.questionSetId, id))
    if (tagIds.length > 0) {
      await db.insert(questionSetTags).values(
        tagIds.map((tagId) => ({
          questionSetId: id,
          tagId,
        })),
      )
    }
  }

  return c.json({ success: true, data: { ...existing, ...updateData } })
})

app.delete('/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  const existing = await db.query.questionSets.findFirst({
    where: eq(questionSets.id, id),
  })
  if (!existing) {
    throw new AppError('Question set not found', 404)
  }

  await db.delete(questionSets).where(eq(questionSets.id, id))
  return c.json({ success: true })
})

app.get('/:id/export', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  const questionSet = await db.query.questionSets.findFirst({
    where: eq(questionSets.id, id),
  })
  if (!questionSet) {
    throw new AppError('Question set not found', 404)
  }

  const qs = await db.query.questions.findMany({
    where: eq(questions.questionSetId, id),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  })

  const questionsWithChoices = await Promise.all(
    qs.map(async (q) => {
      const qChoices = await db.query.choices.findMany({
        where: eq(choices.questionId, q.id),
        orderBy: (ch, { asc }) => [asc(ch.sortOrder)],
      })
      const qTags = await db
        .select()
        .from(questionTags)
        .where(eq(questionTags.questionId, q.id))
      return { ...q, choices: qChoices, tagIds: qTags.map((t) => t.tagId) }
    }),
  )

  const setTags = await db
    .select()
    .from(questionSetTags)
    .where(eq(questionSetTags.questionSetId, id))

  return c.json({
    success: true,
    data: {
      ...questionSet,
      tagIds: setTags.map((t) => t.tagId),
      questions: questionsWithChoices,
    },
  })
})

app.post('/import', async (c) => {
  const db = c.get('db')
  const body = createQuestionSetSchema.parse(await c.req.json())
  const timestamp = now()

  const setId = generateUlid()
  await db.insert(questionSets).values({
    id: setId,
    categoryId: body.categoryId,
    title: body.title,
    description: body.description,
    timeLimit: body.timeLimit,
    isPublished: body.isPublished,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  if (body.tagIds?.length) {
    await db.insert(questionSetTags).values(
      body.tagIds.map((tagId) => ({
        questionSetId: setId,
        tagId,
      })),
    )
  }

  if (body.questions?.length) {
    for (const q of body.questions) {
      const questionId = generateUlid()
      await db.insert(questions).values({
        id: questionId,
        questionSetId: setId,
        body: q.body,
        explanation: q.explanation,
        isMultiAnswer: q.choices.filter((c) => c.isCorrect).length > 1,
        sortOrder: q.sortOrder,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      if (q.tagIds?.length) {
        await db.insert(questionTags).values(
          q.tagIds.map((tagId) => ({
            questionId,
            tagId,
          })),
        )
      }

      for (const ch of q.choices) {
        await db.insert(choices).values({
          id: generateUlid(),
          questionId,
          body: ch.body,
          isCorrect: ch.isCorrect,
          explanation: ch.explanation,
          sortOrder: ch.sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }
  }

  return c.json({ success: true, data: { id: setId } }, 201)
})

export default app
