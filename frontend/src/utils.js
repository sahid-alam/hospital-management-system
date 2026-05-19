// Format a date string/object to YYYY-MM-DD, handling ISO timestamps
export function fmtDate(d) {
  if (!d) return '—'
  const s = typeof d === 'string' ? d : d.toISOString()
  return s.split('T')[0]
}

// Format currency in INR
export function fmtINR(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}
