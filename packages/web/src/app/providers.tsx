import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { queryClient } from '@/lib/query-client'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { setAuthTokenGetter } from '@/lib/api-client'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

function AuthTokenSync({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth()

  useEffect(() => {
    setAuthTokenGetter(() => getToken())
  }, [getToken])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthTokenSync>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryClientProvider>
      </AuthTokenSync>
    </ClerkProvider>
  )
}
