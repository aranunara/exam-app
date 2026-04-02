import { forwardRef } from 'react'
import { Link, useLocation } from 'react-router'
import { useTheme } from '@/components/shared/theme-provider'
import { navItems, adminNavItems } from './nav-config'
import { cn } from '@/lib/utils'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileDrawer = forwardRef<HTMLDivElement, MobileDrawerProps>(
  ({ isOpen, onClose }, ref) => {
    const location = useLocation()
    const { theme, toggleTheme } = useTheme()
    const isAdmin = location.pathname.startsWith('/admin')

    return (
      <>
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          ref={ref}
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="ナビゲーションメニュー"
          className={cn(
            'fixed inset-y-0 right-0 z-50 w-72 bg-background shadow-xl transition-transform duration-300 md:hidden',
            isOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto">
            <div className="border-b px-4 py-4">
              <p className="text-sm font-semibold">メニュー</p>
            </div>

            <nav className="flex-1 px-4 py-4">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={cn(
                      'block rounded-md px-3 py-2.5 text-sm transition-colors',
                      location.pathname.startsWith(item.to)
                        ? 'bg-accent font-medium text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/admin/subjects"
                  onClick={onClose}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm transition-colors',
                    isAdmin
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  管理
                </Link>
              </div>

              {isAdmin && (
                <div className="mt-4 border-t pt-4">
                  <p className="mb-2 px-3 text-xs font-medium uppercase text-muted-foreground">
                    管理メニュー
                  </p>
                  <div className="space-y-1">
                    {adminNavItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={cn(
                          'block rounded-md px-3 py-2.5 text-sm transition-colors',
                          location.pathname === item.to ||
                            (item.to === '/admin/workbooks' &&
                              location.pathname.startsWith(
                                '/admin/workbooks',
                              ))
                            ? 'bg-background font-medium text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            <div className="border-t px-4 py-4">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
                {theme === 'light' ? 'ダークモード' : 'ライトモード'}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  },
)

MobileDrawer.displayName = 'MobileDrawer'
