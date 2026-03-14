import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import { formatScore, formatDate } from '@/lib/format'
import { ErrorMessage } from '@/components/shared/error-message'
import type {
  ApiResponse,
  Category,
  HistoryEntry,
  StatsOverview,
} from '@/types'

function StatsCards({ overview }: { overview: StatsOverview }) {
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
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
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

function CategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        カテゴリがまだありません。
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/exams/${category.id}`}
          className="group rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/50"
        >
          <h3 className="font-semibold group-hover:text-primary">
            {category.name}
          </h3>
          {category.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}

function RecentHistory({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        試験履歴がまだありません。最初の試験を始めましょう！
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th scope="col" className="px-4 py-3 text-left font-medium">問題セット</th>
            <th scope="col" className="px-4 py-3 text-left font-medium">カテゴリ</th>
            <th scope="col" className="px-4 py-3 text-left font-medium">モード</th>
            <th scope="col" className="px-4 py-3 text-left font-medium">スコア</th>
            <th scope="col" className="px-4 py-3 text-left font-medium">日付</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-b last:border-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3 font-medium">
                {entry.questionSetTitle}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {entry.categoryName}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    entry.mode === 'exam'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {entry.mode === 'exam' ? '実戦' : '演習'}
                </span>
              </td>
              <td className="px-4 py-3">
                {entry.scorePercent !== null
                  ? formatScore(entry.scorePercent)
                  : '-'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(entry.startedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-muted/50" />
        ))}
      </div>
      <div className="h-6 w-32 rounded bg-muted/50" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border bg-muted/50" />
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => api.get<ApiResponse<Category[]>>('/categories'),
  })

  const statsQuery = useQuery({
    queryKey: queryKeys.stats.overview,
    queryFn: () => api.get<ApiResponse<StatsOverview>>('/stats/overview'),
  })

  const historyQuery = useQuery({
    queryKey: queryKeys.stats.history(1),
    queryFn: () =>
      api.get<ApiResponse<HistoryEntry[]>>('/stats/history', {
        page: '1',
        limit: '5',
      }),
  })

  const isLoading =
    categoriesQuery.isLoading ||
    statsQuery.isLoading ||
    historyQuery.isLoading

  const error =
    categoriesQuery.error || statsQuery.error || historyQuery.error

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorMessage message={error.message} />
  }

  const overview = statsQuery.data?.data
  const categories = categoriesQuery.data?.data ?? []
  const history = historyQuery.data?.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="mt-1 text-muted-foreground">
          試験の進捗状況を確認できます。
        </p>
      </div>

      {overview && <StatsCards overview={overview} />}

      <section>
        <h2 className="mb-4 text-lg font-semibold">カテゴリ</h2>
        <CategoryList categories={categories} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近の履歴</h2>
          <Link
            to="/stats"
            className="text-sm text-primary hover:underline"
          >
            すべて表示
          </Link>
        </div>
        <RecentHistory entries={history} />
      </section>
    </div>
  )
}
