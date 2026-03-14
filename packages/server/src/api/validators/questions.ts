import { z } from 'zod'

const choiceSchema = z.object({
  body: z.string().min(1),
  isCorrect: z.boolean().default(false),
  explanation: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const createQuestionSchema = z.object({
  body: z.string().min(1),
  explanation: z.string().nullable().optional(),
  isMultiAnswer: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  tagIds: z.array(z.string()).optional(),
  choices: z
    .array(choiceSchema)
    .min(2, 'At least 2 choices required')
    .refine(
      (choices) => choices.some((c) => c.isCorrect),
      'At least one correct choice required',
    )
    .refine(
      (choices) => !choices.every((c) => c.isCorrect),
      'Not all choices can be correct',
    ),
})

export const updateQuestionSchema = z.object({
  body: z.string().min(1).optional(),
  explanation: z.string().nullable().optional(),
  isMultiAnswer: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  tagIds: z.array(z.string()).optional(),
  choices: z
    .array(choiceSchema)
    .min(2, 'At least 2 choices required')
    .refine(
      (choices) => choices.some((c) => c.isCorrect),
      'At least one correct choice required',
    )
    .refine(
      (choices) => !choices.every((c) => c.isCorrect),
      'Not all choices can be correct',
    )
    .optional(),
})

export const reorderQuestionsSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int().min(0),
    }),
  ),
})
