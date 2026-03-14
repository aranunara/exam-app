import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod'
import type { Env } from '../../types'

export const errorHandler: ErrorHandler<Env> = (err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: 'Validation failed',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      400,
    )
  }

  if (err instanceof AppError) {
    return c.json(
      { success: false, error: err.message },
      err.status as ContentfulStatusCode,
    )
  }

  return c.json({ success: false, error: 'Internal server error' }, 500)
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
