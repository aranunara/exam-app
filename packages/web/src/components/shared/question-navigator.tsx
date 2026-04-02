import { cn } from '@/lib/utils'

export type QuestionState = 'saved' | 'dirty' | 'new'

interface QuestionNavigatorProps {
  totalQuestions: number
  questionStates: Map<number, QuestionState>
  activeIndex: number | null
  onNavigate: (index: number) => void
  onTipsClick?: () => void
}

function stateStyle(state: QuestionState | undefined, isActive: boolean): string {
  if (isActive) {
    return 'ring-2 ring-info ring-offset-1 ring-offset-background'
  }
  switch (state) {
    case 'saved':
      return 'bg-success-muted text-success-foreground'
    case 'dirty':
      return 'bg-warning-muted text-flag-foreground'
    case 'new':
      return 'border-2 border-dashed border-muted-foreground/40 text-muted-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function QuestionNavigator({
  totalQuestions,
  questionStates,
  activeIndex,
  onNavigate,
  onTipsClick,
}: QuestionNavigatorProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">問題ナビゲーター</h3>
        {onTipsClick && (
          <button
            type="button"
            onClick={onTipsClick}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            Tips
          </button>
        )}
      </div>

      {totalQuestions === 0 ? (
        <p className="mb-3 text-xs text-muted-foreground">問題がありません</p>
      ) : (
        <div className="mb-3 grid grid-cols-5 gap-1">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const state = questionStates.get(i)
            const isActive = i === activeIndex
            const baseStyle = state === 'new'
              ? 'bg-transparent'
              : isActive
                ? 'bg-muted'
                : ''

            return (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate(i)}
                className={cn(
                  'flex h-10 w-full items-center justify-center rounded text-xs font-medium transition-colors',
                  baseStyle,
                  stateStyle(state, isActive),
                )}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      )}

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-success-muted" />
          保存済み
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-warning-muted" />
          未保存の変更
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border-2 border-dashed border-muted-foreground/40" />
          新規未保存
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded ring-2 ring-info ring-offset-1" />
          フォーカス中
        </div>
      </div>

    </div>
  )
}
