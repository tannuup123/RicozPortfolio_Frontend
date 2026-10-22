'use client'

/**
 * Legacy route alias: /ideas -> /demand/ideas.
 * Matches Vite route definition:
 *   <Route path="/ideas" element={<IdeasListPage />} />
 */

import Link from 'next/link'
import { IdeasListPage } from '../../../features/demand/IdeasListPage'

export default function IdeasAliasPage() {
  return <IdeasListPage LinkComponent={Link} />
}
