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
  Subject,
  Workbook,
  StatsOverview,
  SubjectStats,
  TagStats,
  HistoryEntry,
} from '@/types'

/* ─── Helpers ─── */

function rateIndicator(rate: number) {
  if (rate >= 80) return { icon: '✓', barColor: 'bg-success', srLabel: '良好' }
  if (rate >= 60) return { icon: '−', barColor: 'bg-warning', srLabel: '普通' }
  return { icon: '!', barColor: 'bg-danger', srLabel: '要改善' }
}

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

/* ─── Subject Stats ─── */

const subjectColumns: ColumnDef<SubjectStats>[] = [
  {
    header: '科目',
    key: 'subjectName',
    cell: (row) => <span className="font-medium">{row.subjectName}</span>,
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
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setBarsReady(true) }, [])

  const COLLAPSE_THRESHOLD = 10
  const shouldCollapse = sorted.length > COLLAPSE_THRESHOLD
  const visibleTags = shouldCollapse && !expanded
    ? sorted.slice(0, COLLAPSE_THRESHOLD)
    : sorted

  return (
    <div>
      {sorted.length > 0 && (
        <p className="sr-only">
          {sorted.length}件のタグ。最高正答率: {Math.round(sorted[0].correctRate)}%、最低正答率: {Math.round(sorted[sorted.length - 1].correctRate)}%
        </p>
      )}
      <div role="list" aria-label="タグ別正答率" className="space-y-3">
        {visibleTags.map((tag) => {
          const rate = Math.round(tag.correctRate)
          const indicator = rateIndicator(rate)

          return (
            <div
              key={tag.tagId}
              role="listitem"
              tabIndex={0}
              className="space-y-1 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {tag.tagColor && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tag.tagColor }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="font-medium">{tag.tagName}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {rate}%
                  <span className="ml-1 text-xs" aria-hidden="true">{indicator.icon}</span>
                  <span className="sr-only">{indicator.srLabel}</span>
                  <span className="ml-1 text-xs">
                    ({tag.correctAnswers}/{tag.totalAnswers})
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full motion-safe:transition-all duration-700 ease-[var(--ease-spring)]', indicator.barColor)}
                  style={{ width: barsReady ? `${rate}%` : '0%' }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 min-h-[40px] cursor-pointer text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
        >
          {expanded ? '折りたたむ' : `すべて表示 (${sorted.length}件)`}
        </button>
      )}
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
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-warning-foreground">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {tag.tagColor && (
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: tag.tagColor }}
                aria-hidden="true"
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
        className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
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
    header: '問題集',
    key: 'workbookTitle',
    cell: (entry) => (
      <Link to={`/stats/history/${entry.id}`} className="font-medium text-primary hover:underline">
        {entry.workbookTitle}
      </Link>
    ),
    primary: true,
    mobileCell: (entry) => entry.workbookTitle,
  },
  {
    header: '科目',
    key: 'subjectName',
    cell: (entry) => <span className="text-muted-foreground">{entry.subjectName}</span>,
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
        問題集を解くと、ここに成績や傾向が表示されます。
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
  id,
  children,
  className,
}: {
  title: string
  id: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className} aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-base font-semibold md:text-lg">{title}</h2>
      {children}
    </section>
  )
}

/* ─── Loading ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="読み込み中">
      <div className="space-y-2">
        <div className="h-7 w-24 rounded-lg bg-muted/40" />
        <div className="h-4 w-48 rounded-lg bg-muted/40" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-36 rounded-xl bg-muted/40" />
        <div className="h-10 w-48 rounded-xl bg-muted/40" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-24 rounded-lg bg-muted/40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-muted/40" />
              <div className="h-4 w-12 rounded bg-muted/40" />
            </div>
            <div className="h-2 w-full rounded-full bg-muted/40" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-20 rounded-lg bg-muted/40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/40" />
        ))}
      </div>
    </div>
  )
}

/* ─── Filter Bar ─── */

function StatsFilterBar({
  subjects,
  workbooks,
  subjectId,
  workbookId,
  onSubjectChange,
  onWorkbookChange,
}: {
  subjects: Subject[]
  workbooks: Workbook[]
  subjectId: string
  workbookId: string
  onSubjectChange: (id: string) => void
  onWorkbookChange: (id: string) => void
}) {
  const filteredWorkbooks = subjectId
    ? workbooks.filter((wb) => wb.subjectId === subjectId)
    : workbooks

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label="科目"
        value={subjectId}
        onChange={(e) => onSubjectChange(e.target.value)}
        className="min-h-[40px] cursor-pointer rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">すべての科目</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <select
        aria-label="問題集"
        value={workbookId}
        onChange={(e) => onWorkbookChange(e.target.value)}
        className="min-h-[40px] min-w-0 flex-1 cursor-pointer truncate rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-none sm:max-w-[240px]"
      >
        <option value="">すべての問題集</option>
        {filteredWorkbooks.map((wb) => (
          <option key={wb.id} value={wb.id}>{wb.title}</option>
        ))}
      </select>

      {(subjectId || workbookId) && (
        <button
          type="button"
          onClick={() => {
            onSubjectChange('')
            onWorkbookChange('')
          }}
          className="min-h-[40px] cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-primary hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
  const [subjectId, setSubjectId] = useState('')
  const [workbookId, setWorkbookId] = useState('')

  const filterParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (subjectId) params.subjectId = subjectId
    if (workbookId) params.workbookId = workbookId
    return params
  }, [subjectId, workbookId])

  const hasFilter = subjectId !== '' || workbookId !== ''

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [subjectId, workbookId])

  // Clear workbookId when it no longer belongs to selected subject
  const handleSubjectChange = (id: string) => {
    setSubjectId(id)
    if (id && workbookId) {
      const wb = allWorkbooks.find((w) => w.id === workbookId)
      if (wb && wb.subjectId !== id) {
        setWorkbookId('')
      }
    }
  }

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => api.get<ApiResponse<Subject[]>>('/subjects'),
  })

  const allWorkbooksQuery = useQuery({
    queryKey: queryKeys.workbooks.list({ published: 'true' }),
    queryFn: () =>
      api.get<ApiResponse<Workbook[]>>('/workbooks', { published: 'true' }),
  })

  const overviewQuery = useQuery({
    queryKey: queryKeys.stats.overview(filterParams),
    queryFn: () => api.get<ApiResponse<StatsOverview>>('/stats/overview', filterParams),
  })

  const subjectStatsQuery = useQuery({
    queryKey: queryKeys.stats.subjects(filterParams),
    queryFn: () => api.get<ApiResponse<SubjectStats[]>>('/stats/subjects', filterParams),
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

  const allSubjects = subjectsQuery.data?.data ?? []
  const allWorkbooks = allWorkbooksQuery.data?.data ?? []

  if (overviewQuery.isLoading && !hasFilter) return <LoadingSkeleton />
  if (overviewQuery.error) return <ErrorMessage message={overviewQuery.error.message} />

  const overview = overviewQuery.data?.data
  const subjectStats = subjectStatsQuery.data?.data ?? []
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
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight">統計</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          成績と傾向を確認できます。
        </p>
      </div>

      <StatsFilterBar
        subjects={allSubjects}
        workbooks={allWorkbooks}
        subjectId={subjectId}
        workbookId={workbookId}
        onSubjectChange={handleSubjectChange}
        onWorkbookChange={setWorkbookId}
      />

      {overviewQuery.isLoading ? (
        <LoadingSkeleton />
      ) : !hasData && !hasFilter ? (
        <EmptyState />
      ) : (
        <>
          {overview && <OverviewGrid overview={overview} />}

          {!hasFilter && subjectStats.length > 0 && (
            <Section title="科目別" id="section-subjects">
              <ResponsiveTable
                data={subjectStats}
                columns={subjectColumns}
                keyExtractor={(row) => row.subjectId}
                emptyMessage=""
              />
            </Section>
          )}

          {tagStats.length > 0 && (
            <Section title="タグ別正答率" id="section-tags">
              <TagAccuracyChart tags={tagStats} />
            </Section>
          )}

          {weakAreas.length > 0 && (
            <Section title="弱点分析" id="section-weak-areas">
              <WeakAreas tags={weakAreas} />
            </Section>
          )}

          <Section title="試験履歴" id="section-history">
            {historyQuery.isLoading ? (
              <div className="animate-pulse space-y-2" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted/40" />
                ))}
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
                      className="min-h-[44px] cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="min-h-[44px] cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
