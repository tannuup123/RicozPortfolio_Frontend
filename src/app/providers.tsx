'use client'

/**
 * Application-wide providers for the Next.js App Router.
 *
 * Auth phase: adds AuthProvider and AppBootstrap (silent-refresh on mount).
 * The access token is kept in-memory only inside AuthContext — it is never
 * written to localStorage or sessionStorage. See architecture.md §5.
 *
 * AppBootstrap must live *inside* AuthProvider so it can read setSession /
 * setIsLoading from context. It is a render-less component whose only job is
 * to call bootstrapAuth once on mount.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'

import { AuthProvider, useAuth } from '../auth/AuthContext'
import { bootstrapAuth } from '../auth/bootstrapAuth'

function AppBootstrap({ children }: { children: ReactNode }) {
  const { setSession, setIsLoading } = useAuth()

  useEffect(() => {
    void bootstrapAuth({ setSession, setIsLoading })
    // setSession and setIsLoading are stable useCallback/useState setters —
    // they will not change between renders, so this effect runs exactly once.
  }, [setSession, setIsLoading])

  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppBootstrap>{children}</AppBootstrap>
      </AuthProvider>
    </QueryClientProvider>
  )
}
