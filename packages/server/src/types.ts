import type { Database } from './db'

export type Env = {
  Bindings: {
    DB: D1Database
    CLERK_SECRET_KEY: string
    CORS_ORIGIN?: string
  }
  Variables: {
    db: Database
    userId: string
  }
}
