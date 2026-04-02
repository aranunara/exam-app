import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core'
import { workbooks } from './workbooks'
import { questions } from './questions'

export const examSessions = sqliteTable(
  'exam_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    workbookId: text('question_set_id')
      .notNull()
      .references(() => workbooks.id),
    mode: text('mode', { enum: ['practice', 'exam'] }).notNull(),
    status: text('status', {
      enum: ['in_progress', 'completed', 'abandoned'],
    }).notNull(),
    questionOrder: text('question_order').notNull(),
    totalQuestions: integer('total_questions').notNull(),
    correctCount: integer('correct_count'),
    scorePercent: integer('score_percent'),
    startedAt: text('started_at').notNull(),
    completedAt: text('completed_at'),
    timeSpentSec: integer('time_spent_sec'),
  },
  (table) => [
    index('idx_exam_sessions_user_id').on(table.userId),
    index('idx_exam_sessions_question_set_id').on(table.workbookId),
    index('idx_exam_sessions_status').on(table.status),
    index('idx_exam_sessions_user_status').on(table.userId, table.status),
  ],
)

export const sessionAnswers = sqliteTable(
  'session_answers',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => examSessions.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id),
    choiceOrder: text('choice_order').notNull(),
    isCorrect: integer('is_correct', { mode: 'boolean' }),
    isFlagged: integer('is_flagged', { mode: 'boolean' }).default(false),
    questionVersion: integer('question_version').notNull(),
    questionSnapshot: text('question_snapshot').notNull(),
    timeSpentSec: integer('time_spent_sec'),
    answeredAt: text('answered_at'),
  },
  (table) => [
    index('idx_session_answers_session_id').on(table.sessionId),
    index('idx_session_answers_question_id').on(table.questionId),
    index('idx_session_answers_session_question').on(
      table.sessionId,
      table.questionId,
    ),
  ],
)

export const sessionAnswerChoices = sqliteTable(
  'session_answer_choices',
  {
    sessionAnswerId: text('session_answer_id')
      .notNull()
      .references(() => sessionAnswers.id, { onDelete: 'cascade' }),
    choiceId: text('choice_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.sessionAnswerId, table.choiceId] }),
  ],
)
