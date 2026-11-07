import React, { useState } from 'react'
import { Modal, Button, Select } from '../../../components/ui'
import type { PortfolioSummary } from '../../../api/portfolios'

interface ConvertIdeaModalProps {
    isOpen: boolean
    onClose: () => void
    onConvert: (portfolioId?: string | null) => Promise<void>
    portfolios: PortfolioSummary[]
    isLoadingPortfolios: boolean
    isConverting: boolean
    ideaTitle: string
}

export function ConvertIdeaModal({
    isOpen,
    onClose,
    onConvert,
    portfolios,
    isLoadingPortfolios,
    isConverting,
    ideaTitle,
}: ConvertIdeaModalProps) {
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            await onConvert(selectedPortfolioId || null)
        } catch (err: unknown) {
            const errorObj = err as { message?: string }
            setError(errorObj.message || 'Failed to convert idea to project.')
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Convert Approved Idea to Project"
        >
            <div data-testid="convert-idea-modal">
                <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                        {error}
                    </div>
                )}

                <div className="rounded-lg bg-emerald-50/70 p-3.5 border border-emerald-100 text-xs text-emerald-900 space-y-1">
                    <p className="font-semibold">Ready for Execution</p>
                    <p>
                        Converting <span className="font-medium">&ldquo;{ideaTitle}&rdquo;</span> will establish a new Project in initial status <code>planned</code> with permanent idea traceability.
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Target Portfolio (Optional)
                    </label>
                    {isLoadingPortfolios ? (
                        <div className="py-2 text-xs text-gray-500">Loading portfolios...</div>
                    ) : (
                        <Select
                            value={selectedPortfolioId}
                            onChange={(e) => setSelectedPortfolioId(e.target.value)}
                            data-testid="target-portfolio-select"
                        >
                            <option value="">No Portfolio (Unassigned Project)</option>
                            {portfolios.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </Select>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        You can associate this project with an active strategic portfolio now or assign it later.
                    </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isConverting}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        isLoading={isConverting}
                        data-testid="confirm-convert-btn"
                    >
                        Convert to Project
                    </Button>
                </div>
            </form>
            </div>
        </Modal>
    )
}
