import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { ApiResponse, SessionResult, ConfidenceLevel } from '@/types'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { ConfidenceSelector } from '@/components/shared/confidence-selector'

function ScoreSummary({
  result,
  passScore,
}: {
  result: SessionResult
  passScore?: number | null
}) {
  const { session } = result
  const scorePercent = session.scorePercent ?? 0
  const isPassed = passScore != null ? scorePercent >= passScore : null

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">スコアサマリー</h2>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
        <div className="text-center">
          <div
            className={`text-5xl font-bold tabular-nums ${
              isPassed === true
                ? 'text-green-600 dark:text-green-400'
                : isPassed === false
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-foreground'
            }`}
          >
            {scorePercent}%
          </div>
          <p className="mt-1 text-sm text-muted-foreground">スコア</p>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold">
            {session.correctCount ?? 0}{' '}
            <span className="text-lg text-muted-foreground">
              / {session.totalQuestions}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">正解数</p>
        </div>

        {session.timeSpentSec != null && (
          <div className="text-center">
            <div className="text-3xl font-bold">
              {Math.floor(session.timeSpentSec / 60)}
              <span className="text-lg text-muted-foreground">m</span>{' '}
              {session.timeSpentSec % 60}
              <span className="text-lg text-muted-foreground">s</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">所要時間</p>
          </div>
        )}

        {isPassed !== null && (
          <div className="text-center">
            <div
              className={`inline-block rounded-full px-4 py-2 text-lg font-bold ${
                isPassed
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}
            >
              {isPassed ? '合格' : '不合格'}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              合格基準: {passScore}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function QuestionReview({
  result,
  index,
}: {
  result: SessionResult['results'][number]
  index: number
}) {
  const isCorrect = result.isCorrect === true
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>(
    (result.confidenceLevel ?? 0) as ConfidenceLevel,
  )

  return (
    <div
      className={`rounded-lg border p-6 ${
        isCorrect
          ? 'border-green-200 dark:border-green-800'
          : 'border-red-200 dark:border-red-800'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              isCorrect
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}
          >
            {index + 1}
          </span>
          <span
            className={`text-sm font-medium ${
              isCorrect
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}
          >
            {isCorrect ? '正解' : '不正解'}
          </span>
          {result.isFlagged && (
            <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              フラグ付き
            </span>
          )}
        </div>
        {result.timeSpentSec != null && (
          <span className="text-xs text-muted-foreground">
            {result.timeSpentSec}s
          </span>
        )}
      </div>

      <div className="mb-4">
        <MarkdownRenderer content={result.body} />
      </div>

      <div className="space-y-2">
        {result.choices.map((choice) => {
          const wasSelected = result.selectedChoiceIds.includes(choice.id)

          let choiceStyle = 'border-border bg-card'
          if (choice.isCorrect && wasSelected) {
            choiceStyle =
              'border-green-500 bg-green-50 dark:bg-green-950'
          } else if (choice.isCorrect && !wasSelected) {
            choiceStyle =
              'border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/50'
          } else if (!choice.isCorrect && wasSelected) {
            choiceStyle = 'border-red-500 bg-red-50 dark:bg-red-950'
          }

          return (
            <div key={choice.id}>
              <div
                className={`flex items-start gap-3 rounded-lg border p-3 ${choiceStyle}`}
              >
                <div className="flex shrink-0 items-center gap-2">
                  {choice.isCorrect && (
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-green-600 dark:text-green-400"
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
                  )}
                  {!choice.isCorrect && wasSelected && (
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-red-600 dark:text-red-400"
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
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <MarkdownRenderer content={choice.body} />
                </div>
                {wasSelected && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    あなたの回答
                  </span>
                )}
              </div>
              {choice.explanation && (
                <div className="ml-6 mt-1 border-l-2 border-muted pl-3 text-sm text-muted-foreground">
                  <MarkdownRenderer content={choice.explanation} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {result.explanation && (
        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            解説
          </p>
          <div className="text-sm">
            <MarkdownRenderer content={result.explanation} />
          </div>
        </div>
      )}

      <div className="mt-4 border-t pt-3">
        <ConfidenceSelector
          questionId={result.questionId}
          currentLevel={confidenceLevel}
          onLevelChange={setConfidenceLevel}
        />
      </div>
    </div>
  )
}

export default function ExamResultPage() {
  const { questionSetId } = useParams<{ questionSetId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  const sessionId = (location.state as { sessionId?: string } | null)
    ?.sessionId

  const resultQuery = useQuery({
    queryKey: queryKeys.sessions.results(sessionId ?? ''),
    queryFn: () =>
      api.get<ApiResponse<SessionResult>>(
        `/sessions/${sessionId}/results`,
      ),
    enabled: !!sessionId,
  })

  if (!sessionId) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          セッションが見つかりません。先に試験を完了してください。
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          ダッシュボードへ
        </button>
      </div>
    )
  }

  if (resultQuery.isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LoadingSpinner label="結果を読み込み中\u2026" />
          </div>
        </div>
      </div>
    )
  }

  if (resultQuery.isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-destructive">
            結果の読み込みに失敗しました: {resultQuery.error.message}
          </p>
          <button
            onClick={() => resultQuery.refetch()}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  const result = resultQuery.data?.data

  if (!result) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">結果がありません。</p>
      </div>
    )
  }

  const correctCount = result.results.filter((r) => r.isCorrect === true).length
  const incorrectCount = result.results.filter(
    (r) => r.isCorrect === false,
  ).length

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">試験結果</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/exam/${questionSetId}`)}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            再受験
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            ダッシュボード
          </button>
        </div>
      </div>

      <ScoreSummary result={result} />

      <div className="flex gap-4 text-sm">
        <span className="rounded-full bg-green-100 px-3 py-1 text-green-700 dark:bg-green-900 dark:text-green-300">
          正解: {correctCount}
        </span>
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700 dark:bg-red-900 dark:text-red-300">
          不正解: {incorrectCount}
        </span>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">問題の振り返り</h2>
        {result.results.map((questionResult, idx) => (
          <QuestionReview
            key={questionResult.questionId}
            result={questionResult}
            index={idx}
          />
        ))}
      </div>
    </div>
  )
}
