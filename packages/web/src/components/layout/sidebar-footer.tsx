import { SignedIn, UserButton } from '@clerk/clerk-react'
import { useTheme } from '@/components/shared/theme-provider'
import { cn } from '@/lib/utils'
import { useSidebarContext } from './sidebar-context'
import { SunIcon, MoonIcon, PinIcon } from './sidebar-icons'

export function SidebarFooter() {
  const { isExpanded, isPinned, togglePin } = useSidebarContext()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
      <button
        onClick={toggleTheme}
        aria-label={isExpanded ? undefined : 'テーマ切替'}
        className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm whitespace-nowrap text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground motion-safe:transition-colors duration-150"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </span>
        <span
          className={cn(
            'motion-safe:transition-opacity duration-200',
            isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          {theme === 'light' ? 'ダークモード' : 'ライトモード'}
        </span>
      </button>

      <button
        onClick={togglePin}
        aria-label={isExpanded ? undefined : 'サイドバーを固定'}
        className={cn(
          'flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm whitespace-nowrap motion-safe:transition-colors duration-150',
          isPinned
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        )}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <PinIcon />
        </span>
        <span
          className={cn(
            'motion-safe:transition-opacity duration-200',
            isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          {isPinned ? '固定解除' : '固定'}
        </span>
      </button>

      <SignedIn>
        <div className="flex h-10 items-center px-3">
          <UserButton />
        </div>
      </SignedIn>
    </div>
  )
}
