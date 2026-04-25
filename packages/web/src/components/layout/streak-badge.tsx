import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { calculateStreakDays } from '@/lib/calculate-streak'
import type { ApiResponse, HistoryEntry } from '@/types'

function FlameIcon() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M13.3 2.2c.3.7.2 1.5-.3 2.1l-1 1.3c-.8 1-1.2 2.3-1 3.6l.1.6c.2 1.1 1 2 2.1 2.3 1.4.3 2.7-.6 3-2 .1-.6 0-1.2-.3-1.7-.2-.4 0-.9.4-1.1.3-.1.7 0 .9.3 1.9 2.8 2.3 6.4.8 9.5a7.7 7.7 0 0 1-14-4.6c0-3.2 1.9-6 4.7-7.4l3.4-1.6c.4-.2.9 0 1.1.3l.1.4Z" />
    </svg>
  )
}

export function StreakBadge() {
  const { data } = useQuery({
    queryKey: ['streak-history'] as const,
    queryFn: () =>
      api.get<ApiResponse<HistoryEntry[]>>('/stats/history', {
        page: '1',
        limit: '100',
      }),
    staleTime: 1000 * 60 * 5,
  })

  const days = calculateStreakDays(
    (data?.data ?? []).map((h) => h.startedAt),
  )

  if (days === 0) return null

  return (
    <Link
      to="/stats"
      className="group inline-flex items-center justify-center p-1 -m-1"
      aria-label={`${days}日連続学習中。履歴を開く`}
    >
      <span className="inline-flex items-center gap-1 rounded-full bg-warning-muted px-2.5 py-1 text-xs font-bold text-warning-foreground motion-safe:transition-transform motion-safe:group-active:scale-95">
        <FlameIcon />
        <span className="tabular-nums">{days}</span>
      </span>
    </Link>
  )
}
