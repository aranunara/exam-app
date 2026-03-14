import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { questions } from './questions'

export const questionConfidence = sqliteTable(
  'question_confidence',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    level: integer('level').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_question_confidence_user_question').on(
      table.userId,
      table.questionId,
    ),
    index('idx_question_confidence_user_id').on(table.userId),
  ],
)
