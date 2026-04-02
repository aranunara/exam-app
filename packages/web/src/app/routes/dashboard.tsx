import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatScore, formatDate } from '@/lib/format'
import { ErrorMessage } from '@/components/shared/error-message'
import { StaggerChildren } from '@/components/shared/stagger-children'
import { cn } from '@/lib/utils'
import {
  ResponsiveTable,
  type ColumnDef,
} from '@/components/shared/responsive-table'
import type {
  ApiResponse,
  Category,
  QuestionSet,
  QuestionSetScore,
  HistoryEntry,
  StatsOverview,
} from '@/types'

/* ─── Desktop: Stats Cards ─── */

function StatsCards({ overview }: { overview: StatsOverview }) {
  const cards = [
    { label: '総セッション数', value: overview.totalSessions.toLocaleString() },
    { label: '平均スコア', value: formatScore(overview.avgScore) },
    { label: '総問題数', value: overview.totalQuestions.toLocaleString() },
  ]

  return (
    <StaggerChildren className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{card.value}</p>
        </div>
      ))}
    </StaggerChildren>
  )
}

/* ─── Mobile: Score Ring ─── */

function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const [mounted, setMounted] = useState(false)
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80
      ? 'text-success'
      : score >= 60
        ? 'text-warning'
        : 'text-danger'

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          className={cn('motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500', color)}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums">{score}%</span>
    </div>
  )
}

/* ─── Mobile: Quick Start Card ─── */

function QuickStartCard({
  questionSet,
  categoryName,
  score,
  highlight,
}: {
  questionSet: QuestionSet
  categoryName: string
  score?: QuestionSetScore
  highlight?: boolean
}) {
  const questionCount = questionSet.questionCount ?? questionSet.questions?.length
  const linkState = {
    title: questionSet.title,
    questionCount,
    timeLimit: questionSet.timeLimit,
  }
  const hasScore = score != null && score.recentAvg != null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-card shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none dark:border dark:border-border',
        'motion-safe:hover:-translate-y-0.5 motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:shadow-md',
        highlight && 'ring-2 ring-primary/25',
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Left: Info */}
        <div className="min-w-0 flex-1">
          {/* Category badge */}
          <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {categoryName}
          </span>

          {/* Title */}
          <h3 className="mt-1 text-[15px] font-bold leading-snug text-foreground line-clamp-2">
            {questionSet.title}
          </h3>

          {/* Meta */}
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            {questionCount != null && questionCount > 0 && (
              <span className="flex items-center gap-0.5">
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5" /><path d="M15 11h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-5" /><path d="M5 11V7a3 3 0 0 1 6 0v4" /><path d="M13 11V7a3 3 0 0 1 6 0v4" />
                </svg>
                {questionCount}問
              </span>
            )}
            {questionSet.timeLimit != null && (
              <span className="flex items-center gap-0.5">
                <span className="text-muted-foreground/40 px-0.5">|</span>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {Math.floor(questionSet.timeLimit / 60)}分
              </span>
            )}
            {score != null && score.attempts > 0 && (
              <span className="text-muted-foreground/40 px-0.5">|</span>
            )}
            {score != null && score.attempts > 0 && (
              <span>{score.attempts}回</span>
            )}
          </div>
        </div>

        {/* Right: Score ring */}
        <div className="flex shrink-0 items-center">
          {hasScore ? (
            <ScoreRing score={score.recentAvg!} />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/20">
              <span className="text-[9px] font-medium text-muted-foreground/50">NEW</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA row */}
      <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-4 py-2.5 dark:bg-muted/10">
        {score != null && score.attempts > 0 ? (
          <Link
            to={`/question-sets/${questionSet.id}/history`}
            className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-medium text-muted-foreground transition-colors active:text-foreground"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            履歴
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Link
            to={`/practice/${questionSet.id}`}
            state={linkState}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold shadow-sm transition-colors active:scale-[0.97] active:bg-muted"
          >
            演習
          </Link>
          <Link
            to={`/exam/${questionSet.id}`}
            state={linkState}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors active:scale-[0.97] active:brightness-90"
          >
            実戦
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Mobile: Quick Start List ─── */

function QuickStartList({
  categories,
  questionSets,
  scores,
}: {
  categories: Category[]
  questionSets: QuestionSet[]
  scores: QuestionSetScore[]
}) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
  const scoreMap = new Map(scores.map((s) => [s.questionSetId, s]))

  if (questionSets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted-foreground">問題セットがまだありません</p>
        <p className="mt-1 text-xs text-muted-foreground/70">管理画面から追加してください</p>
      </div>
    )
  }

  const sorted = [...questionSets].sort((a, b) => {
    const sa = scoreMap.get(a.id)
    const sb = scoreMap.get(b.id)
    const ta = sa?.lastPlayedAt ?? ''
    const tb = sb?.lastPlayedAt ?? ''
    if (ta && !tb) return -1
    if (!ta && tb) return 1
    if (ta && tb) return tb.localeCompare(ta)
    return 0
  })

  const lastPlayed = sorted[0]
  const lastPlayedScore = lastPlayed ? scoreMap.get(lastPlayed.id) : undefined
  const hasLastPlayed = lastPlayedScore != null && lastPlayedScore.attempts > 0

  return (
    <div className="space-y-6">
      {hasLastPlayed && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              前回の続き
            </p>
          </div>
          <QuickStartCard
            questionSet={lastPlayed}
            categoryName={categoryMap.get(lastPlayed.categoryId) ?? ''}
            score={lastPlayedScore}
            highlight
          />
        </section>
      )}

      <section>
        {hasLastPlayed && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            すべて
          </p>
        )}
        <StaggerChildren className="space-y-3">
          {(hasLastPlayed ? sorted.slice(1) : sorted).map((qs) => (
            <QuickStartCard
              key={qs.id}
              questionSet={qs}
              categoryName={categoryMap.get(qs.categoryId) ?? ''}
              score={scoreMap.get(qs.id)}
            />
          ))}
        </StaggerChildren>
      </section>
    </div>
  )
}

/* ─── Desktop: Category List ─── */

function CategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">カテゴリがまだありません。</p>
  }

  return (
    <StaggerChildren className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/exams/${category.id}`}
          className="group block rounded-lg border bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] motion-safe:transition-[transform,box-shadow,border-color,background-color] motion-safe:duration-200 hover:border-primary/50 hover:bg-accent/50 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
        >
          <h3 className="font-semibold group-hover:text-primary">{category.name}</h3>
          {category.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
          )}
        </Link>
      ))}
    </StaggerChildren>
  )
}

/* ─── Desktop: History Table ─── */

const historyColumns: ColumnDef<HistoryEntry>[] = [
  {
    header: '問題セット',
    key: 'questionSetTitle',
    cell: (entry) => <span className="font-medium">{entry.questionSetTitle}</span>,
    primary: true,
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
    header: '日付',
    key: 'date',
    cell: (entry) => <span className="text-muted-foreground">{formatDate(entry.startedAt)}</span>,
  },
]

/* ─── Loading Skeleton ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-muted/40 p-4">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
          <div className="mt-4 border-t border-muted pt-3">
            <div className="flex justify-end gap-2">
              <div className="h-10 w-16 rounded-xl bg-muted" />
              <div className="h-10 w-20 rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Dashboard ─── */

export default function Dashboard() {
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<ApiResponse<Category[]>>('/categories'),
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.stats.overview(),
    queryFn: () => api.get<ApiResponse<StatsOverview>>('/stats/overview'),
  })

  const historyQuery = useQuery({
    queryKey: queryKeys.stats.history(1, {}),
    queryFn: () =>
      api.get<ApiResponse<HistoryEntry[]>>('/stats/history', {
        page: '1',
        limit: '5',
      }),
  })

  const allSetsQuery = useQuery({
    queryKey: queryKeys.questionSets.list({ published: 'true' }),
    queryFn: () =>
      api.get<ApiResponse<QuestionSet[]>>('/question-sets', { published: 'true' }),
  })

  const scoresQuery = useQuery({
    queryKey: queryKeys.stats.questionSetScores,
    queryFn: () =>
      api.get<ApiResponse<QuestionSetScore[]>>('/stats/question-set-scores', { limit: '5' }),
  })

  const isLoading = categoriesQuery.isLoading || allSetsQuery.isLoading
  const error = categoriesQuery.error || allSetsQuery.error

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage message={error.message} />

  const overview = statsQuery.data?.data
  const categories = categoriesQuery.data?.data ?? []
  const history = historyQuery.data?.data ?? []
  const allSets = allSetsQuery.data?.data ?? []
  const scores = scoresQuery.data?.data ?? []

  return (
    <div className="space-y-8">
      {/* ─── Mobile ─── */}
      <div className="md:hidden">
        <h1 className="text-xl font-bold tracking-tight">問題セット</h1>
        <div className="mt-4">
          <QuickStartList
            categories={categories}
            questionSets={allSets}
            scores={scores}
          />
        </div>
      </div>

      {/* ─── Desktop ─── */}
      <div className="hidden space-y-8 md:block">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="mt-1 text-muted-foreground">試験の進捗状況を確認できます。</p>
        </div>

        {overview && <StatsCards overview={overview} />}

        <section>
          <h2 className="mb-4 text-lg font-semibold">カテゴリ</h2>
          <CategoryList categories={categories} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">最近の履歴</h2>
            <Link to="/stats" className="text-sm text-primary hover:underline">すべて表示</Link>
          </div>
          <ResponsiveTable
            data={history}
            columns={historyColumns}
            keyExtractor={(entry) => entry.id}
            emptyMessage="試験履歴がまだありません。最初の試験を始めましょう！"
          />
        </section>
      </div>
    </div>
  )
}
