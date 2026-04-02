import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatScore, formatDate, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ErrorMessage } from '@/components/shared/error-message'
import {
  ResponsiveTable,
  type ColumnDef,
} from '@/components/shared/responsive-table'
import type {
  ApiResponse,
  Subject,
  Workbook,
  HistoryEntry,
} from '@/types'

/* ─── History Columns ─── */

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

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  if (hasFilter) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        この条件に一致する履歴がありません。
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold">履歴がまだありません</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        問題集を解くと、ここに結果が表示されます。
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        問題を解く
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

/* ─── Loading ─── */

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="読み込み中">
      <div className="flex gap-3">
        <div className="h-10 w-36 rounded-xl bg-muted/40" />
        <div className="h-10 w-48 rounded-xl bg-muted/40" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/40" />
        ))}
      </div>
    </div>
  )
}

/* ─── Filter Bar ─── */

function HistoryFilterBar({
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

export default function HistoryPage() {
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

  useEffect(() => {
    setPage(1)
  }, [subjectId, workbookId])

  const subjectsQuery = useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => api.get<ApiResponse<Subject[]>>('/subjects'),
  })

  const allWorkbooksQuery = useQuery({
    queryKey: queryKeys.workbooks.list({ published: 'true' }),
    queryFn: () =>
      api.get<ApiResponse<Workbook[]>>('/workbooks', { published: 'true' }),
  })

  const allWorkbooks = allWorkbooksQuery.data?.data ?? []

  const handleSubjectChange = (id: string) => {
    setSubjectId(id)
    if (id && workbookId) {
      const wb = allWorkbooks.find((w) => w.id === workbookId)
      if (wb && wb.subjectId !== id) {
        setWorkbookId('')
      }
    }
  }

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
  const history = historyQuery.data?.data ?? []
  const historyMeta = historyQuery.data?.meta
  const totalPages = historyMeta
    ? Math.ceil(historyMeta.total / historyMeta.limit)
    : 1

  const isInitialLoading = historyQuery.isLoading && !hasFilter && page === 1

  if (isInitialLoading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight">履歴</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          過去の試験結果を確認できます。
        </p>
      </div>

      <HistoryFilterBar
        subjects={allSubjects}
        workbooks={allWorkbooks}
        subjectId={subjectId}
        workbookId={workbookId}
        onSubjectChange={handleSubjectChange}
        onWorkbookChange={setWorkbookId}
      />

      {historyQuery.isLoading ? (
        <div className="animate-pulse space-y-2" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : historyQuery.error ? (
        <ErrorMessage message={historyQuery.error.message} />
      ) : history.length === 0 ? (
        <EmptyState hasFilter={hasFilter} />
      ) : (
        <div className="space-y-4">
          <ResponsiveTable
            data={history}
            columns={historyColumns}
            keyExtractor={(entry) => entry.id}
            rowLink={(entry) => `/stats/history/${entry.id}`}
            emptyMessage=""
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
    </div>
  )
}
