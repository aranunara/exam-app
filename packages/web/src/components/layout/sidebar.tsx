import { cn } from '@/lib/utils'
import { useSidebarContext } from './sidebar-context'
import { SidebarNav } from './sidebar-nav'
import { SidebarFooter } from './sidebar-footer'

export function Sidebar() {
  const { isExpanded, setHovered } = useSidebarContext()

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-sidebar-border bg-sidebar print:hidden md:flex',
        'motion-safe:transition-[width] motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)]',
        'will-change-[width]',
        isExpanded ? 'w-60' : 'w-16',
      )}
    >
      <div className="flex h-14 shrink-0 items-center px-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          E
        </div>
        <span
          className={cn(
            'ml-3 text-lg font-bold whitespace-nowrap text-sidebar-foreground motion-safe:transition-opacity duration-200',
            isExpanded ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          Exam App
        </span>
      </div>

      <SidebarNav />
      <SidebarFooter />
    </aside>
  )
}
