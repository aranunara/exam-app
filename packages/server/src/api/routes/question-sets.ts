import { Hono } from 'hono'
import { eq, and, count, inArray } from 'drizzle-orm'
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

type Database = ReturnType<typeof import('../../db').createDb>

async function fetchQuestionsWithDetails(db: Database, questionSetId: string) {
  const qs = await db.query.questions.findMany({
    where: eq(questions.questionSetId, questionSetId),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  })

  if (qs.length === 0) return []

  const questionIds = qs.map((q) => q.id)

  const [allChoices, allQTags] = await Promise.all([
    db.query.choices.findMany({
      where: inArray(choices.questionId, questionIds),
      orderBy: (ch, { asc }) => [asc(ch.sortOrder)],
    }),
    db
      .select()
      .from(questionTags)
      .where(inArray(questionTags.questionId, questionIds)),
  ])

  const choicesByQuestion = new Map<string, (typeof allChoices)[number][]>()
  for (const c of allChoices) {
    const list = choicesByQuestion.get(c.questionId) ?? []
    list.push(c)
    choicesByQuestion.set(c.questionId, list)
  }

  const tagsByQuestion = new Map<string, string[]>()
  for (const t of allQTags) {
    const list = tagsByQuestion.get(t.questionId) ?? []
    list.push(t.tagId)
    tagsByQuestion.set(t.questionId, list)
  }

  return qs.map((q) => ({
    ...q,
    choices: choicesByQuestion.get(q.id) ?? [],
    tagIds: tagsByQuestion.get(q.id) ?? [],
  }))
}

function buildBulkQuestionValues(
  setId: string,
  inputQuestions: Array<{
    body: string
    explanation?: string | null
    sortOrder: number
    choices: Array<{
      body: string
      isCorrect: boolean
      explanation?: string | null
      sortOrder: number
    }>
    tagIds?: string[]
  }>,
  timestamp: string,
) {
  const questionValues: Array<{
    id: string
    questionSetId: string
    body: string
    explanation: string | undefined | null
    isMultiAnswer: boolean
    sortOrder: number
    createdAt: string
    updatedAt: string
  }> = []
  const choiceValues: Array<{
    id: string
    questionId: string
    body: string
    isCorrect: boolean
    explanation: string | undefined | null
    sortOrder: number
    createdAt: string
    updatedAt: string
  }> = []
  const tagValues: Array<{ questionId: string; tagId: string }> = []

  for (const q of inputQuestions) {
    const questionId = generateUlid()
    questionValues.push({
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
      for (const tagId of q.tagIds) {
        tagValues.push({ questionId, tagId })
      }
    }

    for (const ch of q.choices) {
      choiceValues.push({
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

  return { questionValues, choiceValues, tagValues }
}

async function bulkInsertQuestions(
  db: Database,
  setId: string,
  inputQuestions: Parameters<typeof buildBulkQuestionValues>[1],
  timestamp: string,
) {
  const { questionValues, choiceValues, tagValues } = buildBulkQuestionValues(
    setId,
    inputQuestions,
    timestamp,
  )

  if (questionValues.length > 0) {
    await db.insert(questions).values(questionValues)
  }
  if (choiceValues.length > 0) {
    await db.insert(choices).values(choiceValues)
  }
  if (tagValues.length > 0) {
    await db.insert(questionTags).values(tagValues)
  }
}

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

  const resultIds = result.map((qs) => qs.id)
  const counts =
    resultIds.length > 0
      ? await db
          .select({
            questionSetId: questions.questionSetId,
            questionCount: count(questions.id),
          })
          .from(questions)
          .where(inArray(questions.questionSetId, resultIds))
          .groupBy(questions.questionSetId)
      : []

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

  const questionsWithDetails = await fetchQuestionsWithDetails(db, id)

  return c.json({
    success: true,
    data: {
      ...questionSet,
      tagIds: setTags.map((t) => t.tagId),
      questions: questionsWithDetails,
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
    await bulkInsertQuestions(db, setId, body.questions, timestamp)
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

  const [questionsWithDetails, setTags] = await Promise.all([
    fetchQuestionsWithDetails(db, id),
    db
      .select()
      .from(questionSetTags)
      .where(eq(questionSetTags.questionSetId, id)),
  ])

  return c.json({
    success: true,
    data: {
      ...questionSet,
      tagIds: setTags.map((t) => t.tagId),
      questions: questionsWithDetails,
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
    await bulkInsertQuestions(db, setId, body.questions, timestamp)
  }

  return c.json({ success: true, data: { id: setId } }, 201)
})

export default app
