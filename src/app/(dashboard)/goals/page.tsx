'use client'

/**
 * Legacy route alias: /goals -> /strategy/goals.
 * Matches Vite route definition:
 *   <Route path="/goals" element={<GoalsPage />} />
 */

import { GoalsPage } from '../../../features/strategy/GoalsPage'

export default function GoalsAliasPage() {
  return <GoalsPage />
}
