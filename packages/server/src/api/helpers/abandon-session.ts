import { eq, and, inArray } from 'drizzle-orm'
import { examSessions, sessionAnswers } from '../../db/schema'
import { now } from '../../lib/timestamp'
import { calculateScorePercent } from '../../lib/scoring'
import type { Database } from '../../db'

type AbandonableSession = {
  id: string
  questionOrder: string
  timeSpentSec: number | null
}

type AbandonOptions = {
  timeSpentSec?: number
  timestamp?: string
}

export async function abandonSession(
  db: Database,
  session: AbandonableSession,
  opts: AbandonOptions = {},
) {
  const timestamp = opts.timestamp ?? now()

  const answers = await db.query.sessionAnswers.findMany({
    where: eq(sessionAnswers.sessionId, session.id),
  })

  const answered = answers.filter((a) => a.isCorrect !== null)
  const answeredQuestionIds = new Set(answered.map((a) => a.questionId))
  const unansweredIds = answers
    .filter((a) => a.isCorrect === null)
    .map((a) => a.id)

  if (unansweredIds.length > 0) {
    await db
      .delete(sessionAnswers)
      .where(inArray(sessionAnswers.id, unansweredIds))
  }

  const originalOrder: string[] = JSON.parse(session.questionOrder)
  const trimmedOrder = originalOrder.filter((qid) =>
    answeredQuestionIds.has(qid),
  )

  const correctCount = answered.filter((a) => a.isCorrect === true).length
  const scorePercent =
    answered.length > 0
      ? calculateScorePercent(correctCount, answered.length)
      : null

  const nextElapsed =
    opts.timeSpentSec !== undefined
      ? Math.max(session.timeSpentSec ?? 0, opts.timeSpentSec)
      : (session.timeSpentSec ?? 0)

  await db
    .update(examSessions)
    .set({
      status: 'abandoned',
      questionOrder: JSON.stringify(trimmedOrder),
      totalQuestions: answered.length,
      correctCount,
      scorePercent,
      completedAt: timestamp,
      timeSpentSec: nextElapsed,
    })
    .where(eq(examSessions.id, session.id))

  return {
    answeredCount: answered.length,
    correctCount,
    scorePercent,
  }
}

export async function abandonInProgressSessionsForWorkbook(
  db: Database,
  userId: string,
  workbookId: string,
  opts: AbandonOptions = {},
) {
  const inProgress = await db.query.examSessions.findMany({
    where: and(
      eq(examSessions.userId, userId),
      eq(examSessions.workbookId, workbookId),
      eq(examSessions.status, 'in_progress'),
    ),
    columns: {
      id: true,
      questionOrder: true,
      timeSpentSec: true,
    },
  })

  const timestamp = opts.timestamp ?? now()

  for (const s of inProgress) {
    await abandonSession(db, s, { ...opts, timestamp })
  }

  return inProgress.length
}
