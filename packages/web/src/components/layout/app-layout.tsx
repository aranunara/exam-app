import { Outlet, Link, useLocation } from 'react-router'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { useTheme } from '@/components/shared/theme-provider'

const navItems = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/stats', label: '統計' },
]

const adminNavItems = [
  { to: '/admin/categories', label: 'カテゴリ' },
  { to: '/admin/question-sets', label: '問題セット' },
  { to: '/admin/import-export', label: 'インポート/エクスポート' },
]

export function AppLayout() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        メインコンテンツにスキップ
      </a>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
          <Link to="/dashboard" className="mr-8 text-lg font-bold">
            Exam App
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  location.pathname.startsWith(item.to)
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/admin/categories"
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isAdmin
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              管理
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="テーマ切替"
            >
              {theme === 'light' ? (
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              )}
            </button>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>
      {isAdmin && (
        <div className="border-b bg-muted/30">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  location.pathname === item.to ||
                  (item.to === '/admin/question-sets' &&
                    location.pathname.startsWith('/admin/question-sets'))
                    ? 'bg-background font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
