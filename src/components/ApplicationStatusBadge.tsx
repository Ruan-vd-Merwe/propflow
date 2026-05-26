import type { ApplicationStatus } from '@/lib/types'

const MAP: Record<ApplicationStatus, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
}

export function ApplicationStatusBadge({
  status,
  size = 'md',
}: {
  status: ApplicationStatus
  size?: 'sm' | 'md'
}) {
  const { label, className } = MAP[status]
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${className} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      {label}
    </span>
  )
}
