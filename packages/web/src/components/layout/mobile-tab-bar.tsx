import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { useMemo, type ComponentType } from 'react'

interface Tab {
  to: string
  label: string
  icon: ComponentType<{ active?: boolean }>
  matchPrefixes: string[]
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      {!active && <polyline points="9 22 9 12 15 12 15 22" />}
    </svg>
  )
}

function HistoryTabIcon({ active }: { active?: boolean }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function SettingsIcon({ active }: { active?: boolean }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

const tabs: Tab[] = [
  { to: '/dashboard', label: 'ホーム', icon: HomeIcon, matchPrefixes: ['/dashboard', '/exams'] },
  { to: '/stats', label: '履歴', icon: HistoryTabIcon, matchPrefixes: ['/stats'] },
  { to: '/admin/subjects', label: '管理', icon: SettingsIcon, matchPrefixes: ['/admin'] },
]

function isQuestionScreen(path: string): boolean {
  return (
    (path.startsWith('/exam/') || path.startsWith('/practice/')) &&
    !path.endsWith('/result')
  )
}

function getActiveIndex(pathname: string): number {
  const index = tabs.findIndex((tab) =>
    tab.matchPrefixes.some((m) => pathname.startsWith(m)),
  )
  return index === -1 ? 0 : index
}

function SlidingIndicator({ pathname }: { pathname: string }) {
  const activeIndex = useMemo(() => getActiveIndex(pathname), [pathname])

  return (
    <span
      className="absolute top-0 left-0 flex h-[2px] w-1/3 justify-center motion-safe:transition-transform motion-safe:duration-300 ease-[var(--ease-spring-bouncy)]"
      style={{ transform: `translateX(${activeIndex * 100}%)` }}
    >
      <span className="h-full w-8 rounded-full bg-primary" />
    </span>
  )
}

export function MobileTabBar() {
  const { pathname } = useLocation()

  if (isQuestionScreen(pathname)) {
    return null
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="relative flex h-[52px]">
        <SlidingIndicator pathname={pathname} />
        {tabs.map((tab) => {
          const isActive = tab.matchPrefixes.some((m) => pathname.startsWith(m))
          const Icon = tab.icon

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-[2px]',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon active={isActive} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
