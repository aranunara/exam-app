import { Hono } from 'hono'
import { eq, and, inArray } from 'drizzle-orm'
import type { Env } from '../../types'
import {
  subjects,
  workbooks,
  workbookTags,
  questions,
  questionTags,
  choices,
  questionConfidence,
  examSessions,
  sessionAnswers,
  sessionAnswerChoices,
} from '../../db/schema'
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

  const relatedWorkbooks = await db
    .select({ id: workbooks.id })
    .from(workbooks)
    .where(and(eq(workbooks.subjectId, id), eq(workbooks.userId, userId)))

  if (relatedWorkbooks.length > 0) {
    const workbookIds = relatedWorkbooks.map((wb) => wb.id)

    const relatedQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(inArray(questions.workbookId, workbookIds))

    if (relatedQuestions.length > 0) {
      const questionIds = relatedQuestions.map((q) => q.id)

      const relatedSessions = await db
        .select({ id: examSessions.id })
        .from(examSessions)
        .where(inArray(examSessions.workbookId, workbookIds))

      if (relatedSessions.length > 0) {
        const sessionIds = relatedSessions.map((s) => s.id)
        const relatedAnswers = await db
          .select({ id: sessionAnswers.id })
          .from(sessionAnswers)
          .where(inArray(sessionAnswers.sessionId, sessionIds))

        if (relatedAnswers.length > 0) {
          const answerIds = relatedAnswers.map((a) => a.id)
          await db
            .delete(sessionAnswerChoices)
            .where(inArray(sessionAnswerChoices.sessionAnswerId, answerIds))
        }

        await db
          .delete(sessionAnswers)
          .where(inArray(sessionAnswers.sessionId, sessionIds))
        await db
          .delete(examSessions)
          .where(inArray(examSessions.workbookId, workbookIds))
      }

      await db
        .delete(questionConfidence)
        .where(inArray(questionConfidence.questionId, questionIds))
      await db
        .delete(choices)
        .where(inArray(choices.questionId, questionIds))
      await db
        .delete(questionTags)
        .where(inArray(questionTags.questionId, questionIds))
      await db
        .delete(questions)
        .where(inArray(questions.workbookId, workbookIds))
    }

    await db
      .delete(workbookTags)
      .where(inArray(workbookTags.workbookId, workbookIds))
    await db
      .delete(workbooks)
      .where(inArray(workbooks.id, workbookIds))
  }

  await db
    .delete(subjects)
    .where(and(eq(subjects.id, id), eq(subjects.userId, userId)))
  return c.json({ success: true })
})

export default app
