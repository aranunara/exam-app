import { cn } from '@/lib/utils'

export type QuestionState = 'saved' | 'dirty' | 'new'

interface QuestionNavigatorProps {
  totalQuestions: number
  questionStates: Map<number, QuestionState>
  activeIndex: number | null
  onNavigate: (index: number) => void
}

function stateStyle(state: QuestionState | undefined, isActive: boolean): string {
  if (isActive) {
    return 'ring-2 ring-blue-500 ring-offset-1 ring-offset-background'
  }
  switch (state) {
    case 'saved':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    case 'dirty':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
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
}: QuestionNavigatorProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">問題ナビゲーター</h3>

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
                  'flex h-8 w-full items-center justify-center rounded text-xs font-medium transition-colors',
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
          <span className="inline-block h-3 w-3 rounded bg-green-100 dark:bg-green-900" />
          保存済み
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-yellow-100 dark:bg-yellow-900" />
          未保存の変更
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded border-2 border-dashed border-muted-foreground/40" />
          新規未保存
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded ring-2 ring-blue-500 ring-offset-1" />
          フォーカス中
        </div>
      </div>
    </div>
  )
}
