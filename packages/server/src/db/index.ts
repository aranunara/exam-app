import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'

export type Database = DrizzleD1Database<typeof schema>

const dbCache = new WeakMap<D1Database, Database>()

export function createDb(d1: D1Database): Database {
  let db = dbCache.get(d1)
  if (!db) {
    db = drizzle(d1, { schema })
    dbCache.set(d1, db)
  }
  return db
}
