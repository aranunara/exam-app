import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useExamStore,
  useSessionId,
  useCurrentIndex,
  useTotalQuestions,
  useAnswers,
  useTimeLimit,
  useElapsedSec,
  useExamActions,
} from '@/features/exam/stores/exam-store'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatCountdown, formatElapsed } from '@/lib/format'
import type { ApiResponse, SessionQuestion } from '@/types'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { MobileQuestionNav } from '@/components/shared/mobile-question-nav'

function ExamTimer() {
  const elapsedSec = useElapsedSec()
  const timeLimit = useTimeLimit()
  const remainingSeconds =
    timeLimit !== null ? Math.max(0, timeLimit - elapsedSec) : null

  if (remainingSeconds !== null) {
    return (
      <span
        className={`rounded-lg px-3 py-1 font-mono text-sm tabular-nums ${
          remainingSeconds <= 60
            ? 'bg-danger-muted text-danger-foreground motion-safe:animate-pulse'
            : remainingSeconds <= 300
              ? 'bg-warning-muted text-flag-foreground'
              : 'bg-muted'
        }`}
      >
        {formatCountdown(remainingSeconds)}
      </span>
    )
  }

  return (
    <span className="rounded-lg bg-muted px-3 py-1 font-mono text-sm tabular-nums">
      {formatElapsed(elapsedSec)}
    </span>
  )
}

type CreateSessionResponse = ApiResponse<{
  id: string
  workbookId: string
  mode: 'practice' | 'exam'
  totalQuestions: number
  timeLimit: number | null
}>

type AnswerReceivedResponse = ApiResponse<{ received: true }>

export default function ExamPage() {
  const { workbookId } = useParams<{ workbookId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const sessionId = useSessionId()
  const currentIndex = useCurrentIndex()
  const totalQuestions = useTotalQuestions()
  const answers = useAnswers()
  const timeLimit = useTimeLimit()
  const {
    startSession,
    setCurrentIndex,
    setAnswer,
    incrementElapsed,
    recordQuestionTime,
    complete,
    reset,
  } = useExamActions()

  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmComplete, setShowConfirmComplete] = useState(false)
  const questionStartTime = useRef<number>(Date.now())
  const hasAutoSubmitted = useRef(false)

  const location = useLocation()
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [showAbortConfirm, setShowAbortConfirm] = useState(false)
  const previewInfo = location.state as { title?: string; questionCount?: number; timeLimit?: number | null } | null

  const createSessionMutation = useMutation({
    mutationFn: () =>
      api.post<CreateSessionResponse>('/sessions', {
        workbookId,
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
    setIsConfirmed(false)
    reset()
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
  }, [workbookId])

  useEffect(() => {
    if (isConfirmed) {
      createSessionMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed])

  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(() => {
      incrementElapsed()
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionId, incrementElapsed])

  useEffect(() => {
    if (!sessionId) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sessionId])

  const handleComplete = useCallback(async () => {
    if (!sessionId) return
    try {
      const currentElapsed = useExamStore.getState().elapsedSec
      await api.post(`/sessions/${sessionId}/complete`, {
        timeSpentSec: currentElapsed,
      })
      complete()
      await queryClient.invalidateQueries({ queryKey: ['stats'] })
      navigate(`/exam/${workbookId}/result`, {
        state: { sessionId },
      })
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to complete exam',
      )
    }
  }, [sessionId, workbookId, navigate, complete, queryClient])

  const handleAbort = useCallback(async () => {
    if (sessionId) {
      try {
        const currentElapsed = useExamStore.getState().elapsedSec
        await api.post(`/sessions/${sessionId}/complete`, {
          timeSpentSec: currentElapsed,
        })
      } catch {}
    }
    complete()
    reset()
    navigate(-1)
  }, [sessionId, navigate, complete, reset])

  const elapsedSec = useElapsedSec()

  useEffect(() => {
    if (
      timeLimit !== null &&
      elapsedSec >= timeLimit &&
      !hasAutoSubmitted.current &&
      sessionId
    ) {
      hasAutoSubmitted.current = true
      handleComplete()
    }
  }, [timeLimit, elapsedSec, sessionId, handleComplete])

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

      if (selectedChoiceIds.length > 0 && !(currentIndex in answers)) {
        await handleSubmitAnswer()
      }

      setCurrentIndex(index)
    },
    [totalQuestions, selectedChoiceIds, answers, currentIndex, handleSubmitAnswer, setCurrentIndex],
  )

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
        if (selectedChoiceIds.length > 0 && !(currentIndex in answers)) {
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
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyHandlerRef.current(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!isConfirmed) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <div className="rounded-lg border bg-card p-8">
          <h1 className="text-center text-2xl font-bold">実戦モード</h1>
          {previewInfo?.title && (
            <p className="mt-2 text-center text-muted-foreground">{previewInfo.title}</p>
          )}
          {(previewInfo?.questionCount != null || previewInfo?.timeLimit != null) && (
            <div className="mt-6 flex justify-center gap-8 text-sm text-muted-foreground">
              {previewInfo.questionCount != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{previewInfo.questionCount}</p>
                  <p>問題数</p>
                </div>
              )}
              {previewInfo.timeLimit != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{Math.floor(previewInfo.timeLimit / 60)}</p>
                  <p>制限時間（分）</p>
                </div>
              )}
            </div>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            開始すると制限時間のカウントが始まります。
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="min-h-[44px] rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-muted"
            >
              戻る
            </button>
            <button
              onClick={() => setIsConfirmed(true)}
              className="min-h-[44px] rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              開始
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (createSessionMutation.isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LoadingSpinner label="試験セッションを開始しています…" />
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

  const isCurrentAnswered = currentIndex in answers

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-16 md:pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAbortConfirm(true)}
            className="min-h-[44px] rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            中止
          </button>
          <h1 className="text-xl font-bold">実戦モード</h1>
        </div>
        <div className="flex items-center gap-4">
          <ExamTimer />
          <span className="text-sm text-muted-foreground">
            問題 {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-400 ease-[var(--ease-spring)]"
            style={{ width: `${(Object.keys(answers).length / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {Object.keys(answers).length}/{totalQuestions}
        </span>
      </div>

      {showAbortConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">試験を中止しますか？</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              回答済みの内容は記録されます。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAbortConfirm(false)}
                className="min-h-[44px] rounded-lg border px-4 py-2 text-sm hover:bg-muted"
              >
                続ける
              </button>
              <button
                onClick={handleAbort}
                className="min-h-[44px] rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
              >
                中止する
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-3 space-y-6">
          <div key={currentIndex} className="rounded-lg border bg-card p-6 motion-safe:motion-preset-fade motion-safe:motion-duration-200">
            <div className="mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                問題 {currentIndex + 1}
                {question.isMultiAnswer && (
                  <span className="ml-2 rounded bg-info-muted px-2 py-0.5 text-xs text-info-foreground">
                    複数回答
                  </span>
                )}
              </span>
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
                    className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left motion-safe:transition-all motion-safe:duration-150 ${choiceStyle}`}
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
              className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : '回答を保存'}
            </button>
          )}

          {isCurrentAnswered && (
            <div className="rounded-lg border border-success/30 bg-success-muted p-3 text-center text-sm text-success-foreground">
              回答を保存しました
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="min-h-[44px] rounded-lg border px-4 py-2 text-sm hover:bg-muted active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            {currentIndex >= totalQuestions - 1 ? (
              <button
                onClick={() => setShowConfirmComplete(true)}
                className="min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97]"
              >
                提出
              </button>
            ) : (
              <button
                onClick={() => handleNavigate(currentIndex + 1)}
                className="min-h-[44px] rounded-lg border px-4 py-2 text-sm hover:bg-muted active:scale-[0.97]"
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
                const isCurrent = i === currentIndex

                let btnStyle = 'bg-muted text-muted-foreground'
                if (isCurrent) {
                  btnStyle = 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                } else if (isAnswered) {
                  btnStyle = 'bg-success-muted text-success-foreground'
                }

                return (
                  <button
                    key={`q-${i}`}
                    onClick={() => handleNavigate(i)}
                    className={`flex h-8 w-full items-center justify-center rounded text-xs font-medium ${btnStyle}`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-success-muted" />
                回答済み
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-primary" />
                現在
              </div>
            </div>

            <div className="mt-4 border-t pt-3">
              <p className="text-xs text-muted-foreground">
                回答済み: {Object.keys(answers).length} / {totalQuestions}
              </p>
            </div>

            <div className="mt-4 border-t pt-4">
              {showConfirmComplete ? (
                <div className="space-y-2">
                  {totalQuestions - Object.keys(answers).length > 0 && (
                    <p className="text-center text-sm text-warning-foreground">
                      未回答: {totalQuestions - Object.keys(answers).length}問
                    </p>
                  )}
                  <p className="text-center text-sm text-muted-foreground">
                    提出しますか？
                  </p>
                  <button
                    onClick={handleComplete}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97]"
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
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97]"
                >
                  提出
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <MobileQuestionNav
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
        answers={answers}
        onNavigate={handleNavigate}
        onComplete={handleComplete}
      />
    </div>
  )
}
