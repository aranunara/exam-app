import { Hono } from 'hono'
import { eq, and, inArray } from 'drizzle-orm'
import type { Env } from '../../types'
import {
  examSessions,
  sessionAnswers,
  sessionAnswerChoices,
  workbooks,
  questions,
  choices,
  questionConfidence,
} from '../../db/schema'
import {
  createSessionSchema,
  submitAnswerSchema,
  completeSessionSchema,
  previewFilterSchema,
} from '../validators/sessions'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { shuffleArray } from '../../lib/shuffle'
import { calculateScorePercent } from '../../lib/scoring'
import { chunkedInsert } from '../../lib/chunked-insert'
import { AppError } from '../middleware/error-handler'
import { getSessionForUser } from '../helpers/ownership'

const app = new Hono<Env>()

app.post('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = createSessionSchema.parse(await c.req.json())

  const workbook = await db.query.workbooks.findFirst({
    where: and(
      eq(workbooks.id, body.workbookId),
      eq(workbooks.userId, userId),
      eq(workbooks.isPublished, true),
    ),
  })
  if (!workbook) {
    throw new AppError('Workbook not found or not published', 404)
  }

  const allQuestions = await db.query.questions.findMany({
    where: eq(questions.workbookId, body.workbookId),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  })

  if (allQuestions.length === 0) {
    throw new AppError('Question set has no questions', 400)
  }

  let filteredQuestions = allQuestions

  if (
    body.filters?.confidenceLevels &&
    body.filters.confidenceLevels.length > 0
  ) {
    const selectedLevels = body.filters.confidenceLevels
    const includeNoConfidence = selectedLevels.includes(0)
    const nonZeroLevels = selectedLevels.filter((l) => l !== 0)

    const confidenceRows = await db
      .select({
        questionId: questionConfidence.questionId,
        level: questionConfidence.level,
      })
      .from(questionConfidence)
      .where(
        and(
          eq(questionConfidence.userId, userId),
          inArray(
            questionConfidence.questionId,
            filteredQuestions.map((q) => q.id),
          ),
        ),
      )
    const levelByQuestion = new Map(
      confidenceRows.map((r) => [r.questionId, r.level]),
    )
    filteredQuestions = filteredQuestions.filter((q) => {
      const level = levelByQuestion.get(q.id)
      if (level === undefined) return includeNoConfidence
      return nonZeroLevels.includes(level)
    })
  }

  if (filteredQuestions.length === 0) {
    throw new AppError(
      'No questions match the selected filters',
      400,
    )
  }

  const shuffledQuestionIds = shuffleArray(
    filteredQuestions.map((q) => q.id),
  )
  const timestamp = now()
  const sessionId = generateUlid()

  await db
    .update(examSessions)
    .set({ status: 'abandoned', completedAt: timestamp })
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.workbookId, body.workbookId),
        eq(examSessions.status, 'in_progress'),
      ),
    )

  await db.insert(examSessions).values({
    id: sessionId,
    userId,
    workbookId: body.workbookId,
    mode: body.mode,
    status: 'in_progress',
    questionOrder: JSON.stringify(shuffledQuestionIds),
    totalQuestions: filteredQuestions.length,
    startedAt: timestamp,
  })

  const allChoices = await db.query.choices.findMany({
    where: inArray(
      choices.questionId,
      filteredQuestions.map((q) => q.id),
    ),
    orderBy: (ch, { asc }) => [asc(ch.sortOrder)],
  })

  const choicesByQuestion = new Map<
    string,
    (typeof allChoices)[number][]
  >()
  for (const c of allChoices) {
    const list = choicesByQuestion.get(c.questionId) ?? []
    list.push(c)
    choicesByQuestion.set(c.questionId, list)
  }

  const sessionAnswerValues = filteredQuestions.map((q) => {
    const qChoices = choicesByQuestion.get(q.id) ?? []
    const shuffledChoiceIds = shuffleArray(qChoices.map((ch) => ch.id))
    const snapshot = JSON.stringify({
      body: q.body,
      explanation: q.explanation,
      isMultiAnswer: q.isMultiAnswer,
      choices: qChoices.map((ch) => ({
        id: ch.id,
        body: ch.body,
        isCorrect: ch.isCorrect,
        explanation: ch.explanation,
      })),
    })

    return {
      id: generateUlid(),
      sessionId,
      questionId: q.id,
      choiceOrder: JSON.stringify(shuffledChoiceIds),
      questionVersion: q.version ?? 1,
      questionSnapshot: snapshot,
    }
  })

  await chunkedInsert(sessionAnswerValues, 6, (chunk) =>
    db.insert(sessionAnswers).values(chunk),
  )

  return c.json(
    {
      success: true,
      data: {
        id: sessionId,
        workbookId: body.workbookId,
        mode: body.mode,
        totalQuestions: filteredQuestions.length,
        timeLimit: workbook.timeLimit,
      },
    },
    201,
  )
})

app.post('/preview-filter', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = previewFilterSchema.parse(await c.req.json())

  const workbook = await db.query.workbooks.findFirst({
    where: and(
      eq(workbooks.id, body.workbookId),
      eq(workbooks.userId, userId),
    ),
  })
  if (!workbook) {
    throw new AppError('Workbook not found', 404)
  }

  const allQuestions = await db.query.questions.findMany({
    where: eq(questions.workbookId, body.workbookId),
  })

  const questionIds = allQuestions.map((q) => q.id)

  const confidenceByQuestion: Record<string, number> = {}
  if (questionIds.length > 0) {
    const confidenceRows = await db
      .select({
        questionId: questionConfidence.questionId,
        level: questionConfidence.level,
      })
      .from(questionConfidence)
      .where(
        and(
          eq(questionConfidence.userId, userId),
          inArray(questionConfidence.questionId, questionIds),
        ),
      )

    for (const row of confidenceRows) {
      confidenceByQuestion[row.questionId] = row.level
    }
  }

  return c.json({
    success: true,
    data: {
      totalQuestions: allQuestions.length,
      confidenceByQuestion,
    },
  })
})

app.get('/in-progress/:workbookId', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const workbookId = c.req.param('workbookId')

  const session = await db.query.examSessions.findFirst({
    where: and(
      eq(examSessions.userId, userId),
      eq(examSessions.workbookId, workbookId),
      eq(examSessions.status, 'in_progress'),
    ),
    orderBy: (s, { desc }) => [desc(s.startedAt)],
  })

  if (!session) {
    return c.json({ success: true, data: null })
  }

  const answers = await db.query.sessionAnswers.findMany({
    where: eq(sessionAnswers.sessionId, session.id),
  })

  const answeredCount = answers.filter((a) => a.isCorrect !== null).length
  const questionOrder: string[] = JSON.parse(session.questionOrder)
  const answeredIds = new Set(
    answers.filter((a) => a.isCorrect !== null).map((a) => a.questionId),
  )
  const firstUnansweredIndex = questionOrder.findIndex(
    (qid) => !answeredIds.has(qid),
  )

  return c.json({
    success: true,
    data: {
      id: session.id,
      mode: session.mode,
      totalQuestions: session.totalQuestions,
      answeredCount,
      firstUnansweredIndex:
        firstUnansweredIndex === -1 ? questionOrder.length - 1 : firstUnansweredIndex,
      timeSpentSec: session.timeSpentSec ?? 0,
      startedAt: session.startedAt,
    },
  })
})

app.get('/:id', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const sessionId = c.req.param('id')

  const session = await getSessionForUser(db, sessionId, userId)
  const workbook = await db.query.workbooks.findFirst({
    where: eq(workbooks.id, session.workbookId),
  })

  const answers = await db.query.sessionAnswers.findMany({
    where: eq(sessionAnswers.sessionId, sessionId),
  })
  const answeredCount = answers.filter((a) => a.isCorrect !== null).length
  const questionOrder: string[] = JSON.parse(session.questionOrder)
  const answeredIds = new Set(
    answers.filter((a) => a.isCorrect !== null).map((a) => a.questionId),
  )
  const firstUnansweredIndex = questionOrder.findIndex(
    (qid) => !answeredIds.has(qid),
  )

  const answersByQuestionId = new Map(
    answers.map((a) => [a.questionId, a]),
  )
  const answersStatus: Record<number, boolean> = {}
  if (session.mode === 'practice') {
    questionOrder.forEach((qid, idx) => {
      const ans = answersByQuestionId.get(qid)
      if (ans && ans.isCorrect !== null) {
        answersStatus[idx] = ans.isCorrect
      }
    })
  }

  return c.json({
    success: true,
    data: {
      id: session.id,
      workbookId: session.workbookId,
      mode: session.mode,
      status: session.status,
      totalQuestions: session.totalQuestions,
      answeredCount,
      firstUnansweredIndex:
        firstUnansweredIndex === -1 ? questionOrder.length - 1 : firstUnansweredIndex,
      timeSpentSec: session.timeSpentSec ?? 0,
      timeLimit: workbook?.timeLimit ?? null,
      startedAt: session.startedAt,
      answersStatus,
    },
  })
})

app.get('/:id/questions/:index', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const sessionId = c.req.param('id')
  const index = parseInt(c.req.param('index'), 10)

  const session = await getSessionForUser(db, sessionId, userId)

  const questionOrder: string[] = JSON.parse(session.questionOrder)
  if (index < 0 || index >= questionOrder.length) {
    throw new AppError('Invalid question index', 400)
  }

  const questionId = questionOrder[index]
  const answer = await db.query.sessionAnswers.findFirst({
    where: and(
      eq(sessionAnswers.sessionId, sessionId),
      eq(sessionAnswers.questionId, questionId),
    ),
  })

  if (!answer) {
    throw new AppError('Question not found in session', 404)
  }

  const snapshot = JSON.parse(answer.questionSnapshot)
  const choiceOrder: string[] = JSON.parse(answer.choiceOrder)

  const orderedChoices = choiceOrder
    .map((cId) => snapshot.choices.find((ch: { id: string }) => ch.id === cId))
    .filter(Boolean)
    .map((ch: { id: string; body: string }) => ({
      id: ch.id,
      body: ch.body,
    }))

  const selectedChoices = await db
    .select()
    .from(sessionAnswerChoices)
    .where(eq(sessionAnswerChoices.sessionAnswerId, answer.id))

  return c.json({
    success: true,
    data: {
      questionId,
      index,
      totalQuestions: questionOrder.length,
      body: snapshot.body,
      isMultiAnswer: snapshot.isMultiAnswer,
      choices: orderedChoices,
      isAnswered: answer.isCorrect !== null,
      selectedChoiceIds: selectedChoices.map((sc) => sc.choiceId),
    },
  })
})

app.post('/:id/answers', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const sessionId = c.req.param('id')
  const body = submitAnswerSchema.parse(await c.req.json())

  const session = await getSessionForUser(db, sessionId, userId)
  if (session.status !== 'in_progress') {
    throw new AppError('Session already completed', 400)
  }

  const answer = await db.query.sessionAnswers.findFirst({
    where: and(
      eq(sessionAnswers.sessionId, sessionId),
      eq(sessionAnswers.questionId, body.questionId),
    ),
  })
  if (!answer) {
    throw new AppError('Question not found in session', 404)
  }

  const snapshot = JSON.parse(answer.questionSnapshot)
  const correctChoiceIds = new Set(
    snapshot.choices
      .filter((ch: { isCorrect: boolean }) => ch.isCorrect)
      .map((ch: { id: string }) => ch.id),
  )

  const isCorrect =
    body.choiceIds.length === correctChoiceIds.size &&
    body.choiceIds.every((id) => correctChoiceIds.has(id))

  await db
    .update(sessionAnswers)
    .set({
      isCorrect,
      timeSpentSec: body.timeSpentSec,
      answeredAt: now(),
    })
    .where(eq(sessionAnswers.id, answer.id))

  if (body.sessionElapsedSec !== undefined) {
    const nextElapsed = Math.max(
      session.timeSpentSec ?? 0,
      body.sessionElapsedSec,
    )
    await db
      .update(examSessions)
      .set({ timeSpentSec: nextElapsed })
      .where(eq(examSessions.id, sessionId))
  }

  await db
    .delete(sessionAnswerChoices)
    .where(eq(sessionAnswerChoices.sessionAnswerId, answer.id))

  if (body.choiceIds.length > 0) {
    await db.insert(sessionAnswerChoices).values(
      body.choiceIds.map((choiceId) => ({
        sessionAnswerId: answer.id,
        choiceId,
      })),
    )
  }

  const existingConfidence = await db.query.questionConfidence.findFirst({
    where: and(
      eq(questionConfidence.userId, userId),
      eq(questionConfidence.questionId, body.questionId),
    ),
  })
  const resolvedConfidenceLevel = isCorrect
    ? (existingConfidence?.level ?? 0)
    : 1

  if (!isCorrect) {
    c.executionCtx.waitUntil(
      (async () => {
        try {
          if (existingConfidence) {
            await db
              .update(questionConfidence)
              .set({ level: 1, updatedAt: now() })
              .where(eq(questionConfidence.id, existingConfidence.id))
          } else {
            await db.insert(questionConfidence).values({
              id: generateUlid(),
              userId,
              questionId: body.questionId,
              level: 1,
              updatedAt: now(),
            })
          }
        } catch (err) {
          console.error('Failed to update question confidence:', err)
        }
      })(),
    )
  }

  if (session.mode === 'practice') {
    return c.json({
      success: true,
      data: {
        isCorrect,
        explanation: snapshot.explanation,
        confidenceLevel: resolvedConfidenceLevel,
        choices: snapshot.choices.map(
          (ch: {
            id: string
            isCorrect: boolean
            explanation: string | null
          }) => ({
            id: ch.id,
            isCorrect: ch.isCorrect,
            explanation: ch.explanation,
          }),
        ),
      },
    })
  }

  return c.json({ success: true, data: { received: true } })
})

app.post('/:id/complete', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const sessionId = c.req.param('id')
  const body = completeSessionSchema.parse(await c.req.json())

  const session = await getSessionForUser(db, sessionId, userId)
  if (session.status !== 'in_progress') {
    throw new AppError('Session already completed', 400)
  }

  const answers = await db.query.sessionAnswers.findMany({
    where: eq(sessionAnswers.sessionId, sessionId),
  })

  const answered = answers.filter((a) => a.isCorrect !== null)
  const unansweredIds = answers
    .filter((a) => a.isCorrect === null)
    .map((a) => a.id)

  const correctCount = answered.filter((a) => a.isCorrect === true).length
  const answeredCount = answered.length
  const scorePercent = calculateScorePercent(correctCount, answeredCount)

  if (unansweredIds.length > 0) {
    await db
      .delete(sessionAnswers)
      .where(inArray(sessionAnswers.id, unansweredIds))
  }

  await db
    .update(examSessions)
    .set({
      status: 'completed',
      correctCount,
      scorePercent,
      totalQuestions: answeredCount,
      completedAt: now(),
      timeSpentSec: body.timeSpentSec,
    })
    .where(eq(examSessions.id, sessionId))

  return c.json({
    success: true,
    data: {
      correctCount,
      totalQuestions: answeredCount,
      scorePercent,
    },
  })
})

app.post('/:id/abort', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const sessionId = c.req.param('id')
  const body = completeSessionSchema.parse(await c.req.json().catch(() => ({})))

  const session = await getSessionForUser(db, sessionId, userId)
  if (session.status !== 'in_progress') {
    throw new AppError('Session already finished', 400)
  }

  const answers = await db.query.sessionAnswers.findMany({
    where: eq(sessionAnswers.sessionId, sessionId),
  })
  const answered = answers.filter((a) => a.isCorrect !== null)
  const unansweredIds = answers
    .filter((a) => a.isCorrect === null)
    .map((a) => a.id)

  if (unansweredIds.length > 0) {
    await db
      .delete(sessionAnswers)
      .where(inArray(sessionAnswers.id, unansweredIds))
  }

  const nextElapsed =
    body.timeSpentSec !== undefined
      ? Math.max(session.timeSpentSec ?? 0, body.timeSpentSec)
      : (session.timeSpentSec ?? 0)

  const timestamp = now()

  await db
    .update(examSessions)
    .set({
      status: 'abandoned',
      totalQuestions: answered.length,
      completedAt: timestamp,
      timeSpentSec: nextElapsed,
    })
    .where(eq(examSessions.id, sessionId))

  await db
    .update(examSessions)
    .set({ status: 'abandoned', completedAt: timestamp })
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.workbookId, session.workbookId),
        eq(examSessions.status, 'in_progress'),
      ),
    )

  return c.json({ success: true, data: { id: sessionId } })
})

app.get('/:id/results', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const sessionId = c.req.param('id')

  const session = await getSessionForUser(db, sessionId, userId)

  const answers = await db.query.sessionAnswers.findMany({
    where: eq(sessionAnswers.sessionId, sessionId),
  })

  const questionOrder: string[] = JSON.parse(session.questionOrder)

  const confidenceRows = await db
    .select({
      questionId: questionConfidence.questionId,
      level: questionConfidence.level,
    })
    .from(questionConfidence)
    .where(
      and(
        eq(questionConfidence.userId, userId),
        inArray(questionConfidence.questionId, questionOrder),
      ),
    )

  const confidenceMap = new Map(
    confidenceRows.map((r) => [r.questionId, r.level]),
  )

  const answerIds = answers.map((a) => a.id)
  const allSelectedChoices =
    answerIds.length > 0
      ? await db
          .select()
          .from(sessionAnswerChoices)
          .where(inArray(sessionAnswerChoices.sessionAnswerId, answerIds))
      : []

  const choicesByAnswer = new Map<string, string[]>()
  for (const sc of allSelectedChoices) {
    const list = choicesByAnswer.get(sc.sessionAnswerId) ?? []
    list.push(sc.choiceId)
    choicesByAnswer.set(sc.sessionAnswerId, list)
  }

  const results = questionOrder
    .map((questionId, index) => {
      const answer = answers.find((a) => a.questionId === questionId)
      if (!answer) return null

      const snapshot = JSON.parse(answer.questionSnapshot)

      return {
        index,
        questionId,
        body: snapshot.body,
        explanation: snapshot.explanation,
        isMultiAnswer: snapshot.isMultiAnswer,
        isCorrect: answer.isCorrect,
        timeSpentSec: answer.timeSpentSec,
        confidenceLevel: confidenceMap.get(questionId) ?? 0,
        selectedChoiceIds: choicesByAnswer.get(answer.id) ?? [],
        choices: snapshot.choices,
      }
    })

  return c.json({
    success: true,
    data: {
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        totalQuestions: session.totalQuestions,
        correctCount: session.correctCount,
        scorePercent: session.scorePercent,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        timeSpentSec: session.timeSpentSec,
      },
      results: results.filter(Boolean),
    },
  })
})

export default app
