import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useMobileDrawer } from '@/hooks/use-mobile-drawer'
import { useSidebarContext } from './sidebar-context'
import { MobileDrawer } from './mobile-drawer'
import { MobileHeader } from './mobile-header'
import { MobileHeaderProvider } from './mobile-header-context'
import { Sidebar } from './sidebar'
import { SidebarProvider } from './sidebar-provider'
import { MobileTabBar } from './mobile-tab-bar'
import { cn } from '@/lib/utils'

function isQuestionScreen(path: string): boolean {
  return (
    (path.startsWith('/exam/') || path.startsWith('/practice/')) &&
    !path.endsWith('/result')
  )
}

function AppLayoutInner() {
  const location = useLocation()
  const drawer = useMobileDrawer()
  const { isExpanded } = useSidebarContext()

  const showTabBar = !isQuestionScreen(location.pathname)

  useEffect(() => {
    drawer.close()
  }, [location.pathname, drawer.close])

  return (
    <div
      className={cn(
        'min-h-screen bg-background',
        'motion-safe:transition-[padding-left] motion-safe:duration-250 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)]',
        isExpanded ? 'md:pl-60' : 'md:pl-16',
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        メインコンテンツにスキップ
      </a>

      <Sidebar />

      <MobileHeader
        drawerOpen={drawer.isOpen}
        onDrawerToggle={drawer.toggle}
        triggerRef={drawer.triggerRef}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          'mx-auto max-w-7xl px-4 py-6',
          showTabBar && 'pb-20 md:pb-6',
        )}
      >
        <Outlet />
      </main>

      <MobileTabBar />

      <MobileDrawer
        ref={drawer.drawerRef}
        isOpen={drawer.isOpen}
        onClose={drawer.close}
      />
    </div>
  )
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <MobileHeaderProvider>
        <AppLayoutInner />
      </MobileHeaderProvider>
    </SidebarProvider>
  )
}
