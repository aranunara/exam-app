import { cn } from '@/lib/utils'

export function LoadingSpinner({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  return (
    <div role="status" aria-label={label ?? '読み込み中'} className="flex items-center gap-3">
      <div
        className={cn(
          'h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent',
          className,
        )}
      />
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className="sr-only">{label ?? '読み込み中'}</span>
    </div>
  )
}
