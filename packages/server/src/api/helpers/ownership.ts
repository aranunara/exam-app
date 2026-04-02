import { eq, and } from 'drizzle-orm'
import {
  subjects,
  workbooks,
  tags,
  examSessions,
} from '../../db/schema'
import { AppError } from '../middleware/error-handler'
import type { Database } from '../../db'

export async function getSubjectForUser(
  db: Database,
  id: string,
  userId: string,
) {
  const row = await db.query.subjects.findFirst({
    where: and(eq(subjects.id, id), eq(subjects.userId, userId)),
  })
  if (!row) throw new AppError('Subject not found', 404)
  return row
}

export async function getWorkbookForUser(
  db: Database,
  id: string,
  userId: string,
) {
  const row = await db.query.workbooks.findFirst({
    where: and(eq(workbooks.id, id), eq(workbooks.userId, userId)),
  })
  if (!row) throw new AppError('Workbook not found', 404)
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
