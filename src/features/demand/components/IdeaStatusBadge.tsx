import type { IdeaStatus } from '../../../api/demand'

interface IdeaStatusBadgeProps {
    status: IdeaStatus
}

export function IdeaStatusBadge({ status }: IdeaStatusBadgeProps) {
    const config: Record<IdeaStatus, { label: string; className: string }> = {
        draft: {
            label: 'Draft',
            className: 'bg-gray-100 text-gray-800 border-gray-200',
        },
        submitted: {
            label: 'Submitted',
            className: 'bg-blue-100 text-blue-800 border-blue-200',
        },
        in_review: {
            label: 'In Review',
            className: 'bg-amber-100 text-amber-800 border-amber-200',
        },
        approved: {
            label: 'Approved',
            className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        },
        rejected: {
            label: 'Rejected',
            className: 'bg-rose-100 text-rose-800 border-rose-200',
        },
    }

    const { label, className } = config[status] ?? {
        label: status,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
    }

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${className}`}
        >
            {label}
        </span>
    )
}
