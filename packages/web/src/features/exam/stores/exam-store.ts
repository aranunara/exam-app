import { create } from 'zustand'
import { useShallow } from 'zustand/shallow'

type ExamState = {
  sessionId: string | null
  mode: 'practice' | 'exam' | null
  currentIndex: number
  totalQuestions: number
  answers: Record<number, string[]>
  answersStatus: Record<number, boolean>
  timeLimit: number | null
  startedAt: number | null
  elapsedSec: number
  questionTimes: Record<number, number>
  isCompleted: boolean
}

type ExamActions = {
  startSession: (params: {
    sessionId: string
    mode: 'practice' | 'exam'
    totalQuestions: number
    timeLimit: number | null
    initialIndex?: number
    initialElapsedSec?: number
    initialAnswersStatus?: Record<number, boolean>
  }) => void
  setCurrentIndex: (index: number) => void
  setAnswer: (index: number, choiceIds: string[]) => void
  setAnswerStatus: (index: number, isCorrect: boolean) => void
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
  answers: {},
  answersStatus: {},
  timeLimit: null,
  startedAt: null,
  elapsedSec: 0,
  questionTimes: {},
  isCompleted: false,
}

export const useExamStore = create<ExamState & ExamActions>((set) => ({
  ...initialState,

  startSession: ({
    sessionId,
    mode,
    totalQuestions,
    timeLimit,
    initialIndex,
    initialElapsedSec,
    initialAnswersStatus,
  }) =>
    set({
      ...initialState,
      sessionId,
      mode,
      totalQuestions,
      timeLimit,
      startedAt: Date.now(),
      currentIndex: initialIndex ?? 0,
      elapsedSec: initialElapsedSec ?? 0,
      answersStatus: initialAnswersStatus ?? {},
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setAnswer: (index, choiceIds) =>
    set((state) => ({
      answers: { ...state.answers, [index]: choiceIds },
    })),

  setAnswerStatus: (index, isCorrect) =>
    set((state) => ({
      answersStatus: { ...state.answersStatus, [index]: isCorrect },
    })),

  incrementElapsed: () =>
    set((state) => ({ elapsedSec: state.elapsedSec + 1 })),

  recordQuestionTime: (index, seconds) =>
    set((state) => ({
      questionTimes: {
        ...state.questionTimes,
        [index]: (state.questionTimes[index] ?? 0) + seconds,
      },
    })),

  complete: () => set({ isCompleted: true }),

  reset: () => set(initialState),
}))

// Selector hooks for granular subscriptions
export const useSessionId = () => useExamStore((s) => s.sessionId)
export const useExamMode = () => useExamStore((s) => s.mode)
export const useCurrentIndex = () => useExamStore((s) => s.currentIndex)
export const useTotalQuestions = () => useExamStore((s) => s.totalQuestions)
export const useElapsedSec = () => useExamStore((s) => s.elapsedSec)
export const useTimeLimit = () => useExamStore((s) => s.timeLimit)
export const useIsCompleted = () => useExamStore((s) => s.isCompleted)
export const useAnswers = () => useExamStore((s) => s.answers)
export const useAnswersStatus = () => useExamStore((s) => s.answersStatus)
export const useExamActions = () =>
  useExamStore(
    useShallow((s) => ({
      startSession: s.startSession,
      setCurrentIndex: s.setCurrentIndex,
      setAnswer: s.setAnswer,
      setAnswerStatus: s.setAnswerStatus,
      incrementElapsed: s.incrementElapsed,
      recordQuestionTime: s.recordQuestionTime,
      complete: s.complete,
      reset: s.reset,
    })),
  )
