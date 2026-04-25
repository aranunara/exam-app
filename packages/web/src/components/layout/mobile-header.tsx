import { Link } from 'react-router'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import type { Ref } from 'react'
import { HamburgerButton } from './hamburger-button'
import { StreakBadge } from './streak-badge'
import { useMobileHeaderConfig } from './mobile-header-context'
import { useGreeting } from '@/hooks/use-greeting'

interface Props {
  drawerOpen: boolean
  onDrawerToggle: () => void
  triggerRef: Ref<HTMLButtonElement>
}

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function Greeting() {
  const { text, displayName } = useGreeting()
  return (
    <p className="min-w-0 truncate text-[15px] font-bold leading-tight">
      {displayName ? `${text}、${displayName}さん` : text}
    </p>
  )
}

function CompactHeader({
  title,
  backTo,
  drawerOpen,
  onDrawerToggle,
  triggerRef,
}: {
  title?: string
  backTo?: string
} & Props) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur md:hidden">
      <div className="flex h-12 items-center gap-1 pl-1 pr-2">
        {backTo ? (
          <Link
            to={backTo}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground active:bg-muted"
            aria-label="戻る"
          >
            <BackIcon />
          </Link>
        ) : (
          <span className="w-2" aria-hidden="true" />
        )}
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold">
          {title ?? ''}
        </h1>
        <div className="flex items-center gap-1">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <HamburgerButton
            ref={triggerRef}
            isOpen={drawerOpen}
            onClick={onDrawerToggle}
          />
        </div>
      </div>
    </header>
  )
}

function DefaultHeader({
  drawerOpen,
  onDrawerToggle,
  triggerRef,
}: Props) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur md:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Greeting />
        <div className="ml-auto flex items-center gap-2">
          <StreakBadge />
          <SignedIn>
            <UserButton />
          </SignedIn>
          <HamburgerButton
            ref={triggerRef}
            isOpen={drawerOpen}
            onClick={onDrawerToggle}
          />
        </div>
      </div>
    </header>
  )
}

export function MobileHeader(props: Props) {
  const { variant = 'default', title, backTo } = useMobileHeaderConfig()

  if (variant === 'hidden') return null
  if (variant === 'compact') {
    return <CompactHeader title={title} backTo={backTo} {...props} />
  }
  return <DefaultHeader {...props} />
}
