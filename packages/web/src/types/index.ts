export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: Array<{ path: string; message: string }>
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export interface Category {
  id: string
  userId: string
  name: string
  description: string | null
  passScore: number | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  userId: string
  name: string
  color: string | null
  createdAt: string
}

export interface Choice {
  id: string
  questionId: string
  body: string
  isCorrect: boolean
  explanation: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  questionSetId: string
  body: string
  explanation: string | null
  isMultiAnswer: boolean
  sortOrder: number
  version: number
  createdAt: string
  updatedAt: string
  choices: Choice[]
  tagIds: string[]
}

export interface QuestionSet {
  id: string
  userId: string
  categoryId: string
  title: string
  description: string | null
  timeLimit: number | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  questionCount?: number
  tagIds?: string[]
  questions?: Question[]
}

export interface ExamSession {
  id: string
  mode: 'practice' | 'exam'
  status: 'in_progress' | 'completed' | 'abandoned'
  totalQuestions: number
  correctCount: number | null
  scorePercent: number | null
  startedAt: string
  completedAt: string | null
  timeSpentSec: number | null
  questionSetTitle?: string
  categoryName?: string
}

export interface SessionQuestion {
  questionId: string
  index: number
  totalQuestions: number
  body: string
  isMultiAnswer: boolean
  choices: Array<{ id: string; body: string }>
  isAnswered: boolean
  selectedChoiceIds: string[]
}

export interface AnswerFeedback {
  isCorrect: boolean
  explanation: string | null
  choices: Array<{
    id: string
    isCorrect: boolean
    explanation: string | null
  }>
}

export type ConfidenceLevel = 0 | 1 | 2 | 3 | 4

export interface SessionResult {
  session: ExamSession
  results: Array<{
    index: number
    questionId: string
    body: string
    explanation: string | null
    isMultiAnswer: boolean
    isCorrect: boolean | null
    timeSpentSec: number | null
    confidenceLevel?: ConfidenceLevel
    selectedChoiceIds: string[]
    choices: Array<{
      id: string
      body: string
      isCorrect: boolean
      explanation: string | null
    }>
  }>
}

export interface FilterPreview {
  totalQuestions: number
  confidenceByQuestion: Record<string, number>
}

export interface StatsOverview {
  totalSessions: number
  totalQuestions: number
  totalCorrect: number
  avgScore: number
}

export interface CategoryStats {
  categoryId: string
  categoryName: string
  sessions: number
  avgScore: number
  totalQuestions: number
  totalCorrect: number
}

export interface TagStats {
  tagId: string
  tagName: string
  tagColor: string | null
  totalAnswers: number
  correctAnswers: number
  correctRate: number
}

export interface QuestionSetScore {
  questionSetId: string
  recentScores: number[]
  recentAvg: number | null
  attempts: number
  lastPlayedAt: string | null
}

export interface HistoryEntry extends ExamSession {
  questionSetTitle: string
  categoryName: string
}
