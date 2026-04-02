import {
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    color: text('color'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_tags_user_name').on(table.userId, table.name),
    index('idx_tags_user_id').on(table.userId),
  ],
)
