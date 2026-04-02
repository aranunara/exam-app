import { Hono } from 'hono'
import { eq, and, count, inArray } from 'drizzle-orm'
import type { Env } from '../../types'
import {
  workbooks,
  workbookTags,
  questions,
  questionTags,
  choices,
  tags,
} from '../../db/schema'
import {
  createWorkbookSchema,
  updateWorkbookSchema,
} from '../validators/workbooks'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { AppError } from '../middleware/error-handler'
import {
  getSubjectForUser,
  getWorkbookForUser,
} from '../helpers/ownership'

const app = new Hono<Env>()

type Database = ReturnType<typeof import('../../db').createDb>

async function verifyTagsOwnership(
  db: Database,
  tagIds: string[],
  userId: string,
) {
  const userTags = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(inArray(tags.id, tagIds), eq(tags.userId, userId)))
  if (userTags.length !== tagIds.length) {
    throw new AppError('One or more tags not found', 404)
  }
}

async function fetchQuestionsWithDetails(db: Database, workbookId: string) {
  const qs = await db.query.questions.findMany({
    where: eq(questions.workbookId, workbookId),
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
  workbookId: string,
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
    workbookId: string
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
      workbookId,
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
  workbookId: string,
  inputQuestions: Parameters<typeof buildBulkQuestionValues>[1],
  timestamp: string,
) {
  const { questionValues, choiceValues, tagValues } = buildBulkQuestionValues(
    workbookId,
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
  const userId = c.get('userId')
  const subjectId = c.req.query('subjectId')
  const published = c.req.query('published')

  const conditions = [eq(workbooks.userId, userId)]
  if (subjectId) {
    conditions.push(eq(workbooks.subjectId, subjectId))
  }
  if (published === 'true') {
    conditions.push(eq(workbooks.isPublished, true))
  } else if (published === 'false') {
    conditions.push(eq(workbooks.isPublished, false))
  }

  const result = await db.query.workbooks.findMany({
    where: and(...conditions),
    orderBy: (wb, { desc }) => [desc(wb.createdAt)],
  })

  const resultIds = result.map((wb) => wb.id)
  const counts =
    resultIds.length > 0
      ? await db
          .select({
            workbookId: questions.workbookId,
            questionCount: count(questions.id),
          })
          .from(questions)
          .where(inArray(questions.workbookId, resultIds))
          .groupBy(questions.workbookId)
      : []

  const countMap = new Map(
    counts.map((c) => [c.workbookId, c.questionCount]),
  )

  const data = result.map((wb) => ({
    ...wb,
    questionCount: countMap.get(wb.id) ?? 0,
  }))

  return c.json({ success: true, data })
})

app.get('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')

  const workbook = await getWorkbookForUser(db, id, userId)

  const wbTags = await db
    .select()
    .from(workbookTags)
    .where(eq(workbookTags.workbookId, id))

  const questionsWithDetails = await fetchQuestionsWithDetails(db, id)

  return c.json({
    success: true,
    data: {
      ...workbook,
      tagIds: wbTags.map((t) => t.tagId),
      questions: questionsWithDetails,
    },
  })
})

app.post('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = createWorkbookSchema.parse(await c.req.json())
  const timestamp = now()

  await getSubjectForUser(db, body.subjectId, userId)
  if (body.tagIds?.length) {
    await verifyTagsOwnership(db, body.tagIds, userId)
  }

  const workbookId = generateUlid()
  const workbook = {
    id: workbookId,
    userId,
    subjectId: body.subjectId,
    title: body.title,
    description: body.description,
    timeLimit: body.timeLimit,
    isPublished: body.isPublished,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await db.insert(workbooks).values(workbook)

  if (body.tagIds?.length) {
    await db.insert(workbookTags).values(
      body.tagIds.map((tagId) => ({
        workbookId,
        tagId,
      })),
    )
  }

  if (body.questions?.length) {
    await bulkInsertQuestions(db, workbookId, body.questions, timestamp)
  }

  return c.json({ success: true, data: workbook }, 201)
})

app.put('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = updateWorkbookSchema.parse(await c.req.json())

  const existing = await getWorkbookForUser(db, id, userId)

  const { tagIds, ...updateData } = body
  if (tagIds?.length) {
    await verifyTagsOwnership(db, tagIds, userId)
  }

  await db
    .update(workbooks)
    .set({ ...updateData, updatedAt: now() })
    .where(and(eq(workbooks.id, id), eq(workbooks.userId, userId)))

  if (tagIds !== undefined) {
    await db
      .delete(workbookTags)
      .where(eq(workbookTags.workbookId, id))
    if (tagIds.length > 0) {
      await db.insert(workbookTags).values(
        tagIds.map((tagId) => ({
          workbookId: id,
          tagId,
        })),
      )
    }
  }

  return c.json({ success: true, data: { ...existing, ...updateData } })
})

app.delete('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')

  await getWorkbookForUser(db, id, userId)

  await db
    .delete(workbooks)
    .where(and(eq(workbooks.id, id), eq(workbooks.userId, userId)))
  return c.json({ success: true })
})

app.get('/:id/export', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const id = c.req.param('id')

  const workbook = await getWorkbookForUser(db, id, userId)

  const [questionsWithDetails, wbTags] = await Promise.all([
    fetchQuestionsWithDetails(db, id),
    db
      .select()
      .from(workbookTags)
      .where(eq(workbookTags.workbookId, id)),
  ])

  return c.json({
    success: true,
    data: {
      ...workbook,
      tagIds: wbTags.map((t) => t.tagId),
      questions: questionsWithDetails,
    },
  })
})

app.post('/import', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = createWorkbookSchema.parse(await c.req.json())
  const timestamp = now()

  await getSubjectForUser(db, body.subjectId, userId)
  if (body.tagIds?.length) {
    await verifyTagsOwnership(db, body.tagIds, userId)
  }

  const workbookId = generateUlid()
  await db.insert(workbooks).values({
    id: workbookId,
    userId,
    subjectId: body.subjectId,
    title: body.title,
    description: body.description,
    timeLimit: body.timeLimit,
    isPublished: body.isPublished,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  if (body.tagIds?.length) {
    await db.insert(workbookTags).values(
      body.tagIds.map((tagId) => ({
        workbookId,
        tagId,
      })),
    )
  }

  if (body.questions?.length) {
    await bulkInsertQuestions(db, workbookId, body.questions, timestamp)
  }

  return c.json({ success: true, data: { id: workbookId } }, 201)
})

export default app
