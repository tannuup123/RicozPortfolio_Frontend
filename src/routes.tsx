/**
 * Route tree.
 *
 * Phase 1 scope only: the route structure matching architecture.md's page
 * hierarchy, rendering placeholder pages. Real page content is filled in
 * module-by-module in later phases (see implementation-plan.md).
 */

import { Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { DashboardPage } from './features/DashboardPage'
import { IdeaDetailPage } from './features/demand/IdeaDetailPage'
import { IdeasListPage } from './features/demand/IdeasListPage'
import { PortfolioDetailPage } from './features/portfolios/PortfolioDetailPage'
import { PortfolioListPage } from './features/portfolios/PortfolioListPage'
import { ProjectDetailPage } from './features/projects/ProjectDetailPage'
import { GoalsPage } from './features/strategy/GoalsPage'
import { UsersListPage } from './features/users/UsersListPage'

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
                element={
                    <ProtectedRoute>
                        <AppShell />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/strategy/goals" element={<GoalsPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/demand/ideas" element={<IdeasListPage />} />
                <Route path="/ideas" element={<IdeasListPage />} />
                <Route path="/demand/ideas/:ideaId" element={<IdeaDetailPage />} />
                <Route path="/ideas/:ideaId" element={<IdeaDetailPage />} />
                <Route path="/portfolios" element={<PortfolioListPage />} />
                <Route path="/portfolios/:portfolioId" element={<PortfolioDetailPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="/users" element={<UsersListPage />} />
            </Route>
        </Routes>
    )
}