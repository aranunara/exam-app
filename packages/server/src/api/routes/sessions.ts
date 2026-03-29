import { Hono } from 'hono'
import { eq, and, inArray } from 'drizzle-orm'
import type { Env } from '../../types'
import {
  examSessions,
  sessionAnswers,
  sessionAnswerChoices,
  questionSets,
  questions,
  choices,
  questionConfidence,
} from '../../db/schema'
import {
  createSessionSchema,
  submitAnswerSchema,
  completeSessionSchema,
  flagQuestionSchema,
} from '../validators/sessions'
import { generateUlid } from '../../lib/ulid'
import { now } from '../../lib/timestamp'
import { shuffleArray } from '../../lib/shuffle'
import { calculateScorePercent } from '../../lib/scoring'
import { AppError } from '../middleware/error-handler'

const app = new Hono<Env>()

app.post('/', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const body = createSessionSchema.parse(await c.req.json())

  const questionSet = await db.query.questionSets.findFirst({
    where: and(
      eq(questionSets.id, body.questionSetId),
      eq(questionSets.isPublished, true),
    ),
  })
  if (!questionSet) {
    throw new AppError('Question set not found or not published', 404)
  }

  const allQuestions = await db.query.questions.findMany({
    where: eq(questions.questionSetId, body.questionSetId),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  })

  if (allQuestions.length === 0) {
    throw new AppError('Question set has no questions', 400)
  }

  const shuffledQuestionIds = shuffleArray(allQuestions.map((q) => q.id))
  const timestamp = now()
  const sessionId = generateUlid()

  await db.insert(examSessions).values({
    id: sessionId,
    userId,
    questionSetId: body.questionSetId,
    mode: body.mode,
    status: 'in_progress',
    questionOrder: JSON.stringify(shuffledQuestionIds),
    totalQuestions: allQuestions.length,
    startedAt: timestamp,
  })

  const allChoices = await db.query.choices.findMany({
    where: inArray(
      choices.questionId,
      allQuestions.map((q) => q.id),
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

  const sessionAnswerValues = allQuestions.map((q) => {
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

  await db.insert(sessionAnswers).values(sessionAnswerValues)

  return c.json(
    {
      success: true,
      data: {
        id: sessionId,
        questionSetId: body.questionSetId,
        mode: body.mode,
        totalQuestions: allQuestions.length,
        timeLimit: questionSet.timeLimit,
      },
    },
    201,
  )
})

app.get('/:id/questions/:index', async (c) => {
  const db = c.get('db')
  const sessionId = c.req.param('id')
  const index = parseInt(c.req.param('index'), 10)

  const session = await db.query.examSessions.findFirst({
    where: eq(examSessions.id, sessionId),
  })
  if (!session) {
    throw new AppError('Session not found', 404)
  }

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
      isFlagged: answer.isFlagged,
      isAnswered: answer.isCorrect !== null,
      selectedChoiceIds: selectedChoices.map((sc) => sc.choiceId),
    },
  })
})

app.post('/:id/answers', async (c) => {
  const db = c.get('db')
  const sessionId = c.req.param('id')
  const body = submitAnswerSchema.parse(await c.req.json())

  const session = await db.query.examSessions.findFirst({
    where: eq(examSessions.id, sessionId),
  })
  if (!session || session.status !== 'in_progress') {
    throw new AppError('Session not found or already completed', 400)
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

  if (!isCorrect) {
    const userId = c.get('userId')
    c.executionCtx.waitUntil(
      (async () => {
        try {
          const existing = await db.query.questionConfidence.findFirst({
            where: and(
              eq(questionConfidence.userId, userId),
              eq(questionConfidence.questionId, body.questionId),
            ),
          })
          if (existing) {
            await db
              .update(questionConfidence)
              .set({ level: 1, updatedAt: now() })
              .where(eq(questionConfidence.id, existing.id))
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

app.post('/:id/flag', async (c) => {
  const db = c.get('db')
  const sessionId = c.req.param('id')
  const { questionId, isFlagged } = flagQuestionSchema.parse(
    await c.req.json(),
  )

  const answer = await db.query.sessionAnswers.findFirst({
    where: and(
      eq(sessionAnswers.sessionId, sessionId),
      eq(sessionAnswers.questionId, questionId),
    ),
  })
  if (!answer) {
    throw new AppError('Question not found in session', 404)
  }

  await db
    .update(sessionAnswers)
    .set({ isFlagged })
    .where(eq(sessionAnswers.id, answer.id))

  return c.json({ success: true })
})

app.post('/:id/complete', async (c) => {
  const db = c.get('db')
  const sessionId = c.req.param('id')
  const body = completeSessionSchema.parse(await c.req.json())

  const session = await db.query.examSessions.findFirst({
    where: eq(examSessions.id, sessionId),
  })
  if (!session || session.status !== 'in_progress') {
    throw new AppError('Session not found or already completed', 400)
  }

  const answers = await db.query.sessionAnswers.findMany({
    where: eq(sessionAnswers.sessionId, sessionId),
  })

  const correctCount = answers.filter((a) => a.isCorrect === true).length
  const scorePercent = calculateScorePercent(
    correctCount,
    session.totalQuestions,
  )

  await db
    .update(examSessions)
    .set({
      status: 'completed',
      correctCount,
      scorePercent,
      completedAt: now(),
      timeSpentSec: body.timeSpentSec,
    })
    .where(eq(examSessions.id, sessionId))

  return c.json({
    success: true,
    data: {
      correctCount,
      totalQuestions: session.totalQuestions,
      scorePercent,
    },
  })
})

app.get('/:id/results', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const sessionId = c.req.param('id')

  const session = await db.query.examSessions.findFirst({
    where: eq(examSessions.id, sessionId),
  })
  if (!session) {
    throw new AppError('Session not found', 404)
  }

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
        isFlagged: answer.isFlagged,
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
