import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { useMobileDrawer } from '@/hooks/use-mobile-drawer'
import { useSidebarContext } from './sidebar-context'
import { HamburgerButton } from './hamburger-button'
import { MobileDrawer } from './mobile-drawer'
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

      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur md:hidden">
        <div className="flex h-12 items-center px-4">
          <Link to="/dashboard" className="text-base font-bold">
            Exam App
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <HamburgerButton
              ref={drawer.triggerRef}
              isOpen={drawer.isOpen}
              onClick={drawer.toggle}
            />
          </div>
        </div>
      </header>

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
      <AppLayoutInner />
    </SidebarProvider>
  )
}
