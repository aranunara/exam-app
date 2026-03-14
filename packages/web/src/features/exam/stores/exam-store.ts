import { create } from 'zustand'

type ExamState = {
  sessionId: string | null
  mode: 'practice' | 'exam' | null
  currentIndex: number
  totalQuestions: number
  answers: Map<number, string[]>
  flags: Set<number>
  timeLimit: number | null
  startedAt: number | null
  elapsedSec: number
  questionTimes: Map<number, number>
  isCompleted: boolean
}

type ExamActions = {
  startSession: (params: {
    sessionId: string
    mode: 'practice' | 'exam'
    totalQuestions: number
    timeLimit: number | null
  }) => void
  setCurrentIndex: (index: number) => void
  setAnswer: (index: number, choiceIds: string[]) => void
  toggleFlag: (index: number) => void
  incrementElapsed: () => void
  recordQuestionTime: (index: number, seconds: number) => void
  complete: () => void
  reset: () => void
}

const initialState: ExamState = {
  sessionId: null,
  mode: null,
  currentIndex: 0,
  totalQuestions: 0,
  answers: new Map(),
  flags: new Set(),
  timeLimit: null,
  startedAt: null,
  elapsedSec: 0,
  questionTimes: new Map(),
  isCompleted: false,
}

export const useExamStore = create<ExamState & ExamActions>((set) => ({
  ...initialState,

  startSession: ({ sessionId, mode, totalQuestions, timeLimit }) =>
    set({
      ...initialState,
      sessionId,
      mode,
      totalQuestions,
      timeLimit,
      startedAt: Date.now(),
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setAnswer: (index, choiceIds) =>
    set((state) => {
      const answers = new Map(state.answers)
      answers.set(index, choiceIds)
      return { answers }
    }),

  toggleFlag: (index) =>
    set((state) => {
      const flags = new Set(state.flags)
      if (flags.has(index)) {
        flags.delete(index)
      } else {
        flags.add(index)
      }
      return { flags }
    }),

  incrementElapsed: () =>
    set((state) => ({ elapsedSec: state.elapsedSec + 1 })),

  recordQuestionTime: (index, seconds) =>
    set((state) => {
      const questionTimes = new Map(state.questionTimes)
      questionTimes.set(index, (questionTimes.get(index) ?? 0) + seconds)
      return { questionTimes }
    }),

  complete: () => set({ isCompleted: true }),

  reset: () => set(initialState),
}))
