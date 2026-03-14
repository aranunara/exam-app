import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useExamStore } from '@/features/exam/stores/exam-store'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatCountdown, formatElapsed } from '@/lib/format'
import type { ApiResponse, SessionQuestion } from '@/types'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

type CreateSessionResponse = ApiResponse<{
  id: string
  questionSetId: string
  mode: 'practice' | 'exam'
  totalQuestions: number
  timeLimit: number | null
}>

type AnswerReceivedResponse = ApiResponse<{ received: true }>

export default function ExamPage() {
  const { questionSetId } = useParams<{ questionSetId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    sessionId,
    currentIndex,
    totalQuestions,
    answers,
    flags,
    timeLimit,
    elapsedSec,
    startSession,
    setCurrentIndex,
    setAnswer,
    toggleFlag,
    incrementElapsed,
    recordQuestionTime,
    complete,
    reset,
  } = useExamStore()

  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmComplete, setShowConfirmComplete] = useState(false)
  const questionStartTime = useRef<number>(Date.now())
  const hasAutoSubmitted = useRef(false)

  const createSessionMutation = useMutation({
    mutationFn: () =>
      api.post<CreateSessionResponse>('/sessions', {
        questionSetId,
        mode: 'exam',
      }),
    onSuccess: (response) => {
      if (response.data) {
        startSession({
          sessionId: response.data.id,
          mode: 'exam',
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
      if (state.sessionId && !state.isCompleted && state.answers.size > 0) {
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

  const remainingSeconds =
    timeLimit !== null ? Math.max(0, timeLimit - elapsedSec) : null

  const handleComplete = useCallback(async () => {
    if (!sessionId) return
    try {
      await api.post(`/sessions/${sessionId}/complete`, {
        timeSpentSec: elapsedSec,
      })
      complete()
      await queryClient.invalidateQueries({ queryKey: ['stats'] })
      navigate(`/exam/${questionSetId}/result`, {
        state: { sessionId },
      })
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to complete exam',
      )
    }
  }, [sessionId, questionSetId, navigate, complete, elapsedSec, queryClient])

  useEffect(() => {
    if (
      remainingSeconds !== null &&
      remainingSeconds <= 0 &&
      !hasAutoSubmitted.current &&
      sessionId
    ) {
      hasAutoSubmitted.current = true
      handleComplete()
    }
  }, [remainingSeconds, sessionId, handleComplete])

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
    if (question) {
      const stored = answers.get(currentIndex)
      setSelectedChoiceIds(stored ?? question.selectedChoiceIds ?? [])
      questionStartTime.current = Date.now()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.questionId, currentIndex])

  const handleChoiceToggle = useCallback(
    (choiceId: string) => {
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
    [question],
  )

  const handleSubmitAnswer = useCallback(async () => {
    if (!sessionId || !question || selectedChoiceIds.length === 0) return

    setIsSubmitting(true)
    try {
      const timeSpentSec = Math.round(
        (Date.now() - questionStartTime.current) / 1000,
      )
      recordQuestionTime(currentIndex, timeSpentSec)
      setAnswer(currentIndex, selectedChoiceIds)

      await api.post<AnswerReceivedResponse>(
        `/sessions/${sessionId}/answers`,
        {
          questionId: question.questionId,
          choiceIds: selectedChoiceIds,
          timeSpentSec,
        },
      )
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
    currentIndex,
    recordQuestionTime,
    setAnswer,
  ])

  const handleNavigate = useCallback(
    async (index: number) => {
      if (index < 0 || index >= totalQuestions) return

      if (selectedChoiceIds.length > 0 && !answers.has(currentIndex)) {
        await handleSubmitAnswer()
      }

      setCurrentIndex(index)
    },
    [totalQuestions, selectedChoiceIds, answers, currentIndex, handleSubmitAnswer, setCurrentIndex],
  )

  const handleToggleFlag = useCallback(async () => {
    if (!sessionId || !question) return
    toggleFlag(currentIndex)
    try {
      await api.post(`/sessions/${sessionId}/flag`, {
        questionId: question.questionId,
        isFlagged: !flags.has(currentIndex),
      })
    } catch (error) {
      toggleFlag(currentIndex)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to toggle flag',
      )
    }
  }, [sessionId, question, currentIndex, flags, toggleFlag])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
          if (selectedChoiceIds.length > 0 && !answers.has(currentIndex)) {
            handleSubmitAnswer()
          }
          break
        case 'n':
          if (currentIndex < totalQuestions - 1) {
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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    question,
    selectedChoiceIds,
    answers,
    currentIndex,
    totalQuestions,
    handleChoiceToggle,
    handleSubmitAnswer,
    handleNavigate,
    handleToggleFlag,
  ])

  if (createSessionMutation.isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LoadingSpinner label="試験セッションを開始しています\u2026" />
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
            試験の開始に失敗しました: {createSessionMutation.error.message}
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

  const isCurrentAnswered = answers.has(currentIndex)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">実戦モード</h1>
        <div className="flex items-center gap-4">
          {remainingSeconds !== null ? (
            <span
              className={`rounded-lg px-3 py-1 font-mono text-sm tabular-nums ${
                remainingSeconds <= 60
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 animate-pulse'
                  : remainingSeconds <= 300
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-muted'
              }`}
            >
              {formatCountdown(remainingSeconds)}
            </span>
          ) : (
            <span className="rounded-lg bg-muted px-3 py-1 font-mono text-sm tabular-nums">
              {formatElapsed(elapsedSec)}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            問題 {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
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
                className={`rounded px-3 py-2 text-sm ${
                  flags.has(currentIndex)
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {flags.has(currentIndex) ? 'フラグ付き' : 'フラグ'}
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

                let choiceStyle = 'border-border bg-card hover:bg-muted/50'
                if (isSelected) {
                  choiceStyle = 'border-primary bg-primary/5'
                }

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceToggle(choice.id)}
                    role={question.isMultiAnswer ? 'checkbox' : 'radio'}
                    aria-checked={isSelected}
                    className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${choiceStyle}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <MarkdownRenderer content={choice.body} />
                    </div>
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
                  </button>
                )
              })}
            </div>
          </div>

          {!isCurrentAnswered && (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedChoiceIds.length === 0 || isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : '回答を保存'}
            </button>
          )}

          {isCurrentAnswered && (
            <div className="rounded-lg border border-green-500 bg-green-50 p-3 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              回答を保存しました
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <button
              onClick={() => handleNavigate(currentIndex + 1)}
              disabled={currentIndex >= totalQuestions - 1}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-[4.5rem] rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">問題ナビゲーター</h3>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const isAnswered = answers.has(i)
                const isFlagged = flags.has(i)
                const isCurrent = i === currentIndex

                let btnStyle = 'bg-muted text-muted-foreground'
                if (isCurrent) {
                  btnStyle = 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                } else if (isAnswered) {
                  btnStyle = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }

                return (
                  <button
                    key={i}
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

            <div className="mt-4 border-t pt-3">
              <p className="text-xs text-muted-foreground">
                回答済み: {answers.size} / {totalQuestions}
              </p>
              {flags.size > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  フラグ付き: {flags.size}
                </p>
              )}
            </div>

            <div className="mt-4 border-t pt-4">
              {showConfirmComplete ? (
                <div className="space-y-2">
                  <p className="text-center text-sm text-muted-foreground">
                    提出しますか？
                  </p>
                  <button
                    onClick={handleComplete}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    はい、提出する
                  </button>
                  <button
                    onClick={() => setShowConfirmComplete(false)}
                    className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmComplete(true)}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  提出
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
