import { z } from 'zod'

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  passScore: z.number().int().min(0).max(100).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateSubjectSchema = createSubjectSchema.partial()
