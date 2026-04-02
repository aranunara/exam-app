import { z } from 'zod'

export const createSessionSchema = z.object({
  questionSetId: z.string().min(1),
  mode: z.enum(['practice', 'exam']),
  filters: z
    .object({
      confidenceLevels: z.array(z.number().int().min(1).max(4)).optional(),
    })
    .optional(),
})

export const previewFilterSchema = z.object({
  questionSetId: z.string().min(1),
})

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  choiceIds: z.array(z.string()).min(1),
  timeSpentSec: z.number().int().min(0).optional(),
})

export const completeSessionSchema = z.object({
  timeSpentSec: z.number().int().min(0).optional(),
})

