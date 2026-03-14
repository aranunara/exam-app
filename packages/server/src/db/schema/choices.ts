import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { questions } from './questions'

export const choices = sqliteTable(
  'choices',
  {
    id: text('id').primaryKey(),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    isCorrect: integer('is_correct', { mode: 'boolean' }).default(false),
    explanation: text('explanation'),
    sortOrder: integer('sort_order').default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_choices_question_id').on(table.questionId)],
)
