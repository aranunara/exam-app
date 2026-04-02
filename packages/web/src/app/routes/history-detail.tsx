import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatScore, formatDate, formatDuration } from '@/lib/format'
import { ErrorMessage } from '@/components/shared/error-message'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { ConfidenceSelector } from '@/components/shared/confidence-selector'
import type { ApiResponse, SessionResult, ConfidenceLevel } from '@/types'

function SessionSummary({
  result,
}: {
  result: SessionResult
}) {
  const { session } = result
  const correctCount = result.results.filter((r) => r.isCorrect).length

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">モード</p>
        <p className="mt-1 text-lg font-semibold">
          {session.mode === 'exam' ? '実戦' : '演習'}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">スコア</p>
        <p className="mt-1 text-lg font-semibold">
          {session.scorePercent !== null
            ? formatScore(session.scorePercent)
            : '-'}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({correctCount}/{result.results.length})
          </span>
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">所要時間</p>
        <p className="mt-1 text-lg font-semibold">
          {session.timeSpentSec !== null
            ? formatDuration(session.timeSpentSec)
            : '-'}
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">日付</p>
        <p className="mt-1 text-lg font-semibold">
          {formatDate(session.startedAt)}
        </p>
      </div>
    </div>
  )
}

function QuestionReview({
  item,
  index,
}: {
  item: SessionResult['results'][number]
  index: number
}) {
  const isCorrect = item.isCorrect === true
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>(
    (item.confidenceLevel ?? 0) as ConfidenceLevel,
  )

  return (
    <div
      className={`rounded-lg border p-6 ${
        isCorrect
          ? 'border-success/30'
          : 'border-danger/30'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            問題 {index + 1}
          </span>
          {item.isMultiAnswer && (
            <span className="rounded-full bg-info-muted px-2 py-0.5 text-xs font-medium text-info-foreground">
              複数回答
            </span>
          )}
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isCorrect
              ? 'bg-success-muted text-success-foreground'
              : 'bg-danger-muted text-danger-foreground'
          }`}
        >
          {isCorrect ? '正解' : '不正解'}
        </span>
      </div>

      <div className="mb-4">
        <MarkdownRenderer content={item.body} />
      </div>

      <div className="space-y-2">
        {item.choices.map((choice) => {
          const wasSelected = item.selectedChoiceIds.includes(choice.id)
          const isChoiceCorrect = choice.isCorrect

          let choiceStyle = 'border bg-card'
          if (wasSelected && isChoiceCorrect) {
            choiceStyle =
              'border-success/30 bg-success-muted'
          } else if (wasSelected && !isChoiceCorrect) {
            choiceStyle =
              'border-danger/30 bg-danger-muted'
          } else if (isChoiceCorrect) {
            choiceStyle =
              'border-success/30 bg-success-muted'
          }

          return (
            <div
              key={choice.id}
              className={`rounded-md p-3 ${choiceStyle}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">
                  {wasSelected && isChoiceCorrect && (
                    <span className="text-success">
                      &#10003;
                    </span>
                  )}
                  {wasSelected && !isChoiceCorrect && (
                    <span className="text-danger">
                      &#10007;
                    </span>
                  )}
                  {!wasSelected && isChoiceCorrect && (
                    <span className="text-success">
                      &#9679;
                    </span>
                  )}
                  {!wasSelected && !isChoiceCorrect && (
                    <span className="text-muted-foreground">&#9675;</span>
                  )}
                </span>
                <div className="flex-1">
                  <MarkdownRenderer content={choice.body} />
                  {choice.explanation && (
                    <div className="mt-2 rounded bg-muted/50 p-2 text-sm text-muted-foreground">
                      <MarkdownRenderer content={choice.explanation} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {item.explanation && (
        <div className="mt-4 rounded-md border bg-info-muted p-4">
          <p className="mb-2 text-sm font-semibold text-info-foreground">
            解説
          </p>
          <MarkdownRenderer content={item.explanation} />
        </div>
      )}

      {item.timeSpentSec !== null && (
        <p className="mt-3 text-xs text-muted-foreground">
          所要時間: {formatDuration(item.timeSpentSec)}
        </p>
      )}

      <div className="mt-4 border-t pt-3">
        <ConfidenceSelector
          questionId={item.questionId}
          currentLevel={confidenceLevel}
          onLevelChange={setConfidenceLevel}
        />
      </div>
    </div>
  )
}

const INITIAL_SHOW = 10

function HistoryQuestionList({ results }: { results: SessionResult['results'] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW)
  const visible = results.slice(0, visibleCount)
  const remaining = results.length - visibleCount

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">問題一覧</h2>
      {visible.map((item, idx) => (
        <QuestionReview key={item.questionId} item={item} index={idx} />
      ))}
      {remaining > 0 && (
        <button
          onClick={() => setVisibleCount((prev) => prev + INITIAL_SHOW)}
          className="w-full rounded-lg border py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          さらに表示 (残り {remaining} 問)
        </button>
      )}
    </section>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-muted/50" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border bg-muted/50" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-48 rounded-lg border bg-muted/50" />
      ))}
    </div>
  )
}

export default function HistoryDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>()

  const resultQuery = useQuery({
    queryKey: queryKeys.sessions.results(attemptId!),
    queryFn: () =>
      api.get<ApiResponse<SessionResult>>(
        `/sessions/${attemptId}/results`,
      ),
    enabled: !!attemptId,
  })

  if (resultQuery.isLoading) {
    return <LoadingSkeleton />
  }

  if (resultQuery.error) {
    return <ErrorMessage message={resultQuery.error.message} />
  }

  const result = resultQuery.data?.data

  if (!result) {
    return <ErrorMessage message="セッション結果が見つかりません。" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/stats"
          className="text-sm text-primary hover:underline"
        >
          &larr; 統計に戻る
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">セッションレビュー</h1>
        <p className="mt-1 text-muted-foreground">
          回答と解説を確認しましょう。
        </p>
      </div>

      <SessionSummary result={result} />

      <HistoryQuestionList results={result.results} />
    </div>
  )
}
