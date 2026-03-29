import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useExamStore,
  useSessionId,
  useCurrentIndex,
  useTotalQuestions,
  useAnswers,
  useFlags,
  useElapsedSec,
  useExamActions,
} from '@/features/exam/stores/exam-store'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatElapsed } from '@/lib/format'
import type { ApiResponse, SessionQuestion, AnswerFeedback, ConfidenceLevel } from '@/types'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { ConfidenceSelector } from '@/components/shared/confidence-selector'
import { MobileQuestionNav } from '@/components/shared/mobile-question-nav'

function PracticeTimer() {
  const elapsedSec = useElapsedSec()
  return (
    <span className="rounded-lg bg-muted px-3 py-1 font-mono text-sm tabular-nums">
      {formatElapsed(elapsedSec)}
    </span>
  )
}

type CreateSessionResponse = ApiResponse<{
  id: string
  questionSetId: string
  mode: 'practice' | 'exam'
  totalQuestions: number
  timeLimit: number | null
}>

export default function PracticePage() {
  const { questionSetId } = useParams<{ questionSetId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const sessionId = useSessionId()
  const currentIndex = useCurrentIndex()
  const totalQuestions = useTotalQuestions()
  const answers = useAnswers()
  const flags = useFlags()
  const {
    startSession,
    setCurrentIndex,
    setAnswer,
    toggleFlag,
    incrementElapsed,
    recordQuestionTime,
    complete,
    reset,
  } = useExamActions()

  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([])
  const [answerState, setAnswerState] = useState<{
    feedback: AnswerFeedback | null
    confidenceLevel: ConfidenceLevel
  }>({ feedback: null, confidenceLevel: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { feedback, confidenceLevel } = answerState
  const questionStartTime = useRef<number>(Date.now())

  const createSessionMutation = useMutation({
    mutationFn: () =>
      api.post<CreateSessionResponse>('/sessions', {
        questionSetId,
        mode: 'practice',
      }),
    onSuccess: (response) => {
      if (response.data) {
        startSession({
          sessionId: response.data.id,
          mode: 'practice',
          totalQuestions: response.data.totalQuestions,
          timeLimit: response.data.timeLimit,
        })
      }
    },
  })

  useEffect(() => {
    reset()
    createSessionMutation.mutate()
    return () => {
      const state = useExamStore.getState()
      if (state.sessionId && !state.isCompleted && Object.keys(state.answers).length > 0) {
        api.post(`/sessions/${state.sessionId}/complete`, {
          timeSpentSec: state.elapsedSec,
        }).catch(() => {})
      }
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSetId])

  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(() => {
      incrementElapsed()
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionId, incrementElapsed])

  const questionQuery = useQuery({
    queryKey: queryKeys.sessions.question(sessionId ?? '', currentIndex),
    queryFn: () =>
      api.get<ApiResponse<SessionQuestion>>(
        `/sessions/${sessionId}/questions/${currentIndex}`,
      ),
    enabled: !!sessionId,
  })

  const question = questionQuery.data?.data ?? null

  useEffect(() => {
    if (!sessionId || !question) return
    const prefetch = (idx: number) => {
      if (idx >= 0 && idx < totalQuestions) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.sessions.question(sessionId, idx),
          queryFn: () =>
            api.get<ApiResponse<SessionQuestion>>(
              `/sessions/${sessionId}/questions/${idx}`,
            ),
        })
      }
    }
    prefetch(currentIndex + 1)
    if (currentIndex > 0) prefetch(currentIndex - 1)
  }, [sessionId, currentIndex, question, totalQuestions, queryClient])

  useEffect(() => {
    if (question) {
      const stored = answers[currentIndex]
      setSelectedChoiceIds(stored ?? question.selectedChoiceIds ?? [])
      setAnswerState({ feedback: null, confidenceLevel: 0 })
      questionStartTime.current = Date.now()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.questionId, currentIndex])

  const handleChoiceToggle = useCallback(
    (choiceId: string) => {
      if (feedback) return
      if (!question) return

      if (question.isMultiAnswer) {
        setSelectedChoiceIds((prev) =>
          prev.includes(choiceId)
            ? prev.filter((id) => id !== choiceId)
            : [...prev, choiceId],
        )
      } else {
        setSelectedChoiceIds([choiceId])
      }
    },
    [feedback, question],
  )

  const handleSubmitAnswer = useCallback(async () => {
    if (!sessionId || !question || selectedChoiceIds.length === 0) return
    if (feedback) return

    setIsSubmitting(true)
    try {
      const timeSpentSec = Math.round(
        (Date.now() - questionStartTime.current) / 1000,
      )
      recordQuestionTime(currentIndex, timeSpentSec)
      setAnswer(currentIndex, selectedChoiceIds)

      const response = await api.post<ApiResponse<AnswerFeedback>>(
        `/sessions/${sessionId}/answers`,
        {
          questionId: question.questionId,
          choiceIds: selectedChoiceIds,
          timeSpentSec,
        },
      )

      if (response.data) {
        setAnswerState({
          feedback: response.data,
          confidenceLevel: response.data.isCorrect ? 0 : 1,
        })
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to submit answer',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    sessionId,
    question,
    selectedChoiceIds,
    feedback,
    currentIndex,
    recordQuestionTime,
    setAnswer,
  ])

  const handleNavigate = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalQuestions) return
      setAnswerState({ feedback: null, confidenceLevel: 0 })
      setCurrentIndex(index)
    },
    [totalQuestions, setCurrentIndex],
  )

  const handleToggleFlag = useCallback(async () => {
    if (!sessionId || !question) return
    toggleFlag(currentIndex)
    try {
      await api.post(`/sessions/${sessionId}/flag`, {
        questionId: question.questionId,
        isFlagged: !flags[currentIndex],
      })
    } catch (error) {
      toggleFlag(currentIndex)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to toggle flag',
      )
    }
  }, [sessionId, question, currentIndex, flags, toggleFlag])

  const handleComplete = useCallback(async () => {
    if (!sessionId) return
    try {
      const currentElapsed = useExamStore.getState().elapsedSec
      await api.post(`/sessions/${sessionId}/complete`, {
        timeSpentSec: currentElapsed,
      })
      complete()
      await queryClient.invalidateQueries({ queryKey: ['stats'] })
      navigate(`/exam/${questionSetId}/result`, {
        state: { sessionId },
      })
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to complete session',
      )
    }
  }, [sessionId, questionSetId, navigate, complete, queryClient])

  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {})
  keyHandlerRef.current = (e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return
    }

    const key = e.key.toLowerCase()

    if (key >= '1' && key <= '9' && question) {
      const choiceIndex = parseInt(key, 10) - 1
      if (choiceIndex < question.choices.length) {
        handleChoiceToggle(question.choices[choiceIndex].id)
      }
      return
    }

    switch (key) {
      case 'enter':
        e.preventDefault()
        if (!feedback && selectedChoiceIds.length > 0) {
          handleSubmitAnswer()
        } else if (feedback) {
          if (currentIndex >= totalQuestions - 1) {
            handleComplete()
          } else {
            handleNavigate(currentIndex + 1)
          }
        }
        break
      case 'n':
        if (feedback && currentIndex < totalQuestions - 1) {
          handleNavigate(currentIndex + 1)
        }
        break
      case 'p':
        if (currentIndex > 0) {
          handleNavigate(currentIndex - 1)
        }
        break
      case 'f':
        handleToggleFlag()
        break
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyHandlerRef.current(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (createSessionMutation.isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LoadingSpinner label="演習セッションを開始しています\u2026" />
          </div>
        </div>
      </div>
    )
  }

  if (createSessionMutation.isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-destructive">
            セッションの開始に失敗しました: {createSessionMutation.error.message}
          </p>
          <button
            onClick={() => createSessionMutation.mutate()}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  if (!sessionId || !question) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-16 md:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">演習モード</h1>
        <div className="flex items-center gap-4">
          <PracticeTimer />
          <span className="text-sm text-muted-foreground">
            問題 {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-3 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                問題 {currentIndex + 1}
                {question.isMultiAnswer && (
                  <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    複数回答
                  </span>
                )}
              </span>
              <button
                onClick={handleToggleFlag}
                className={`min-h-[44px] rounded px-3 py-2 text-sm ${
                  !!flags[currentIndex]
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {!!flags[currentIndex] ? 'フラグ付き' : 'フラグ'}
              </button>
            </div>

            <div className="mb-6">
              <MarkdownRenderer content={question.body} />
            </div>

            <div
              className="space-y-3"
              role={question.isMultiAnswer ? 'group' : 'radiogroup'}
              aria-label="選択肢"
            >
              {question.choices.map((choice, idx) => {
                const isSelected = selectedChoiceIds.includes(choice.id)
                const feedbackChoice = feedback?.choices.find(
                  (fc) => fc.id === choice.id,
                )

                let choiceStyle = 'border-border bg-card hover:bg-muted/50'
                if (feedback && feedbackChoice) {
                  if (feedbackChoice.isCorrect) {
                    choiceStyle =
                      'border-green-500 bg-green-50 dark:bg-green-950'
                  } else if (isSelected && !feedbackChoice.isCorrect) {
                    choiceStyle = 'border-red-500 bg-red-50 dark:bg-red-950'
                  }
                } else if (isSelected) {
                  choiceStyle = 'border-primary bg-primary/5'
                }

                return (
                  <div key={choice.id}>
                    <button
                      onClick={() => handleChoiceToggle(choice.id)}
                      disabled={!!feedback}
                      role={question.isMultiAnswer ? 'checkbox' : 'radio'}
                      aria-checked={isSelected}
                      className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${choiceStyle} disabled:cursor-default`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <MarkdownRenderer content={choice.body} />
                      </div>
                      {feedback && feedbackChoice && (
                        <div className="shrink-0">
                          {feedbackChoice.isCorrect ? (
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5 text-green-600 dark:text-green-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : isSelected ? (
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5 text-red-600 dark:text-red-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          ) : null}
                        </div>
                      )}
                      {!feedback && (
                      <div className="shrink-0">
                        {question.isMultiAnswer ? (
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                aria-hidden="true"
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-border'
                            }`}
                          >
                            {isSelected && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      )}
                    </button>
                    {feedback && feedbackChoice?.explanation && (
                      <div className="ml-9 mt-1 rounded border-l-2 border-muted pl-3 text-sm text-muted-foreground">
                        <MarkdownRenderer content={feedbackChoice.explanation} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-lg border p-4 ${
                feedback.isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : 'border-red-500 bg-red-50 dark:bg-red-950'
              }`}
            >
              <p
                className={`mb-2 flex items-center gap-2 font-semibold ${
                  feedback.isCorrect
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {feedback.isCorrect ? (
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {feedback.isCorrect ? '正解！' : '不正解'}
              </p>
              {feedback.explanation && (
                <div className="text-sm">
                  <MarkdownRenderer content={feedback.explanation} />
                </div>
              )}
              <div className="mt-3 border-t border-current/10 pt-3">
                <ConfidenceSelector
                  questionId={question.questionId}
                  currentLevel={confidenceLevel}
                  onLevelChange={(level) =>
                    setAnswerState((prev) => ({ ...prev, confidenceLevel: level }))
                  }
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-6">
            <button
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="min-h-[44px] rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            {!feedback ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedChoiceIds.length === 0 || isSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '送信中...' : '答え合わせ'}
              </button>
            ) : currentIndex >= totalQuestions - 1 ? (
              <button
                onClick={handleComplete}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                結果を見る
              </button>
            ) : (
              <button
                onClick={() => handleNavigate(currentIndex + 1)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                次へ
              </button>
            )}
          </div>
        </div>

        <div className="hidden md:col-span-1 md:block">
          <div className="sticky top-[4.5rem] rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">問題ナビゲーター</h3>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const isAnswered = i in answers
                const isFlagged = !!flags[i]
                const isCurrent = i === currentIndex

                let btnStyle = 'bg-muted text-muted-foreground'
                if (isCurrent) {
                  btnStyle = 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                } else if (isAnswered) {
                  btnStyle = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }

                return (
                  <button
                    key={`q-${i}`}
                    onClick={() => handleNavigate(i)}
                    className={`relative flex h-8 w-full items-center justify-center rounded text-xs font-medium ${btnStyle}`}
                  >
                    {i + 1}
                    {isFlagged && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-yellow-500" />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-green-100 dark:bg-green-900" />
                回答済み
              </div>
              <div className="flex items-center gap-2">
                <span className="relative inline-block h-3 w-3 rounded bg-muted">
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-yellow-500" />
                </span>
                フラグ付き
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-primary" />
                現在
              </div>
            </div>

          </div>
        </div>
      </div>

      <MobileQuestionNav
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        answers={answers}
        flags={flags}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
