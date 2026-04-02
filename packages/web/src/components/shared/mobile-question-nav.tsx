import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MobileQuestionNavProps {
  currentIndex: number
  totalQuestions: number
  answers: Record<number, string[]>
  onNavigate: (index: number) => void
  onComplete?: () => void
  showCompleteButton?: boolean
  onSubmitAnswer?: () => void
  canSubmit?: boolean
  isSubmitting?: boolean
}

export function MobileQuestionNav({
  currentIndex,
  totalQuestions,
  answers,
  onNavigate,
  onComplete,
  showCompleteButton,
  onSubmitAnswer,
  canSubmit,
  isSubmitting,
}: MobileQuestionNavProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!isExpanded) setShowConfirm(false)
  }, [isExpanded])

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
                const isCurrent = i === currentIndex

                let btnStyle = 'bg-muted text-muted-foreground'
                if (isCurrent) {
                  btnStyle =
                    'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                } else if (isAnswered) {
                  btnStyle =
                    'bg-success-muted text-success-foreground'
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
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-success-muted" />
                回答済み
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-primary" />
                現在
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              回答済み: {Object.keys(answers).length} / {totalQuestions}
            </p>

            {onComplete && (
              <div className="mt-3 border-t pt-3">
                {showConfirm ? (
                  <div className="space-y-2">
                    {totalQuestions - Object.keys(answers).length > 0 && (
                      <p className="text-center text-sm text-warning-foreground">
                        未回答: {totalQuestions - Object.keys(answers).length}問
                      </p>
                    )}
                    <p className="text-center text-sm text-muted-foreground">
                      提出しますか？
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onComplete()
                        setShowConfirm(false)
                        setIsExpanded(false)
                      }}
                      className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      はい、提出する
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirm(false)}
                      className="w-full rounded-lg border py-2.5 text-sm hover:bg-muted"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    提出
                  </button>
                )}
              </div>
            )}
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

        {onSubmitAnswer && canSubmit ? (
          <button
            type="button"
            onClick={onSubmitAnswer}
            disabled={isSubmitting}
            className="min-h-[44px] rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
          >
            {isSubmitting ? '送信中...' : '答え合わせ'}
          </button>
        ) : showCompleteButton && onComplete ? (
          <button
            type="button"
            onClick={onComplete}
            className="min-h-[44px] rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97]"
          >
            結果を見る
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate(currentIndex + 1)}
            disabled={currentIndex >= totalQuestions - 1}
            className="min-h-[44px] rounded-lg border px-4 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            次へ
          </button>
        )}
      </div>
    </div>
  )
}
