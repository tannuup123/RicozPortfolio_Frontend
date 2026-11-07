import React, { useState } from 'react'
import { Card, Button, Textarea, Badge } from '../../../components/ui'
import type { ApprovalResponse, ApprovalDecision } from '../../../api/demand'

interface ApprovalSectionProps {
    approvals: ApprovalResponse[]
    isLoading: boolean
    canApprove: boolean
    hasBusinessCase: boolean
    currentStatus: string
    onRecordDecision: (decision: ApprovalDecision, notes?: string) => Promise<void>
    isSubmitting: boolean
}

export function ApprovalSection({
    approvals,
    isLoading,
    canApprove,
    hasBusinessCase,
    currentStatus,
    onRecordDecision,
    isSubmitting,
}: ApprovalSectionProps) {
    const [selectedDecision, setSelectedDecision] = useState<ApprovalDecision | null>(null)
    const [notes, setNotes] = useState('')
    const [actionError, setActionError] = useState<string | null>(null)

    const isEligibleStatus = currentStatus === 'submitted' || currentStatus === 'in_review'
    const canMakeDecision = canApprove && isEligibleStatus

    const handleDecisionClick = (decision: ApprovalDecision) => {
        setSelectedDecision(decision)
        setNotes('')
        setActionError(null)
    }

    const cancelDecision = () => {
        setSelectedDecision(null)
        setNotes('')
        setActionError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDecision) return
        setActionError(null)

        if (!hasBusinessCase) {
            setActionError('A business case must be attached before approving or rejecting this idea.')
            return
        }

        try {
            await onRecordDecision(selectedDecision, notes.trim() || undefined)
            setSelectedDecision(null)
            setNotes('')
        } catch (err: unknown) {
            const error = err as { message?: string }
            setActionError(error.message || `Failed to record ${selectedDecision} decision.`)
        }
    }

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <Card className="p-6 space-y-5" data-testid="approval-section">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        ✓
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">Governance & Approval Decision</h3>
                </div>
                {approvals.length > 0 && (
                    <span className="text-xs text-gray-500 font-medium">
                        {approvals.length} decision {approvals.length === 1 ? 'record' : 'records'}
                    </span>
                )}
            </div>

            {/* Decision Action Form for Eligible Approvers */}
            {canMakeDecision && (
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Portfolio Decision Gateway
                    </span>

                    {!hasBusinessCase ? (
                        <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                            Approval is locked: Attach a Business Case with estimated costs and benefits first.
                        </p>
                    ) : selectedDecision ? (
                        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                            {actionError && (
                                <div className="p-2.5 text-xs rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                                    {actionError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Decision Notes / Rationale (Optional)
                                </label>
                                <Textarea
                                    rows={3}
                                    maxLength={2000}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={`Enter rationale for ${selectedDecision === 'approved' ? 'approving' : 'rejecting'} this demand item...`}
                                    data-testid="decision-notes-input"
                                />
                            </div>

                            <div className="flex justify-end items-center gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={cancelDecision} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    variant={selectedDecision === 'approved' ? 'primary' : 'danger'}
                                    isLoading={isSubmitting}
                                    data-testid="confirm-decision-btn"
                                >
                                    Confirm {selectedDecision === 'approved' ? 'Approval' : 'Rejection'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleDecisionClick('approved')}
                                data-testid="approve-idea-btn"
                            >
                                Approve Idea
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDecisionClick('rejected')}
                                data-testid="reject-idea-btn"
                            >
                                Reject Idea
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Audit Trail List */}
            <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Decision Audit Trail
                </span>

                {isLoading ? (
                    <div className="py-4 flex justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
                    </div>
                ) : approvals.length > 0 ? (
                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden" data-testid="audit-trail-list">
                        {approvals.map((approval) => (
                            <div key={approval.id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            tone={approval.decision === 'approved' ? 'success' : 'danger'}
                                            data-testid={`badge-${approval.decision}`}
                                        >
                                            {approval.decision.toUpperCase()}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            Decided on {formatDate(approval.created_at)}
                                        </span>
                                    </div>
                                    {approval.notes && (
                                        <p className="text-xs text-gray-700 italic pt-1 pl-0.5">
                                            &ldquo;{approval.notes}&rdquo;
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-mono">
                                    ID: {approval.id.slice(0, 8)}...
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 italic py-2">
                        No formal governance decisions recorded yet.
                    </p>
                )}
            </div>
        </Card>
    )
}
