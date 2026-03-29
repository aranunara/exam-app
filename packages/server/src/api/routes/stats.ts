import { Hono } from 'hono'
import { eq, and, desc, sql } from 'drizzle-orm'
import type { Env } from '../../types'
import {
  examSessions,
  sessionAnswers,
  questionSets,
  categories,
  questionTags,
  tags,
} from '../../db/schema'

const app = new Hono<Env>()

app.get('/overview', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')

  const result = await db
    .select({
      totalSessions: sql<number>`count(*)`,
      totalQuestions: sql<number>`coalesce(sum(${examSessions.totalQuestions}), 0)`,
      totalCorrect: sql<number>`coalesce(sum(${examSessions.correctCount}), 0)`,
      avgScore: sql<number>`coalesce(round(avg(${examSessions.scorePercent})), 0)`,
    })
    .from(examSessions)
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.status, 'completed'),
      ),
    )

  return c.json({
    success: true,
    data: result[0],
  })
})

app.get('/categories', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')

  const results = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      sessions: sql<number>`count(distinct ${examSessions.id})`,
      avgScore: sql<number>`avg(${examSessions.scorePercent})`,
      totalQuestions: sql<number>`sum(${examSessions.totalQuestions})`,
      totalCorrect: sql<number>`sum(${examSessions.correctCount})`,
    })
    .from(examSessions)
    .innerJoin(questionSets, eq(examSessions.questionSetId, questionSets.id))
    .innerJoin(categories, eq(questionSets.categoryId, categories.id))
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.status, 'completed'),
      ),
    )
    .groupBy(categories.id, categories.name)

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

  const results = await db
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
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.status, 'completed'),
      ),
    )
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
  const page = parseInt(c.req.query('page') ?? '1', 10)
  const limit = parseInt(c.req.query('limit') ?? '20', 10)
  const offset = (page - 1) * limit

  const sessions = await db
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
      questionSetTitle: questionSets.title,
      categoryName: categories.name,
    })
    .from(examSessions)
    .innerJoin(questionSets, eq(examSessions.questionSetId, questionSets.id))
    .innerJoin(categories, eq(questionSets.categoryId, categories.id))
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.status, 'completed'),
      ),
    )
    .orderBy(desc(examSessions.startedAt))
    .limit(limit)
    .offset(offset)

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(examSessions)
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.status, 'completed'),
      ),
    )

  const total = countResult[0]?.count ?? 0

  return c.json({
    success: true,
    data: sessions,
    meta: { total, page, limit },
  })
})

app.get('/weak-areas', async (c) => {
  const db = c.get('db')
  const userId = c.get('userId')

  const results = await db
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
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.status, 'completed'),
      ),
    )
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

export default app
