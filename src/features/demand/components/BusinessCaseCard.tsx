import React, { useState } from 'react'
import { Card, Button, Input } from '../../../components/ui'
import type { BusinessCaseResponse, BusinessCaseCreateRequest, BusinessCaseUpdateRequest } from '../../../api/demand'

interface BusinessCaseCardProps {
    businessCase: BusinessCaseResponse | null
    isLoading: boolean
    canManage: boolean
    onSave: (payload: BusinessCaseCreateRequest | BusinessCaseUpdateRequest) => Promise<void>
    isSaving: boolean
}

export function BusinessCaseCard({
    businessCase,
    isLoading,
    canManage,
    onSave,
    isSaving,
}: BusinessCaseCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [costInput, setCostInput] = useState(businessCase ? String(businessCase.estimated_cost) : '')
    const [benefitInput, setBenefitInput] = useState(businessCase ? String(businessCase.estimated_benefit) : '')
    const [formError, setFormError] = useState<string | null>(null)

    // Sync input when businessCase loads or editing begins
    const startEditing = () => {
        setCostInput(businessCase ? String(businessCase.estimated_cost) : '')
        setBenefitInput(businessCase ? String(businessCase.estimated_benefit) : '')
        setFormError(null)
        setIsEditing(true)
    }

    const cancelEditing = () => {
        setIsEditing(false)
        setFormError(null)
    }

    // Live preview ROI calculation: (benefit - cost) / cost
    const numCost = parseFloat(costInput)
    const numBenefit = parseFloat(benefitInput)
    let previewRoi: number | null = null
    if (!isNaN(numCost) && !isNaN(numBenefit) && numCost > 0) {
        previewRoi = Math.round(((numBenefit - numCost) / numCost) * 100) / 100
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)

        const cost = parseFloat(costInput)
        const benefit = parseFloat(benefitInput)

        if (isNaN(cost) || cost < 0) {
            setFormError('Estimated cost must be a valid non-negative number.')
            return
        }

        if (isNaN(benefit) || benefit < 0) {
            setFormError('Estimated benefit must be a valid non-negative number.')
            return
        }

        try {
            await onSave({
                estimated_cost: cost,
                estimated_benefit: benefit,
            })
            setIsEditing(false)
        } catch (err: unknown) {
            const error = err as { message?: string }
            setFormError(error.message || 'Failed to save business case.')
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(val)
    }

    const formatRoi = (roiVal: number | null | undefined) => {
        if (roiVal === null || roiVal === undefined) return 'N/A (Zero Cost)'
        const percentage = Math.round(roiVal * 100)
        return `${percentage >= 0 ? '+' : ''}${percentage}%`
    }

    return (
        <Card className="p-6 space-y-4" data-testid="business-case-card">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        ROI
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">Business Case & Financial Justification</h3>
                </div>
                {canManage && !isEditing && (
                    <Button
                        size="sm"
                        variant={businessCase ? 'secondary' : 'primary'}
                        onClick={startEditing}
                        data-testid="edit-business-case-btn"
                    >
                        {businessCase ? 'Edit Business Case' : 'Attach Business Case'}
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="py-6 flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
                </div>
            ) : isEditing ? (
                <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
                    {formError && (
                        <div className="p-3 text-xs rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Estimated Cost ($)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                required
                                value={costInput}
                                onChange={(e) => setCostInput(e.target.value)}
                                placeholder="e.g. 50000"
                                data-testid="cost-input"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Estimated Benefit ($)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                required
                                value={benefitInput}
                                onChange={(e) => setBenefitInput(e.target.value)}
                                placeholder="e.g. 125000"
                                data-testid="benefit-input"
                            />
                        </div>
                    </div>

                    {/* Live Preview Calculation */}
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex justify-between items-center text-xs">
                        <span className="text-gray-600">Calculated Projected ROI Preview:</span>
                        <span className={`font-semibold ${previewRoi !== null && previewRoi >= 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                            {formatRoi(previewRoi)}
                        </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" isLoading={isSaving} data-testid="save-business-case-btn">
                            Save Business Case
                        </Button>
                    </div>
                </form>
            ) : businessCase ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase tracking-wider font-medium">Estimated Cost</span>
                        <span className="text-lg font-bold text-gray-900 mt-1 block" data-testid="display-cost">
                            {formatCurrency(businessCase.estimated_cost)}
                        </span>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="block text-xs text-gray-500 uppercase tracking-wider font-medium">Estimated Benefit</span>
                        <span className="text-lg font-bold text-gray-900 mt-1 block" data-testid="display-benefit">
                            {formatCurrency(businessCase.estimated_benefit)}
                        </span>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <span className="block text-xs text-emerald-800 uppercase tracking-wider font-medium">Return on Investment</span>
                        <span className="text-lg font-bold text-emerald-700 mt-1 block" data-testid="display-roi">
                            {formatRoi(businessCase.roi)}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="py-6 text-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-6">
                    <p className="text-sm font-medium text-gray-700">No Business Case Attached</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        A business case specifying cost and expected benefit is required before this idea can be reviewed or approved.
                    </p>
                    {canManage && (
                        <div className="mt-4">
                            <Button size="sm" onClick={startEditing} data-testid="attach-business-case-cta">
                                Attach Business Case
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}
