/**
 * Application root.
 *
 * Phase 1 scope only: wires up the providers (React Query, Auth) and the
 * router. bootstrapAuth is called once on mount as a stub silent-refresh
 * check — see auth/bootstrapAuth.ts.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from './auth/AuthContext'
import { bootstrapAuth } from './auth/bootstrapAuth'
import { AppRoutes } from './routes'

const queryClient = new QueryClient()

function App() {
  useEffect(() => {
    void bootstrapAuth()
  }, [])

  return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
  )
}

export default App