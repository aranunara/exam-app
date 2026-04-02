import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
  size = 'md',
}: ToggleSwitchProps) {
  const trackSize = size === 'sm' ? 'h-4 w-7' : 'h-5 w-9'
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const thumbTranslate = size === 'sm'
    ? checked ? 'translate-x-3.5' : 'translate-x-0.5'
    : checked ? 'translate-x-[18px]' : 'translate-x-0.5'

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full motion-safe:transition-colors motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        trackSize,
        checked
          ? 'bg-primary'
          : 'bg-muted-foreground/25',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 motion-safe:transition-transform motion-safe:duration-200',
          thumbSize,
          thumbTranslate,
        )}
      />
    </button>
  )

  if (!label) return control

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      {control}
      <span>{label}</span>
    </label>
  )
}
