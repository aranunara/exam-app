import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { questionSets } from './question-sets'
import { tags } from './tags'

export const questions = sqliteTable(
  'questions',
  {
    id: text('id').primaryKey(),
    questionSetId: text('question_set_id')
      .notNull()
      .references(() => questionSets.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    explanation: text('explanation'),
    isMultiAnswer: integer('is_multi_answer', { mode: 'boolean' }).default(false),
    sortOrder: integer('sort_order').default(0),
    version: integer('version').default(1),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_questions_question_set_id').on(table.questionSetId)],
)

export const questionTags = sqliteTable(
  'question_tags',
  {
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.questionId, table.tagId] })],
)
