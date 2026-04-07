import { useState } from 'react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'

export function ChoiceTips({ explanation, className }: { explanation: string; className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('ml-9 mt-1', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? '解説を閉じる' : '解説を開く'}
        className="flex min-h-[44px] items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.97] motion-safe:transition-[color,background-color,transform] motion-safe:duration-150"
      >
        <svg
          aria-hidden="true"
          className={cn(
            'h-3.5 w-3.5 shrink-0 motion-safe:transition-transform motion-safe:duration-200 ease-out',
            open && 'rotate-90',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        解説を見る
      </button>
      <div
        className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-250 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="mt-1 rounded-md border border-border/50 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <MarkdownRenderer content={explanation} />
          </div>
        </div>
      </div>
    </div>
  )
}
