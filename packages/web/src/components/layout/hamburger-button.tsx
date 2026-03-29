import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export const HamburgerButton = forwardRef<
  HTMLButtonElement,
  HamburgerButtonProps
>(({ isOpen, onClick, className }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls="mobile-drawer"
      aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden',
        className,
      )}
    >
      {isOpen ? (
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      )}
    </button>
  )
})

HamburgerButton.displayName = 'HamburgerButton'
