import { z } from 'zod'

export const upsertConfidenceSchema = z.object({
  questionId: z.string().min(1),
  level: z.number().int().min(0).max(4),
})

export const batchGetConfidenceSchema = z.object({
  questionIds: z.array(z.string().min(1)).min(1),
})
