import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatScore, formatDate } from '@/lib/format'
import { ErrorMessage } from '@/components/shared/error-message'
import { StaggerChildren } from '@/components/shared/stagger-children'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { cn } from '@/lib/utils'
import {
  ResponsiveTable,
  type ColumnDef,
} from '@/components/shared/responsive-table'
import type {
  ApiResponse,
  Subject,
  Workbook,
  WorkbookScore,
  HistoryEntry,
  StatsOverview,
} from '@/types'

/* ─── Desktop: Stats Cards ─── */

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-danger'
}

function StatsCards({ overview }: { overview: StatsOverview }) {
  const correctRate =
    overview.totalQuestions > 0
      ? Math.round((overview.totalCorrect / overview.totalQuestions) * 100)
      : 0

  const cards = [
    {
      label: '総セッション数',
      value: overview.totalSessions,
      suffix: '',
      icon: (
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
        </svg>
      ),
    },
    {
      label: '平均スコア',
      value: overview.avgScore,
      suffix: '%',
      colorClass: scoreColor(overview.avgScore),
      icon: (
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="m22 12-4-4v3H3v2h15v3z" />
        </svg>
      ),
    },
    {
      label: '正答率',
      value: correctRate,
      suffix: '%',
      colorClass: scoreColor(correctRate),
      icon: (
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ]

  return (
    <StaggerChildren className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            {card.icon}
          </div>
          <p className={cn('mt-2 text-3xl font-bold tabular-nums tracking-tight', card.colorClass)}>
            <AnimatedNumber value={card.value} suffix={card.suffix} />
          </p>
        </div>
      ))}
    </StaggerChildren>
  )
}

/* ─── Score Ring ─── */

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
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`スコア ${score}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
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
      <span className="absolute text-xs font-bold tabular-nums" aria-hidden="true">{score}%</span>
    </div>
  )
}

/* ─── Mobile: Quick Start Card ─── */

function QuickStartCard({
  workbook,
  subjectName,
  score,
  highlight,
}: {
  workbook: Workbook
  subjectName: string
  score?: WorkbookScore
  highlight?: boolean
}) {
  const questionCount = workbook.questionCount ?? workbook.questions?.length
  const linkState = {
    title: workbook.title,
    questionCount,
    timeLimit: workbook.timeLimit,
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
          {/* Subject badge */}
          <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {subjectName}
          </span>

          {/* Title */}
          <h3 className="mt-1 text-[15px] font-bold leading-snug text-foreground line-clamp-2">
            {workbook.title}
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
            {workbook.timeLimit != null && (
              <span className="flex items-center gap-0.5">
                <span className="text-muted-foreground/40 px-0.5">|</span>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {Math.floor(workbook.timeLimit / 60)}分
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
            to={`/workbooks/${workbook.id}/history`}
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
            to={`/practice/${workbook.id}`}
            state={linkState}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold shadow-sm transition-colors active:scale-[0.97] active:bg-muted"
          >
            演習
          </Link>
          <Link
            to={`/exam/${workbook.id}`}
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
  subjects,
  workbooks,
  scores,
}: {
  subjects: Subject[]
  workbooks: Workbook[]
  scores: WorkbookScore[]
}) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))
  const scoreMap = new Map(scores.map((s) => [s.workbookId, s]))

  if (workbooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted-foreground">問題集がまだありません</p>
        <p className="mt-1 text-xs text-muted-foreground/70">管理画面から追加してください</p>
      </div>
    )
  }

  const sorted = [...workbooks].sort((a, b) => {
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
            workbook={lastPlayed}
            subjectName={subjectMap.get(lastPlayed.subjectId) ?? ''}
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
              workbook={qs}
              subjectName={subjectMap.get(qs.subjectId) ?? ''}
              score={scoreMap.get(qs.id)}
            />
          ))}
        </StaggerChildren>
      </section>
    </div>
  )
}

/* ─── Desktop: Workbook Grid ─── */

function WorkbookGrid({
  subjects,
  workbooks,
  scores,
  selectedSubjectId,
  onSubjectChange,
}: {
  subjects: Subject[]
  workbooks: Workbook[]
  scores: WorkbookScore[]
  selectedSubjectId: string | null
  onSubjectChange: (id: string | null) => void
}) {
  const scoreMap = new Map(scores.map((s) => [s.workbookId, s]))
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

  const filtered = selectedSubjectId
    ? workbooks.filter((wb) => wb.subjectId === selectedSubjectId)
    : workbooks

  return (
    <div>
      {/* Subject filter tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="科目フィルター">
        <button
          onClick={() => onSubjectChange(null)}
          aria-pressed={selectedSubjectId === null}
          className={cn(
            'cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            selectedSubjectId === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          すべて
        </button>
        {subjects.map((subj) => (
          <button
            key={subj.id}
            onClick={() => onSubjectChange(subj.id)}
            aria-pressed={selectedSubjectId === subj.id}
            className={cn(
              'cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              selectedSubjectId === subj.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {subj.name}
          </button>
        ))}
      </div>

      {/* Question set cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {selectedSubjectId ? 'この科目には問題集がありません。' : '問題集がまだありません。'}
          </p>
        </div>
      ) : (
        <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((qs) => {
            const score = scoreMap.get(qs.id)
            const hasScore = score != null && score.recentAvg != null
            const questionCount = qs.questionCount ?? qs.questions?.length

            return (
              <div
                key={qs.id}
                className="group rounded-lg border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.08)] motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {!selectedSubjectId && (
                        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {subjectMap.get(qs.subjectId) ?? ''}
                        </span>
                      )}
                      <h3 className={cn('font-semibold leading-snug', !selectedSubjectId && 'mt-1')}>
                        {qs.title}
                      </h3>
                      {qs.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{qs.description}</p>
                      )}
                    </div>
                    {hasScore && (
                      <ScoreRing score={score.recentAvg!} size={48} />
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {questionCount != null && questionCount > 0 && (
                      <span className="flex items-center gap-1">
                        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5" /><path d="M15 11h5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-5" /><path d="M5 11V7a3 3 0 0 1 6 0v4" /><path d="M13 11V7a3 3 0 0 1 6 0v4" />
                        </svg>
                        {questionCount}問
                      </span>
                    )}
                    {qs.timeLimit != null && (
                      <span className="flex items-center gap-1">
                        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {Math.floor(qs.timeLimit / 60)}分
                      </span>
                    )}
                    {hasScore && (
                      <span>{score.attempts}回受験</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t px-5 py-3">
                  {hasScore ? (
                    <Link
                      to={`/workbooks/${qs.id}/history`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
                    >
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      履歴
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">NEW</span>
                  )}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/practice/${qs.id}`}
                      state={{ title: qs.title, questionCount, timeLimit: qs.timeLimit }}
                      className="inline-flex min-h-[36px] items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      演習
                    </Link>
                    <Link
                      to={`/exam/${qs.id}`}
                      state={{ title: qs.title, questionCount, timeLimit: qs.timeLimit }}
                      className="inline-flex min-h-[36px] items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      実戦
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </StaggerChildren>
      )}
    </div>
  )
}

/* ─── Desktop: History Table ─── */

const historyColumns: ColumnDef<HistoryEntry>[] = [
  {
    header: '問題集',
    key: 'workbookTitle',
    cell: (entry) => <span className="font-medium">{entry.workbookTitle}</span>,
    primary: true,
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
    header: '日付',
    key: 'date',
    cell: (entry) => <span className="text-muted-foreground">{formatDate(entry.startedAt)}</span>,
  },
]

/* ─── Mobile: Compact Stats ─── */

function MobileStats({ overview }: { overview: StatsOverview }) {
  const correctRate =
    overview.totalQuestions > 0
      ? Math.round((overview.totalCorrect / overview.totalQuestions) * 100)
      : 0

  const items = [
    { label: 'セッション', value: overview.totalSessions, suffix: '' },
    { label: '平均', value: overview.avgScore, suffix: '%', colorClass: scoreColor(overview.avgScore) },
    { label: '正答率', value: correctRate, suffix: '%', colorClass: scoreColor(correctRate) },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:border dark:border-border dark:shadow-none">
          <p className="text-[11px] text-muted-foreground">{item.label}</p>
          <p className={cn('mt-0.5 text-xl font-bold tabular-nums tracking-tight', item.colorClass)}>
            <AnimatedNumber value={item.value} suffix={item.suffix} />
          </p>
        </div>
      ))}
    </div>
  )
}

/* ─── Loading Skeleton ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Mobile skeleton */}
      <div className="md:hidden space-y-4">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <div className="h-2.5 w-10 rounded bg-muted" />
              <div className="mt-2 h-5 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
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
      {/* Desktop skeleton */}
      <div className="hidden md:block space-y-6">
        <div>
          <div className="h-7 w-40 rounded bg-muted" />
          <div className="mt-2 h-4 w-64 rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="mt-3 h-8 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-5">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="mt-2 h-5 w-3/4 rounded bg-muted" />
              <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─── */

export default function Dashboard() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => api.get<ApiResponse<Subject[]>>('/subjects'),
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

  const workbooksQuery = useQuery({
    queryKey: queryKeys.workbooks.list({ published: 'true' }),
    queryFn: () =>
      api.get<ApiResponse<Workbook[]>>('/workbooks', { published: 'true' }),
  })

  const scoresQuery = useQuery({
    queryKey: queryKeys.stats.workbookScores,
    queryFn: () =>
      api.get<ApiResponse<WorkbookScore[]>>('/stats/workbook-scores', { limit: '5' }),
  })

  const isLoading = subjectsQuery.isLoading || workbooksQuery.isLoading
  const error = subjectsQuery.error || workbooksQuery.error

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorMessage message={error.message} />

  const overview = statsQuery.data?.data
  const subjects = subjectsQuery.data?.data ?? []
  const history = historyQuery.data?.data ?? []
  const allWorkbooks = workbooksQuery.data?.data ?? []
  const scores = scoresQuery.data?.data ?? []

  return (
    <div className="space-y-8">
      {/* ─── Mobile ─── */}
      <div className="md:hidden space-y-5">
        <QuickStartList
          subjects={subjects}
          workbooks={allWorkbooks}
          scores={scores}
        />
      </div>

      {/* ─── Desktop ─── */}
      <div className="hidden space-y-8 md:block">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="mt-1 text-muted-foreground">試験の進捗状況を確認できます。</p>
        </div>

        {overview && <StatsCards overview={overview} />}

        <section>
          <h2 className="mb-4 text-lg font-semibold">問題集</h2>
          <WorkbookGrid
            subjects={subjects}
            workbooks={allWorkbooks}
            scores={scores}
            selectedSubjectId={selectedSubjectId}
            onSubjectChange={setSelectedSubjectId}
          />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">最近の履歴</h2>
            <Link to="/stats" className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm">すべて表示</Link>
          </div>
          <ResponsiveTable
            data={history}
            columns={historyColumns}
            keyExtractor={(entry) => entry.id}
            rowLink={(entry) => `/stats/history/${entry.id}`}
            emptyMessage="試験履歴がまだありません。最初の試験を始めましょう！"
          />
        </section>
      </div>
    </div>
  )
}
