import { useLocation, Link } from 'react-router-dom'
import { Search, Bell, Plus } from 'lucide-react'

const ROUTE_META = {
  '/':             { label: 'Dashboard',    cta: null },
  '/patients':     { label: 'Patients',     cta: 'Add Patient' },
  '/doctors':      { label: 'Doctors',      cta: 'Add Doctor' },
  '/appointments': { label: 'Appointments', cta: 'Book Appointment' },
  '/wards':        { label: 'Wards',        cta: 'Admit Patient' },
  '/billing':      { label: 'Billing',      cta: 'Create Bill' },
}

export default function Topbar({ onCta }) {
  const { pathname } = useLocation()
  const meta = ROUTE_META[pathname] ?? { label: pathname.slice(1), cta: null }

  return (
    <header className="topbar">
      {/* Breadcrumbs */}
      <div className="crumbs">
        <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>MediCore</Link>
        <span className="sep">/</span>
        <span className="here">{meta.label}</span>
      </div>

      {/* Search */}
      <label className="tb-search">
        <Search size={13} strokeWidth={2} />
        <input type="search" placeholder="Quick search…" aria-label="Search" />
        <span className="kbd">⌘K</span>
      </label>

      {/* Bell */}
      <button className="iconbtn" aria-label="Notifications" style={{ position: 'relative' }}>
        <Bell size={15} strokeWidth={1.7} />
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--danger)', border: '1.5px solid var(--bg)',
        }} />
      </button>

      {/* CTA */}
      {meta.cta && (
        <button className="btn primary sm" onClick={onCta} style={{ flexShrink: 0 }}>
          <Plus size={14} strokeWidth={2.5} />
          {meta.cta}
        </button>
      )}
    </header>
  )
}
