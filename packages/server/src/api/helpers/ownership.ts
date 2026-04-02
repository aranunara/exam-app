import { eq, and } from 'drizzle-orm'
import {
  categories,
  questionSets,
  tags,
  examSessions,
} from '../../db/schema'
import { AppError } from '../middleware/error-handler'
import type { Database } from '../../db'

export async function getCategoryForUser(
  db: Database,
  id: string,
  userId: string,
) {
  const row = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.userId, userId)),
  })
  if (!row) throw new AppError('Category not found', 404)
  return row
}

export async function getQuestionSetForUser(
  db: Database,
  id: string,
  userId: string,
) {
  const row = await db.query.questionSets.findFirst({
    where: and(eq(questionSets.id, id), eq(questionSets.userId, userId)),
  })
  if (!row) throw new AppError('Question set not found', 404)
  return row
}

export async function getTagForUser(
  db: Database,
  id: string,
  userId: string,
) {
  const row = await db.query.tags.findFirst({
    where: and(eq(tags.id, id), eq(tags.userId, userId)),
  })
  if (!row) throw new AppError('Tag not found', 404)
  return row
}

export async function getSessionForUser(
  db: Database,
  id: string,
  userId: string,
) {
  const row = await db.query.examSessions.findFirst({
    where: and(eq(examSessions.id, id), eq(examSessions.userId, userId)),
  })
  if (!row) throw new AppError('Session not found', 404)
  return row
}
