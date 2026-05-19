import { useState, useEffect } from 'react'
import { Users, BedDouble, CalendarDays, Receipt, AlertTriangle } from 'lucide-react'
import api from '../api/axios'
import OccupancyChart from '../components/charts/OccupancyChart'
import RevenueChart   from '../components/charts/RevenueChart'
import StatusChip     from '../components/StatusChip'
import { SkeletonCard, SkeletonTable } from '../components/Skeleton'
import { KineticHeading, FadeUp } from '../components/Animate'
import PageHero from '../components/PageHero'

// ─── Sparkline (inline SVG) ──────────────────────────────────────────────────
function Sparkline({ data, color = 'var(--primary)', w = 80, h = 28 }) {
  if (!data?.length) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * h,
  ])
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${path} L ${w} ${h} L 0 ${h} Z`
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  )
}

// ─── KPI Card with sparkline ─────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, delta, trend, sub, sparkData, color = 'var(--primary)', loading }) {
  if (loading) return <SkeletonCard />
  const up = trend !== 'down'
  return (
    <div className="panel" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>{label}</div>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: 'grid', placeItems: 'center', color }}>
            <Icon size={15} strokeWidth={1.7} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--ink)' }}>{value ?? '—'}</div>
          {(delta || sub) && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              {delta && (
                <span className={`chip ${up ? 'success' : 'danger'}`} style={{ padding: '2px 7px', fontSize: 10 }}>
                  {up ? '↑' : '↓'} {delta}
                </span>
              )}
              {sub && <span className="muted" style={{ fontSize: 11 }}>{sub}</span>}
            </div>
          )}
        </div>
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>
    </div>
  )
}

// ─── Admissions chart (SVG line + area) ─────────────────────────────────────
function AdmissionsChart({ data }) {
  if (!data?.length) return null
  const max = Math.max(...data, 1)
  const W = 800, H = 200
  const pad = { l: 20, r: 12, t: 16, b: 28 }
  const cw = W - pad.l - pad.r
  const ch = H - pad.t - pad.b
  const pts = data.map((v, i) => [
    pad.l + (i / (data.length - 1)) * cw,
    pad.t + ch - (v / max) * ch,
  ])
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${path} L ${pad.l + cw} ${pad.t + ch} L ${pad.l} ${pad.t + ch} Z`
  const peakIdx = data.indexOf(max)
  const [px, py] = pts[peakIdx] || [0, 0]
  const hourLabels = [0, 6, 12, 18, 23]

  return (
    <div className="panel" style={{ padding: 24 }}>
      <div className="panel-head">
        <h3>Admissions today</h3>
        <span className="h-sub">24h · hourly</span>
        <div className="grow" />
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={pad.l} x2={pad.l + cw} y1={pad.t + ch * p} y2={pad.t + ch * p} stroke="#eef1f6" />
        ))}
        <path d={area} fill="url(#ag)" />
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.filter((_, i) => i % 3 === 0).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="var(--primary)" strokeWidth="1.5" />
        ))}
        {hourLabels.map(hr => (
          <text key={hr} x={pad.l + (hr / 23) * cw} y={H - 8} fontSize="10" fill="#98a1b3"
            textAnchor="middle" fontFamily="JetBrains Mono,monospace">{String(hr).padStart(2, '0')}:00</text>
        ))}
        {max > 0 && (
          <g>
            <line x1={px} y1={py - 6} x2={px} y2={pad.t + ch} stroke="var(--primary)" strokeDasharray="3 3" opacity="0.4" />
            <rect x={px - 28} y={py - 30} width="56" height="20" rx="4" fill="var(--primary)" />
            <text x={px} y={py - 16} fontSize="11" fill="white" textAnchor="middle" fontWeight="500">peak · {max}</text>
          </g>
        )}
      </svg>
    </div>
  )
}

// ─── Critical patients panel ─────────────────────────────────────────────────
function CriticalPanel({ data, loading }) {
  return (
    <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
      <div className="panel-head">
        <span className="chip danger"><span className="d" />Critical</span>
        <h3 style={{ marginLeft: 6 }}>Needs attention</h3>
        <div className="grow" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {loading ? (
          [1,2].map(i => <div key={i} className="skel" style={{ height: 60, width: '100%', borderRadius: 12 }} />)
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>
            No critical patients — ICU is clear
          </div>
        ) : data.map((p, i) => {
          const ini = p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
          const h = [...p.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
          return (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: `hsl(${h},50%,36%)`, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: 'white', flexShrink: 0 }}>{ini}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.ward_name} · {p.attending_doctor}</div>
                <div style={{ fontSize: 11, marginTop: 3, color: 'var(--ink)' }}>Day {p.days_admitted} of admission</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                <span className="chip danger" style={{ padding: '2px 7px', fontSize: 10 }}><span className="d" />ICU</span>
              </div>
            </div>
          )
        })}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: '#fff7e8', border: '1px solid #f6e2bf' }}>
          <div style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 999, background: 'var(--warn)', color: 'white', flexShrink: 0 }}>
            <AlertTriangle size={16} strokeWidth={1.7} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>ICU capacity alert</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Monitor ventilator availability for transfers</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Department load bars ────────────────────────────────────────────────────
const DEPT_COLORS = ['var(--primary)', 'var(--accent)', 'var(--info)', 'var(--warn)', 'var(--danger)', '#a855f7']

function DeptLoad({ data, loading }) {
  return (
    <div className="panel" style={{ padding: 24 }}>
      <div className="panel-head">
        <h3>Department load</h3>
        <span className="h-sub">appointments today</span>
        <div className="grow" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 24, width: '100%' }} />)
        ) : data.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>No department data</div>
        ) : data.map((d, i) => {
          const pct = Math.min(100, Number(d.load_pct) || 0)
          const color = DEPT_COLORS[i % DEPT_COLORS.length]
          return (
            <div key={d.dept_name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ fontWeight: 500 }}>{d.dept_name}</span>
                <span className="mono muted">{d.appts_today} appt{d.appts_today !== '1' ? 's' : ''}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Activity log ────────────────────────────────────────────────────────────
const ACTION_COLOR = {
  'Admitted':                 'primary',
  'Discharged':               'success',
  'Appointment — Completed':  'success',
  'Appointment — Scheduled':  'info',
  'Appointment — Cancelled':  'neutral',
  'Appointment — No-Show':    'neutral',
}

function ActivityPanel({ data, loading }) {
  return (
    <div className="panel" style={{ padding: 24 }}>
      <div className="panel-head">
        <h3>Activity</h3>
        <span className="h-sub">recent events</span>
        <div className="grow" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }}>
        {loading ? (
          [1,2,3,4,5,6].map(i => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--line-2)', display: 'flex', gap: 10 }}>
              <div className="skel" style={{ width: 42, height: 14, flexShrink: 0 }} />
              <div className="skel" style={{ width: '60%', height: 14 }} />
            </div>
          ))
        ) : data.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, gridColumn: '1/-1' }}>No recent activity</div>
        ) : data.slice(0, 12).map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 8px', borderBottom: i < data.length - 1 ? '1px solid var(--line-2)' : 'none', alignItems: 'flex-start' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--muted-2)', minWidth: 40, paddingTop: 2, flexShrink: 0 }}>
              {a.ts?.slice(5, 10)}
            </div>
            <div style={{ flex: 1, fontSize: 12 }}>
              <span className="muted">{a.action}</span>
              {' — '}
              <span style={{ fontWeight: 500 }}>{a.subject}</span>
              {a.context && <span className="muted"> · {a.context}</span>}
            </div>
            <span className={`chip ${ACTION_COLOR[a.action] || 'neutral'}`} style={{ fontSize: 10, padding: '1px 6px', flexShrink: 0 }}>
              <span className="d" />{a.action.split('—')[0].trim().slice(0, 8)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard page ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,    setStats]    = useState(null)
  const [wards,    setWards]    = useState([])
  const [revenue,  setRevenue]  = useState([])
  const [appts,    setAppts]    = useState([])
  const [critical, setCritical] = useState([])
  const [deptLoad, setDeptLoad] = useState([])
  const [activity, setActivity] = useState([])
  const [hourly,   setHourly]   = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard').catch(() => ({ data: {} })),
      api.get('/appointments/today').catch(() => ({ data: [] })),
    ]).then(([d, a]) => {
      const dash = d.data ?? {}
      setStats(dash.stats ?? {})
      setWards(dash.wardOccupancy ?? [])
      setRevenue(dash.revenueByMonth ?? [])
      setCritical(dash.criticalPatients ?? [])
      setDeptLoad(dash.deptLoad ?? [])
      setActivity(dash.activity ?? [])
      setHourly(dash.admissionsByHour ?? [])
      setAppts(Array.isArray(a.data) ? a.data : [])
    }).finally(() => setLoading(false))
  }, [])

  const s = stats ?? {}
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="page">
      <PageHero
        eyebrow={today}
        title="Good morning,"
        accent="Doctor."
        sub={`${s.activeAdmissions ?? '—'} active admissions across all wards.${critical.length > 0 ? ` ${critical.length} critical case${critical.length > 1 ? 's' : ''} need attention.` : ' No critical cases.'}`}
        meta={[
          { k: 'Patients today', v: s.totalPatients },
          { k: 'Active admissions', v: s.activeAdmissions },
          { k: "Today's appointments", v: s.todayAppointments },
          { k: 'Pending bills', v: s.pendingBills },
        ]}
      />

      {/* KPI cards */}
      <FadeUp delay={500}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          <KpiCard loading={loading} icon={Users}       label="Total Patients"        value={s.totalPatients}     color="var(--primary)" sparkData={[80,90,95,100,108,112,118,s.totalPatients || 120]} delta="+8%" trend="up" sub="registered" />
          <KpiCard loading={loading} icon={BedDouble}   label="Active Admissions"     value={s.activeAdmissions}  color="var(--accent)"  sparkData={[14,18,16,20,22,18,20,s.activeAdmissions || 20]} delta="+2" trend="up" sub="vs yesterday" />
          <KpiCard loading={loading} icon={CalendarDays} label="Today's Appointments" value={s.todayAppointments} color="var(--info)"   sparkData={[5,8,6,10,9,11,8,s.todayAppointments || 9]} />
          <KpiCard loading={loading} icon={Receipt}     label="Pending Bills"         value={s.pendingBills}      color="var(--danger)"  sparkData={[4,6,5,8,7,6,8,s.pendingBills || 8]} delta={s.pendingBills > 5 ? 'review' : 'ok'} trend={s.pendingBills > 5 ? 'down' : 'up'} />
        </div>
      </FadeUp>

      {/* Admissions chart + Critical panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14 }}>
        <FadeUp delay={600}>
          <AdmissionsChart data={hourly.length ? hourly : Array(24).fill(0)} />
        </FadeUp>
        <FadeUp delay={700}>
          <CriticalPanel data={critical} loading={loading} />
        </FadeUp>
      </div>

      {/* Dept load + Today's appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <FadeUp delay={750}>
          <DeptLoad data={deptLoad} loading={loading} />
        </FadeUp>
        <FadeUp delay={800}>
          <div className="panel" style={{ padding: 24 }}>
            <div className="panel-head">
              <h3>Today's schedule</h3>
              <span className="h-sub">{appts.length} appointments</span>
              <div className="grow" />
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--line-2)', alignItems: 'center' }}>
                    <div className="skel" style={{ width: 42, height: 14, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skel" style={{ width: '60%', height: 16, marginBottom: 4 }} />
                      <div className="skel" style={{ width: '40%', height: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : appts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 13 }}>No appointments scheduled</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {appts.slice(0, 6).map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: i < Math.min(appts.length, 6) - 1 ? '1px solid var(--line-2)' : 'none', alignItems: 'center' }}>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', minWidth: 42 }}>{a.appt_time?.slice(0,5)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.patient_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.doctor_name} · {a.speciality}</div>
                    </div>
                    <StatusChip status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <FadeUp delay={850}>
          <div className="panel" style={{ padding: 22 }}>
            <div className="panel-head">
              <h3>Ward Occupancy</h3>
              <div className="grow" />
              <span className="h-sub">Live</span>
            </div>
            <OccupancyChart data={wards} />
          </div>
        </FadeUp>
        <FadeUp delay={900}>
          <div className="panel" style={{ padding: 22 }}>
            <div className="panel-head">
              <h3>Monthly Revenue</h3>
              <div className="grow" />
              <span className="h-sub">6 months</span>
            </div>
            <RevenueChart data={revenue} />
          </div>
        </FadeUp>
      </div>

      {/* Activity log */}
      <FadeUp delay={950}>
        <ActivityPanel data={activity} loading={loading} />
      </FadeUp>
    </div>
  )
}
