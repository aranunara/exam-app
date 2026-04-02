import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CollapsibleProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function Collapsible({
  open,
  onOpenChange,
  title,
  badge,
  actions,
  children,
  className,
}: CollapsibleProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border bg-card', className)}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <svg
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200',
            open && 'rotate-90',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="shrink-0 font-semibold">{title}</span>
        {badge && (
          <span className="min-w-0 flex-1 truncate" onClick={(e) => e.stopPropagation()}>
            {badge}
          </span>
        )}
        {actions && (
          <span
            className="hidden shrink-0 items-center gap-2 sm:flex"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </span>
        )}
      </button>
      <div
        className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
