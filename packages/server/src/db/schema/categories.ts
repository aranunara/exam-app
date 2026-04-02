import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    passScore: integer('pass_score'),
    sortOrder: integer('sort_order').default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_categories_user_id').on(table.userId)],
)
