/**
 * Application root.
 *
 * Phase 1 scope only: wires up the providers (React Query, Auth) and the
 * router. bootstrapAuth is called once on mount as a stub silent-refresh
 * check — see auth/bootstrapAuth.ts.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider, useAuth } from './auth/AuthContext'
import { bootstrapAuth } from './auth/bootstrapAuth'
import { AppRoutes } from './routes'

const queryClient = new QueryClient()

function AppBootstrap({ children }: { children: ReactNode }) {
  const { setSession, setIsLoading } = useAuth()

  useEffect(() => {
    void bootstrapAuth({ setSession, setIsLoading })
  }, [setSession, setIsLoading])

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppBootstrap>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppBootstrap>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App