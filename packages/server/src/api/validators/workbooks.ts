import { z } from 'zod'

const choiceSchema = z.object({
  body: z.string().min(1),
  isCorrect: z.boolean().default(false),
  explanation: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

const questionSchema = z.object({
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

export const createWorkbookSchema = z.object({
  subjectId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).nullable().optional(),
  timeLimit: z.number().int().min(0).nullable().optional(),
  isPublished: z.boolean().default(true),
  tagIds: z.array(z.string()).optional(),
  questions: z.array(questionSchema).optional(),
})

export const updateWorkbookSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  timeLimit: z.number().int().min(0).nullable().optional(),
  isPublished: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
})
