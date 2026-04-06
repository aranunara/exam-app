import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from 'drizzle-orm/sqlite-core'
import { subjects } from './subjects'
import { tags } from './tags'

export const workbooks = sqliteTable(
  'question_sets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    subjectId: text('category_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    timeLimit: integer('time_limit'),
    isPublished: integer('is_published', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_question_sets_user_id').on(table.userId)],
)

export const workbookTags = sqliteTable(
  'question_set_tags',
  {
    workbookId: text('question_set_id')
      .notNull()
      .references(() => workbooks.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.workbookId, table.tagId] })],
)
