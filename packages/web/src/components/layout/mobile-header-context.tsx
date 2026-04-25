import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type HeaderVariant = 'default' | 'compact' | 'hidden'

export interface HeaderConfig {
  variant?: HeaderVariant
  title?: string
  backTo?: string
}

interface ContextValue {
  config: HeaderConfig
  register: (next: HeaderConfig | null) => void
}

const MobileHeaderContext = createContext<ContextValue | null>(null)

export function MobileHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>({})

  const register = useCallback((next: HeaderConfig | null) => {
    setConfig(next ?? {})
  }, [])

  const value = useMemo(() => ({ config, register }), [config, register])

  return (
    <MobileHeaderContext.Provider value={value}>
      {children}
    </MobileHeaderContext.Provider>
  )
}

export function useMobileHeaderConfig(): HeaderConfig {
  const ctx = useContext(MobileHeaderContext)
  if (!ctx) {
    throw new Error(
      'useMobileHeaderConfig must be used within MobileHeaderProvider',
    )
  }
  return ctx.config
}

export function useMobileHeader(config: HeaderConfig) {
  const ctx = useContext(MobileHeaderContext)
  if (!ctx) {
    throw new Error('useMobileHeader must be used within MobileHeaderProvider')
  }
  const { register } = ctx
  const { variant, title, backTo } = config

  useEffect(() => {
    register({ variant, title, backTo })
    return () => register(null)
  }, [register, variant, title, backTo])
}
