import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { useSidebarContext } from './sidebar-context'
import { sidebarNavGroups } from './nav-config'

export function SidebarNav() {
  const location = useLocation()
  const { isExpanded } = useSidebarContext()

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
      {sidebarNavGroups.map((group, groupIdx) => (
        <div key={group.label || groupIdx} className={cn(groupIdx > 0 && 'mt-6')}>
          {group.label && (
            <p
              className={cn(
                'mb-2 px-3 text-xs font-medium uppercase text-sidebar-foreground/60 motion-safe:transition-opacity duration-200',
                isExpanded ? 'opacity-100' : 'opacity-0',
              )}
            >
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.to !== '/dashboard' &&
                  location.pathname.startsWith(item.to))
              const Icon = item.icon

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={isExpanded ? undefined : item.label}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-md px-3 text-sm whitespace-nowrap motion-safe:transition-colors duration-150',
                    isActive
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  )}
                >
                  {Icon && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <Icon />
                    </span>
                  )}
                  <span
                    className={cn(
                      'motion-safe:transition-opacity duration-200',
                      isExpanded
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
