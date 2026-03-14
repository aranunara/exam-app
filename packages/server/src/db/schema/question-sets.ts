import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { categories } from './categories'
import { tags } from './tags'

export const questionSets = sqliteTable('question_sets', {
  id: text('id').primaryKey(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  title: text('title').notNull(),
  description: text('description'),
  timeLimit: integer('time_limit'),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const questionSetTags = sqliteTable(
  'question_set_tags',
  {
    questionSetId: text('question_set_id')
      .notNull()
      .references(() => questionSets.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.questionSetId, table.tagId] })],
)
