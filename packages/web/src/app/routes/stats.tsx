import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatScore, formatDate, formatDuration } from '@/lib/format'
import { ErrorMessage } from '@/components/shared/error-message'
import {
  ResponsiveTable,
  type ColumnDef,
} from '@/components/shared/responsive-table'
import type {
  ApiResponse,
  StatsOverview,
  CategoryStats,
  TagStats,
  HistoryEntry,
} from '@/types'

function OverviewCards({ overview }: { overview: StatsOverview }) {
  const cards = [
    {
      label: '総セッション数',
      value: overview.totalSessions.toLocaleString(),
    },
    {
      label: '平均スコア',
      value: formatScore(overview.avgScore),
    },
    {
      label: '総問題数',
      value: overview.totalQuestions.toLocaleString(),
    },
    {
      label: '総正解数',
      value: overview.totalCorrect.toLocaleString(),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border bg-card p-6 shadow-sm"
        >
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}

const categoryColumns: ColumnDef<CategoryStats>[] = [
  {
    header: 'カテゴリ',
    key: 'categoryName',
    cell: (row) => <span className="font-medium">{row.categoryName}</span>,
    primary: true,
  },
  {
    header: 'セッション数',
    key: 'sessions',
    cell: (row) => row.sessions,
  },
  {
    header: '平均スコア',
    key: 'avgScore',
    cell: (row) => formatScore(row.avgScore),
  },
  {
    header: '正答率',
    key: 'correctRate',
    cell: (row) => {
      const rate =
        row.totalQuestions > 0
          ? Math.round((row.totalCorrect / row.totalQuestions) * 100)
          : 0
      return `${rate}%`
    },
  },
]

function CategoryStatsTable({ stats }: { stats: CategoryStats[] }) {
  return (
    <ResponsiveTable
      data={stats}
      columns={categoryColumns}
      keyExtractor={(row) => row.categoryId}
      emptyMessage="カテゴリ統計がまだありません。"
    />
  )
}

function TagAccuracyChart({ tags }: { tags: TagStats[] }) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        タグ統計がまだありません。
      </p>
    )
  }

  const sorted = [...tags].sort((a, b) => b.correctRate - a.correctRate)

  return (
    <div className="space-y-3">
      {sorted.map((tag) => (
        <div key={tag.tagId} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {tag.tagColor && (
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.tagColor }}
                />
              )}
              <span className="font-medium">{tag.tagName}</span>
            </span>
            <span className="text-muted-foreground">
              {Math.round(tag.correctRate)}% ({tag.correctAnswers}/
              {tag.totalAnswers})
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.round(tag.correctRate)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function WeakAreas({ tags }: { tags: TagStats[] }) {
  const weakTags = [...tags]
    .filter((t) => t.totalAnswers >= 1)
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 5)

  if (weakTags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        弱点はまだ特定されていません。
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {weakTags.map((tag) => (
        <div
          key={tag.tagId}
          className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/50 dark:bg-orange-950/20"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            {tag.tagColor && (
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: tag.tagColor }}
              />
            )}
            {tag.tagName}
          </span>
          <span className="text-sm text-orange-700 dark:text-orange-400">
            正答率 {Math.round(tag.correctRate)}%
          </span>
        </div>
      ))}
    </div>
  )
}

const historyColumns: ColumnDef<HistoryEntry>[] = [
  {
    header: '問題セット',
    key: 'questionSetTitle',
    cell: (entry) => (
      <Link
        to={`/stats/history/${entry.id}`}
        className="font-medium text-primary hover:underline"
      >
        {entry.questionSetTitle}
      </Link>
    ),
    primary: true,
    mobileCell: (entry) => entry.questionSetTitle,
  },
  {
    header: 'カテゴリ',
    key: 'categoryName',
    cell: (entry) => (
      <span className="text-muted-foreground">{entry.categoryName}</span>
    ),
  },
  {
    header: 'モード',
    key: 'mode',
    cell: (entry) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          entry.mode === 'exam'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}
      >
        {entry.mode === 'exam' ? '実戦' : '演習'}
      </span>
    ),
  },
  {
    header: 'スコア',
    key: 'score',
    cell: (entry) =>
      entry.scorePercent !== null ? formatScore(entry.scorePercent) : '-',
  },
  {
    header: '所要時間',
    key: 'timeSpent',
    cell: (entry) => (
      <span className="text-muted-foreground">
        {entry.timeSpentSec !== null ? formatDuration(entry.timeSpentSec) : '-'}
      </span>
    ),
  },
  {
    header: '日付',
    key: 'date',
    cell: (entry) => (
      <span className="text-muted-foreground">
        {formatDate(entry.startedAt)}
      </span>
    ),
  },
]

function HistoryList({
  entries,
  page,
  totalPages,
  onPageChange,
}: {
  entries: HistoryEntry[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="space-y-4">
      <ResponsiveTable
        data={entries}
        columns={historyColumns}
        keyExtractor={(entry) => entry.id}
        rowLink={(entry) => `/stats/history/${entry.id}`}
        emptyMessage="試験履歴がまだありません。"
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="min-h-[44px] rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            前へ
          </button>
          <span className="px-3 text-sm text-muted-foreground">
            {page} / {totalPages} ページ
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="min-h-[44px] rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-muted/50" />
        ))}
      </div>
      <div className="h-6 w-48 rounded bg-muted/50" />
      <div className="h-48 rounded-lg border bg-muted/50" />
      <div className="h-6 w-48 rounded bg-muted/50" />
      <div className="h-40 rounded-lg border bg-muted/50" />
    </div>
  )
}

const HISTORY_LIMIT = 20

export default function StatsPage() {
  const [page, setPage] = useState(1)

  const overviewQuery = useQuery({
    queryKey: queryKeys.stats.overview,
    queryFn: () => api.get<ApiResponse<StatsOverview>>('/stats/overview'),
  })

  const categoryStatsQuery = useQuery({
    queryKey: queryKeys.stats.categories,
    queryFn: () => api.get<ApiResponse<CategoryStats[]>>('/stats/categories'),
  })

  const tagStatsQuery = useQuery({
    queryKey: queryKeys.stats.tags,
    queryFn: () => api.get<ApiResponse<TagStats[]>>('/stats/tags'),
  })

  const weakAreasQuery = useQuery({
    queryKey: queryKeys.stats.weakAreas,
    queryFn: () => api.get<ApiResponse<TagStats[]>>('/stats/weak-areas'),
  })

  const historyQuery = useQuery({
    queryKey: queryKeys.stats.history(page),
    queryFn: () =>
      api.get<ApiResponse<HistoryEntry[]>>('/stats/history', {
        page: String(page),
        limit: String(HISTORY_LIMIT),
      }),
  })

  const isLoading =
    overviewQuery.isLoading ||
    categoryStatsQuery.isLoading ||
    tagStatsQuery.isLoading ||
    weakAreasQuery.isLoading ||
    historyQuery.isLoading

  const error =
    overviewQuery.error ||
    categoryStatsQuery.error ||
    tagStatsQuery.error ||
    weakAreasQuery.error ||
    historyQuery.error

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorMessage message={error.message} />
  }

  const overview = overviewQuery.data?.data
  const categoryStats = categoryStatsQuery.data?.data ?? []
  const tagStats = tagStatsQuery.data?.data ?? []
  const weakAreas = weakAreasQuery.data?.data ?? []
  const history = historyQuery.data?.data ?? []
  const historyMeta = historyQuery.data?.meta
  const totalPages = historyMeta
    ? Math.ceil(historyMeta.total / historyMeta.limit)
    : 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">統計</h1>
        <p className="mt-1 text-muted-foreground">
          試験の成績を確認し、改善すべき分野を特定しましょう。
        </p>
      </div>

      {overview && <OverviewCards overview={overview} />}

      <section>
        <h2 className="mb-4 text-lg font-semibold">カテゴリ別統計</h2>
        <CategoryStatsTable stats={categoryStats} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">タグ別正答率</h2>
        <TagAccuracyChart tags={tagStats} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">弱点分析</h2>
        <WeakAreas tags={weakAreas} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">試験履歴</h2>
        <HistoryList
          entries={history}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>
    </div>
  )
}
