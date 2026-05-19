import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, CalendarDays,
  BedDouble, Receipt, Database, Settings, Activity
} from 'lucide-react'
import { useVeil } from '../App'
import Logo from './Logo'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard',    num: '01' },
  { to: '/patients',     icon: Users,           label: 'Patients',     num: '02' },
  { to: '/doctors',      icon: Stethoscope,     label: 'Doctors',      num: '03' },
  { to: '/appointments', icon: CalendarDays,    label: 'Appointments', num: '04' },
  { to: '/wards',        icon: BedDouble,       label: 'Wards',        num: '05' },
  { to: '/billing',      icon: Receipt,         label: 'Billing',      num: '06' },
  { to: '/schema',       icon: Database,        label: 'DB Schema',    num: '07' },
]

export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { transition } = useVeil()

  const handleNav = (to, label, num) => {
    if (location.pathname === to) return
    transition(label, num, () => {
      navigate(to)
      const area = document.querySelector('.main-area')
      if (area) area.scrollTo({ top: 0, behavior: 'instant' })
    })
  }

  return (
    <aside className="sidebar">
      <div className="sb-grain" />

      {/* Brand */}
      <div className="sb-brand">
        <div className="mark" style={{ background: 'transparent', padding: 0 }}>
          <Logo size={32} />
        </div>
        <div className="sb-label">
          <div className="name">MediCore</div>
          <div className="sub">Hospital OS · v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <div className="sb-section">
        <div className="label sb-label">Workspace</div>
        {NAV.map(({ to, icon: Icon, label, num }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to)
          return (
            <div
              key={to}
              className={`sb-link${isActive ? ' active' : ''}`}
              onClick={() => handleNav(to, label, num)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleNav(to, label, num)}
            >
              <span className="ic"><Icon size={16} strokeWidth={1.7} /></span>
              <span className="sb-label">{label}</span>
              <span className="sb-badge sb-label">{num}</span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div>
        <div className="sb-link" style={{ marginBottom: 4 }}>
          <span className="ic"><Settings size={15} strokeWidth={1.7} /></span>
          <span className="sb-label">Settings</span>
        </div>
        <div className="sb-link" style={{ marginBottom: 8 }}>
          <span className="ic"><Activity size={14} strokeWidth={1.5} style={{ color: 'var(--accent)' }} /></span>
          <span className="sb-label">System</span>
          <span className="sb-badge sb-label" style={{ background: 'rgba(0,196,159,0.18)', color: '#5ee5c7', marginLeft: 'auto' }}>ok</span>
        </div>
        <div className="sb-foot">
          <div className="avatar">A</div>
          <div className="sb-label">
            <div className="who">Admin</div>
            <div className="role">Hospital Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
