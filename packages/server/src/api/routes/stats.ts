import { Hono } from 'hono'
import { eq, and, desc, gt, inArray, sql, type SQL } from 'drizzle-orm'
import type { Env } from '../../types'
import {
  examSessions,
  sessionAnswers,
  workbooks,
  subjects,
  questionTags,
  tags,
} from '../../db/schema'

const app = new Hono<Env>()

function buildSessionFilters(
  userId: string,
  opts: { subjectId?: string; workbookId?: string },
): SQL[] {
  const conditions: SQL[] = [
    eq(examSessions.userId, userId),
    inArray(examSessions.status, ['completed', 'abandoned']),
    gt(examSessions.totalQuestions, 0),
  ]
  if (opts.workbookId) {
    conditions.push(eq(examSessions.workbookId, opts.workbookId))
  }
  if (opts.subjectId) {
    conditions.push(eq(workbooks.subjectId, opts.subjectId))
  }
  return conditions
}

app.get('/overview', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const subjectId = c.req.query('subjectId')
  const workbookId = c.req.query('workbookId')

  const conditions = buildSessionFilters(userId, { subjectId, workbookId })

  let query = db
    .select({
      totalSessions: sql<number>`count(*)`,
      totalQuestions: sql<number>`coalesce(sum(${examSessions.totalQuestions}), 0)`,
      totalCorrect: sql<number>`coalesce(sum(${examSessions.correctCount}), 0)`,
      avgScore: sql<number>`coalesce(round(avg(${examSessions.scorePercent})), 0)`,
    })
    .from(examSessions)
    .$dynamic()

  if (subjectId) {
    query = query.innerJoin(
      workbooks,
      eq(examSessions.workbookId, workbooks.id),
    )
  }

  const result = await query.where(and(...conditions))

  return c.json({
    success: true,
    data: result[0],
  })
})

app.get('/subjects', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const subjectId = c.req.query('subjectId')
  const workbookId = c.req.query('workbookId')

  const conditions = buildSessionFilters(userId, { subjectId, workbookId })

  const results = await db
    .select({
      subjectId: subjects.id,
      subjectName: subjects.name,
      sessions: sql<number>`count(distinct ${examSessions.id})`,
      avgScore: sql<number>`avg(${examSessions.scorePercent})`,
      totalQuestions: sql<number>`sum(${examSessions.totalQuestions})`,
      totalCorrect: sql<number>`sum(${examSessions.correctCount})`,
    })
    .from(examSessions)
    .innerJoin(workbooks, eq(examSessions.workbookId, workbooks.id))
    .innerJoin(subjects, eq(workbooks.subjectId, subjects.id))
    .where(and(...conditions))
    .groupBy(subjects.id, subjects.name)

  return c.json({
    success: true,
    data: results.map((r) => ({
      ...r,
      avgScore: Math.round(r.avgScore ?? 0),
    })),
  })
})

app.get('/tags', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const subjectId = c.req.query('subjectId')
  const workbookId = c.req.query('workbookId')

  const conditions = buildSessionFilters(userId, { subjectId, workbookId })

  let query = db
    .select({
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
      totalAnswers: sql<number>`count(${sessionAnswers.id})`,
      correctAnswers: sql<number>`sum(case when ${sessionAnswers.isCorrect} = 1 then 1 else 0 end)`,
    })
    .from(sessionAnswers)
    .innerJoin(
      examSessions,
      eq(sessionAnswers.sessionId, examSessions.id),
    )
    .innerJoin(questionTags, eq(sessionAnswers.questionId, questionTags.questionId))
    .innerJoin(tags, eq(questionTags.tagId, tags.id))
    .$dynamic()

  if (subjectId) {
    query = query.innerJoin(
      workbooks,
      eq(examSessions.workbookId, workbooks.id),
    )
  }

  const results = await query
    .where(and(...conditions))
    .groupBy(tags.id, tags.name, tags.color)

  return c.json({
    success: true,
    data: results.map((r) => ({
      ...r,
      correctRate:
        r.totalAnswers > 0
          ? Math.round((r.correctAnswers / r.totalAnswers) * 100)
          : 0,
    })),
  })
})

app.get('/history', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const subjectId = c.req.query('subjectId')
  const workbookId = c.req.query('workbookId')
  const page = parseInt(c.req.query('page') ?? '1', 10)
  const limit = parseInt(c.req.query('limit') ?? '20', 10)
  const offset = (page - 1) * limit

  const conditions = buildSessionFilters(userId, { subjectId, workbookId })

  const rows = await db
    .select({
      id: examSessions.id,
      mode: examSessions.mode,
      status: examSessions.status,
      totalQuestions: examSessions.totalQuestions,
      correctCount: examSessions.correctCount,
      scorePercent: examSessions.scorePercent,
      startedAt: examSessions.startedAt,
      completedAt: examSessions.completedAt,
      timeSpentSec: examSessions.timeSpentSec,
      workbookTitle: workbooks.title,
      subjectName: subjects.name,
      total: sql<number>`count(*) over()`,
    })
    .from(examSessions)
    .innerJoin(workbooks, eq(examSessions.workbookId, workbooks.id))
    .innerJoin(subjects, eq(workbooks.subjectId, subjects.id))
    .where(and(...conditions))
    .orderBy(desc(examSessions.startedAt))
    .limit(limit)
    .offset(offset)

  const total = rows[0]?.total ?? 0
  const sessions = rows.map(({ total: _total, ...rest }) => rest)

  return c.json({
    success: true,
    data: sessions,
    meta: { total, page, limit },
  })
})

app.get('/weak-areas', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const subjectId = c.req.query('subjectId')
  const workbookId = c.req.query('workbookId')

  const conditions = buildSessionFilters(userId, { subjectId, workbookId })

  let query = db
    .select({
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
      totalAnswers: sql<number>`count(${sessionAnswers.id})`,
      correctAnswers: sql<number>`sum(case when ${sessionAnswers.isCorrect} = 1 then 1 else 0 end)`,
    })
    .from(sessionAnswers)
    .innerJoin(
      examSessions,
      eq(sessionAnswers.sessionId, examSessions.id),
    )
    .innerJoin(questionTags, eq(sessionAnswers.questionId, questionTags.questionId))
    .innerJoin(tags, eq(questionTags.tagId, tags.id))
    .$dynamic()

  if (subjectId) {
    query = query.innerJoin(
      workbooks,
      eq(examSessions.workbookId, workbooks.id),
    )
  }

  const results = await query
    .where(and(...conditions))
    .groupBy(tags.id, tags.name, tags.color)
    .having(sql`count(${sessionAnswers.id}) >= 3`)
    .orderBy(
      sql`cast(sum(case when ${sessionAnswers.isCorrect} = 1 then 1 else 0 end) as real) / count(${sessionAnswers.id})`,
    )
    .limit(10)

  return c.json({
    success: true,
    data: results.map((r) => ({
      ...r,
      correctRate:
        r.totalAnswers > 0
          ? Math.round((r.correctAnswers / r.totalAnswers) * 100)
          : 0,
    })),
  })
})

app.get('/workbook-scores', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')
  const subjectId = c.req.query('subjectId')
  const workbookId = c.req.query('workbookId')
  const limit = parseInt(c.req.query('limit') ?? '5', 10)

  const conditions = buildSessionFilters(userId, { subjectId, workbookId })

  let inner = db
    .select({
      workbookId: examSessions.workbookId,
      scorePercent: examSessions.scorePercent,
      completedAt: examSessions.completedAt,
      rn: sql<number>`row_number() over (partition by ${examSessions.workbookId} order by ${examSessions.completedAt} desc)`.as(
        'rn',
      ),
    })
    .from(examSessions)
    .$dynamic()

  if (subjectId) {
    inner = inner.innerJoin(
      workbooks,
      eq(examSessions.workbookId, workbooks.id),
    )
  }

  const ranked = inner.where(and(...conditions)).as('ranked')

  const sessions = await db
    .select({
      workbookId: ranked.workbookId,
      scorePercent: ranked.scorePercent,
      completedAt: ranked.completedAt,
    })
    .from(ranked)
    .where(sql`${ranked.rn} <= ${limit}`)
    .orderBy(ranked.workbookId, desc(ranked.completedAt))

  const grouped: Record<
    string,
    { scores: number[]; lastPlayedAt: string | null }
  > = {}

  for (const s of sessions) {
    if (!grouped[s.workbookId]) {
      grouped[s.workbookId] = { scores: [], lastPlayedAt: s.completedAt }
    }
    grouped[s.workbookId].scores.push(s.scorePercent ?? 0)
  }

  const data = Object.entries(grouped).map(([wbId, v]) => ({
    workbookId: wbId,
    recentScores: v.scores,
    recentAvg:
      v.scores.length > 0
        ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length)
        : null,
    attempts: v.scores.length,
    lastPlayedAt: v.lastPlayedAt,
  }))

  return c.json({ success: true, data })
})

export default app
