import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatScore, formatDate } from '@/lib/format'
import { Collapsible } from '@/components/shared/collapsible'
import { ErrorMessage } from '@/components/shared/error-message'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { StaggerChildren } from '@/components/shared/stagger-children'
import type { ApiResponse, HistoryEntry, SessionResult } from '@/types'

/* ─── Question Result (per question in expanded view) ─── */

function QuestionResultItem({
  item,
  index,
}: {
  item: SessionResult['results'][number]
  index: number
}) {
  const isCorrect = item.isCorrect === true

  return (
    <div
      className={`rounded-lg border p-4 ${
        isCorrect ? 'border-success/30' : 'border-danger/30'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          問題 {index + 1}
        </span>
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

      <div className="mb-3">
        <MarkdownRenderer content={item.body} />
      </div>

      <div className="space-y-2">
        {item.choices.map((choice) => {
          const wasSelected = item.selectedChoiceIds.includes(choice.id)
          const isChoiceCorrect = choice.isCorrect

          let choiceStyle = 'border bg-card'
          if (wasSelected && isChoiceCorrect) {
            choiceStyle = 'border-success/30 bg-success-muted'
          } else if (wasSelected && !isChoiceCorrect) {
            choiceStyle = 'border-danger/30 bg-danger-muted'
          } else if (isChoiceCorrect) {
            choiceStyle = 'border-success/30 bg-success-muted'
          }

          return (
            <div
              key={choice.id}
              className={`rounded-md p-3 ${choiceStyle}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">
                  {wasSelected && isChoiceCorrect && (
                    <span className="text-success">&#10003;</span>
                  )}
                  {wasSelected && !isChoiceCorrect && (
                    <span className="text-danger">&#10007;</span>
                  )}
                  {!wasSelected && isChoiceCorrect && (
                    <span className="text-success">&#9679;</span>
                  )}
                  {!wasSelected && !isChoiceCorrect && (
                    <span className="text-muted-foreground">&#9675;</span>
                  )}
                </span>
                <div className="flex-1">
                  <MarkdownRenderer content={choice.body} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Session Detail (expanded collapsible content) ─── */

function SessionDetail({ sessionId }: { sessionId: string }) {
  const detailQuery = useQuery({
    queryKey: queryKeys.sessions.results(sessionId),
    queryFn: () =>
      api.get<ApiResponse<SessionResult>>(
        `/sessions/${sessionId}/results`,
      ),
  })

  if (detailQuery.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner label="読み込み中" />
      </div>
    )
  }

  if (detailQuery.error) {
    return <ErrorMessage message="セッション詳細の取得に失敗しました。" />
  }

  const result = detailQuery.data?.data
  if (!result) {
    return <ErrorMessage message="データが見つかりません。" />
  }

  return (
    <div className="space-y-3">
      {result.results.map((item, idx) => (
        <QuestionResultItem key={item.questionId} item={item} index={idx} />
      ))}
    </div>
  )
}

/* ─── History Session Item (one collapsible per session) ─── */

function HistorySessionItem({ entry }: { entry: HistoryEntry }) {
  const [open, setOpen] = useState(false)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen && !hasBeenOpened) setHasBeenOpened(true)
  }

  const title = (
    <span className="flex items-center gap-2">
      <span>{formatDate(entry.startedAt)}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          entry.mode === 'exam'
            ? 'bg-info-muted text-info-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {entry.mode === 'exam' ? '実戦' : '演習'}
      </span>
    </span>
  )

  const badge = (
    <span className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>
        {entry.correctCount ?? 0}/{entry.totalQuestions}問
      </span>
      <span className="font-semibold">
        {entry.scorePercent != null ? formatScore(entry.scorePercent) : '-'}
      </span>
    </span>
  )

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange} title={title} badge={badge}>
      {hasBeenOpened && <SessionDetail sessionId={entry.id} />}
    </Collapsible>
  )
}

/* ─── Loading Skeleton ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-48 rounded bg-muted/50" />
      <div className="h-8 w-72 rounded bg-muted/50" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg border bg-muted/50" />
      ))}
    </div>
  )
}

/* ─── Pagination ─── */

function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        前へ
      </button>
      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        次へ
      </button>
    </div>
  )
}

/* ─── Page Component ─── */

const LIMIT = 20

export default function WorkbookHistoryPage() {
  const { workbookId } = useParams<{ workbookId: string }>()
  const [page, setPage] = useState(1)

  const historyQuery = useQuery({
    queryKey: queryKeys.stats.history(page, { workbookId: workbookId! }),
    queryFn: () =>
      api.get<ApiResponse<HistoryEntry[]>>('/stats/history', {
        workbookId: workbookId!,
        page: String(page),
        limit: String(LIMIT),
      }),
    enabled: !!workbookId,
  })

  if (historyQuery.isLoading) {
    return <LoadingSkeleton />
  }

  if (historyQuery.error) {
    return <ErrorMessage message="履歴の取得に失敗しました。" />
  }

  const entries = historyQuery.data?.data ?? []
  const meta = historyQuery.data?.meta
  const title = entries[0]?.workbookTitle ?? '履歴'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="text-sm text-primary hover:underline"
        >
          &larr; ダッシュボードに戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">
        {title}の履歴
      </h1>

      {entries.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          この問題集の履歴はまだありません。
        </div>
      ) : (
        <StaggerChildren className="space-y-3">
          {entries.map((entry) => (
            <HistorySessionItem key={entry.id} entry={entry} />
          ))}
        </StaggerChildren>
      )}

      {meta != null && (
        <Pagination
          page={page}
          total={meta.total}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
