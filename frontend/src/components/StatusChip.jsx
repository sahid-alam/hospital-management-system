const VARIANTS = {
  // Appointment statuses
  Scheduled:   'info',
  Completed:   'success',
  Cancelled:   'neutral',
  'No-Show':   'neutral',
  // Billing
  Paid:        'success',
  Partial:     'warn',
  Pending:     'danger',
  // Ward types (used as chip color hints)
  ICU:         'danger',
  General:     'info',
  Private:     'primary',
  'Semi-Private': 'warn',
  // Generic
  Active:      'success',
  Inactive:    'neutral',
}

export default function StatusChip({ status, className = '' }) {
  const variant = VARIANTS[status] ?? 'neutral'
  return (
    <span className={`chip ${variant} ${className}`}>
      <span className="d" />
      {status}
    </span>
  )
}
