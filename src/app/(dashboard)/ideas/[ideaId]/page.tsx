'use client'

/**
 * Legacy route alias: /ideas/[ideaId] -> /demand/ideas/[ideaId].
 * Matches Vite route definition:
 *   <Route path="/ideas/:ideaId" element={<IdeaDetailPage />} />
 */

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { IdeaDetailPage } from '../../../../features/demand/IdeaDetailPage'

export default function IdeaDetailAliasPage() {
  const params = useParams<{ ideaId: string }>()
  const router = useRouter()

  return (
    <IdeaDetailPage
      ideaIdProp={params.ideaId}
      onNavigateBack={() => router.push('/demand/ideas')}
      LinkComponent={Link}
    />
  )
}
