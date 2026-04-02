import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatScore, formatDate, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { ErrorMessage } from '@/components/shared/error-message'
import {
  ResponsiveTable,
  type ColumnDef,
} from '@/components/shared/responsive-table'
import type {
  ApiResponse,
  Category,
  QuestionSet,
  StatsOverview,
  CategoryStats,
  TagStats,
  HistoryEntry,
} from '@/types'

/* ─── Overview Grid ─── */

function OverviewGrid({ overview }: { overview: StatsOverview }) {
  const cards = [
    { label: 'セッション', value: overview.totalSessions, decimals: 0, suffix: '' },
    { label: '平均スコア', value: overview.avgScore, decimals: 1, suffix: '%' },
    { label: '総問題数', value: overview.totalQuestions, decimals: 0, suffix: '' },
    { label: '総正解数', value: overview.totalCorrect, decimals: 0, suffix: '' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className="rounded-2xl bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:border dark:border-border dark:shadow-none"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {card.label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight md:text-3xl">
            <AnimatedNumber
              value={card.value}
              duration={600}
              delay={index * 100}
              decimals={card.decimals}
            />
            {card.suffix && (
              <span className="text-lg text-muted-foreground">{card.suffix}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ─── Category Stats ─── */

const categoryColumns: ColumnDef<CategoryStats>[] = [
  {
    header: 'カテゴリ',
    key: 'categoryName',
    cell: (row) => <span className="font-medium">{row.categoryName}</span>,
    primary: true,
  },
  {
    header: 'セッション',
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

/* ─── Tag Accuracy ─── */

function TagAccuracyChart({ tags }: { tags: TagStats[] }) {
  const sorted = [...tags].sort((a, b) => b.correctRate - a.correctRate)
  const [barsReady, setBarsReady] = useState(false)

  useEffect(() => {
    setBarsReady(true)
  }, [])

  return (
    <div className="space-y-3">
      {sorted.map((tag) => {
        const rate = Math.round(tag.correctRate)
        const barColor =
          rate >= 80
            ? 'bg-success'
            : rate >= 60
              ? 'bg-warning'
              : 'bg-danger'

        return (
          <div key={tag.tagId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {tag.tagColor && (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tag.tagColor }}
                  />
                )}
                <span className="font-medium">{tag.tagName}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">
                {rate}%
                <span className="ml-1 text-xs">
                  ({tag.correctAnswers}/{tag.totalAnswers})
                </span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full motion-safe:transition-all duration-700 ease-[var(--ease-spring)]', barColor)}
                style={{ width: barsReady ? `${rate}%` : '0%' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Weak Areas ─── */

function WeakAreas({ tags }: { tags: TagStats[] }) {
  const weakTags = [...tags]
    .filter((t) => t.totalAnswers >= 1)
    .sort((a, b) => a.correctRate - b.correctRate)
    .slice(0, 5)

  return (
    <div className="space-y-2">
      {weakTags.map((tag) => (
        <div
          key={tag.tagId}
          className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning-muted p-3"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            {tag.tagColor && (
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: tag.tagColor }}
              />
            )}
            {tag.tagName}
          </span>
          <span className="text-sm font-semibold tabular-nums text-warning-foreground">
            {Math.round(tag.correctRate)}%
          </span>
        </div>
      ))}
      <Link
        to="/dashboard"
        className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        演習で弱点を克服する
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

/* ─── History ─── */

const historyColumns: ColumnDef<HistoryEntry>[] = [
  {
    header: '問題セット',
    key: 'questionSetTitle',
    cell: (entry) => (
      <Link to={`/stats/history/${entry.id}`} className="font-medium text-primary hover:underline">
        {entry.questionSetTitle}
      </Link>
    ),
    primary: true,
    mobileCell: (entry) => entry.questionSetTitle,
  },
  {
    header: 'カテゴリ',
    key: 'categoryName',
    cell: (entry) => <span className="text-muted-foreground">{entry.categoryName}</span>,
  },
  {
    header: 'モード',
    key: 'mode',
    cell: (entry) => (
      <span
        className={cn(
          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
          entry.mode === 'exam'
            ? 'bg-info-muted text-info-foreground'
            : 'bg-success-muted text-success-foreground',
        )}
      >
        {entry.mode === 'exam' ? '実戦' : '演習'}
      </span>
    ),
  },
  {
    header: 'スコア',
    key: 'score',
    cell: (entry) => (entry.scorePercent !== null ? formatScore(entry.scorePercent) : '-'),
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
    cell: (entry) => <span className="text-muted-foreground">{formatDate(entry.startedAt)}</span>,
  },
]

/* ─── Empty State ─── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold">まだデータがありません</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        問題セットを解くと、ここに成績や傾向が表示されます。
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        問題を解く
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

/* ─── Section Wrapper ─── */

function Section({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <h2 className="mb-3 text-base font-semibold md:text-lg">{title}</h2>
      {children}
    </section>
  )
}

/* ─── Loading ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-muted/40" />
      <div className="h-32 rounded-2xl bg-muted/40" />
    </div>
  )
}

/* ─── Filter Bar ─── */

function StatsFilterBar({
  categories,
  questionSets,
  categoryId,
  questionSetId,
  onCategoryChange,
  onQuestionSetChange,
}: {
  categories: Category[]
  questionSets: QuestionSet[]
  categoryId: string
  questionSetId: string
  onCategoryChange: (id: string) => void
  onQuestionSetChange: (id: string) => void
}) {
  const filteredSets = categoryId
    ? questionSets.filter((s) => s.categoryId === categoryId)
    : questionSets

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="min-h-[40px] rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">すべてのカテゴリ</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={questionSetId}
        onChange={(e) => onQuestionSetChange(e.target.value)}
        className="min-h-[40px] min-w-0 flex-1 truncate rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none sm:max-w-[240px]"
      >
        <option value="">すべての問題セット</option>
        {filteredSets.map((s) => (
          <option key={s.id} value={s.id}>{s.title}</option>
        ))}
      </select>

      {(categoryId || questionSetId) && (
        <button
          type="button"
          onClick={() => {
            onCategoryChange('')
            onQuestionSetChange('')
          }}
          className="text-sm text-primary hover:underline"
        >
          リセット
        </button>
      )}
    </div>
  )
}

/* ─── Main ─── */

const HISTORY_LIMIT = 20

export default function StatsPage() {
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState('')
  const [questionSetId, setQuestionSetId] = useState('')

  const filterParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (categoryId) params.categoryId = categoryId
    if (questionSetId) params.questionSetId = questionSetId
    return params
  }, [categoryId, questionSetId])

  const hasFilter = categoryId !== '' || questionSetId !== ''

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [categoryId, questionSetId])

  // Clear questionSetId when it no longer belongs to selected category
  const handleCategoryChange = (id: string) => {
    setCategoryId(id)
    if (id && questionSetId) {
      const set = allSets.find((s) => s.id === questionSetId)
      if (set && set.categoryId !== id) {
        setQuestionSetId('')
      }
    }
  }

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<ApiResponse<Category[]>>('/categories'),
  })

  const allSetsQuery = useQuery({
    queryKey: queryKeys.questionSets.list({ published: 'true' }),
    queryFn: () =>
      api.get<ApiResponse<QuestionSet[]>>('/question-sets', { published: 'true' }),
  })

  const overviewQuery = useQuery({
    queryKey: queryKeys.stats.overview(filterParams),
    queryFn: () => api.get<ApiResponse<StatsOverview>>('/stats/overview', filterParams),
  })

  const categoryStatsQuery = useQuery({
    queryKey: queryKeys.stats.categories(filterParams),
    queryFn: () => api.get<ApiResponse<CategoryStats[]>>('/stats/categories', filterParams),
  })

  const tagStatsQuery = useQuery({
    queryKey: queryKeys.stats.tags(filterParams),
    queryFn: () => api.get<ApiResponse<TagStats[]>>('/stats/tags', filterParams),
  })

  const weakAreasQuery = useQuery({
    queryKey: queryKeys.stats.weakAreas(filterParams),
    queryFn: () => api.get<ApiResponse<TagStats[]>>('/stats/weak-areas', filterParams),
  })

  const historyQuery = useQuery({
    queryKey: queryKeys.stats.history(page, filterParams),
    queryFn: () =>
      api.get<ApiResponse<HistoryEntry[]>>('/stats/history', {
        page: String(page),
        limit: String(HISTORY_LIMIT),
        ...filterParams,
      }),
  })

  const allCategories = categoriesQuery.data?.data ?? []
  const allSets = allSetsQuery.data?.data ?? []

  if (overviewQuery.isLoading && !hasFilter) return <LoadingSkeleton />
  if (overviewQuery.error) return <ErrorMessage message={overviewQuery.error.message} />

  const overview = overviewQuery.data?.data
  const categoryStats = categoryStatsQuery.data?.data ?? []
  const tagStats = tagStatsQuery.data?.data ?? []
  const weakAreas = weakAreasQuery.data?.data ?? []
  const history = historyQuery.data?.data ?? []
  const historyMeta = historyQuery.data?.meta
  const totalPages = historyMeta
    ? Math.ceil(historyMeta.total / historyMeta.limit)
    : 1

  const hasData = overview != null && overview.totalSessions > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">統計</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          成績と傾向を確認できます。
        </p>
      </div>

      <StatsFilterBar
        categories={allCategories}
        questionSets={allSets}
        categoryId={categoryId}
        questionSetId={questionSetId}
        onCategoryChange={handleCategoryChange}
        onQuestionSetChange={setQuestionSetId}
      />

      {overviewQuery.isLoading ? (
        <LoadingSkeleton />
      ) : !hasData && !hasFilter ? (
        <EmptyState />
      ) : (
        <>
          {overview && <OverviewGrid overview={overview} />}

          {!hasFilter && categoryStats.length > 0 && (
            <Section title="カテゴリ別">
              <ResponsiveTable
                data={categoryStats}
                columns={categoryColumns}
                keyExtractor={(row) => row.categoryId}
                emptyMessage=""
              />
            </Section>
          )}

          {tagStats.length > 0 && (
            <Section title="タグ別正答率">
              <TagAccuracyChart tags={tagStats} />
            </Section>
          )}

          {weakAreas.length > 0 && (
            <Section title="弱点分析">
              <WeakAreas tags={weakAreas} />
            </Section>
          )}

          <Section title="試験履歴">
            {historyQuery.isLoading ? (
              <div className="animate-pulse">
                <div className="h-32 rounded-2xl bg-muted/40" />
              </div>
            ) : historyQuery.error ? (
              <ErrorMessage message={historyQuery.error.message} />
            ) : (
              <div className="space-y-4">
                <ResponsiveTable
                  data={history}
                  columns={historyColumns}
                  keyExtractor={(entry) => entry.id}
                  rowLink={(entry) => `/stats/history/${entry.id}`}
                  emptyMessage={hasFilter ? 'この条件に一致する履歴がありません。' : '試験履歴がまだありません。'}
                />
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      前へ
                    </button>
                    <span className="px-3 text-sm tabular-nums text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      次へ
                    </button>
                  </div>
                )}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}
