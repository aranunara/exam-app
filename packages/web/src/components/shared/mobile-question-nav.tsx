import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MobileQuestionNavProps {
  currentIndex: number
  totalQuestions: number
  answers: Record<number, string[]>
  flags: Record<number, boolean>
  onNavigate: (index: number) => void
}

export function MobileQuestionNav({
  currentIndex,
  totalQuestions,
  answers,
  flags,
  onNavigate,
}: MobileQuestionNavProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {isExpanded && (
        <>
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[60vh] overflow-y-auto rounded-t-xl border-t bg-background p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">問題ナビゲーター</h3>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="閉じる"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const isAnswered = i in answers
                const isFlagged = !!flags[i]
                const isCurrent = i === currentIndex

                let btnStyle = 'bg-muted text-muted-foreground'
                if (isCurrent) {
                  btnStyle =
                    'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                } else if (isAnswered) {
                  btnStyle =
                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                }

                return (
                  <button
                    key={i}
                    onClick={() => {
                      onNavigate(i)
                      setIsExpanded(false)
                    }}
                    className={cn(
                      'relative flex h-10 w-full items-center justify-center rounded text-xs font-medium',
                      btnStyle,
                    )}
                  >
                    {i + 1}
                    {isFlagged && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-yellow-500" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-green-100 dark:bg-green-900" />
                回答済み
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative inline-block h-3 w-3 rounded bg-muted">
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-yellow-500" />
                </span>
                フラグ
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-primary" />
                現在
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              回答済み: {Object.keys(answers).length} / {totalQuestions}
              {Object.values(flags).filter(Boolean).length > 0 && ` | フラグ: ${Object.values(flags).filter(Boolean).length}`}
            </p>
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t bg-background px-4 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <button
          type="button"
          onClick={() => onNavigate(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="min-h-[44px] rounded-lg border px-4 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          前へ
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="min-h-[44px] rounded-lg bg-muted px-4 text-sm font-medium"
        >
          Q {currentIndex + 1}/{totalQuestions}
        </button>

        <button
          type="button"
          onClick={() => onNavigate(currentIndex + 1)}
          disabled={currentIndex >= totalQuestions - 1}
          className="min-h-[44px] rounded-lg border px-4 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  )
}
