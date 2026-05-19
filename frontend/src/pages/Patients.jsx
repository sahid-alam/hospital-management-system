import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, ChevronUp, ChevronDown, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../api/axios'
import { fmtDate } from '../utils'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Drawer, Modal, ConfirmModal } from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useToast } from '../components/Toast'
import { KineticHeading, FadeUp } from '../components/Animate'
import PageHero from '../components/PageHero'

const TABS = ['All', 'Admitted', 'Outpatient', 'Discharged']

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
function avatarColor(name = '') {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${h},55%,38%)`
}

export default function Patients() {
  const toast = useToast()
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [tab,      setTab]      = useState('All')
  const [sort,     setSort]     = useState({ key: 'name', dir: 'asc' })
  const [selected, setSelected] = useState(null)
  const [detail,   setDetail]   = useState(null)
  const [showAdd,  setShowAdd]  = useState(false)
  const [stats,    setStats]    = useState(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const load = useCallback(() => {
    setLoading(true)
    api.get('/patients').then(r => setPatients(r.data?.data ?? r.data ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    api.get('/patients/stats').then(r => setStats(r.data)).catch(() => {})
  }, [load])

  const openDrawer = async (p) => {
    setSelected(p)
    setDetail(null)
    try {
      const r = await api.get(`/patients/${p.patient_id}`)
      setDetail(r.data)
    } catch {}
  }

  const onAdd = async (data) => {
    try {
      await api.post('/patients', data)
      toast('Patient registered successfully', 'success')
      reset(); setShowAdd(false); load()
    } catch (e) {
      toast(e.response?.data?.error ?? 'Failed to add patient', 'error')
    }
  }

  const sortBy = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  const SortIcon = ({ k }) => sort.key === k
    ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
    : null

  const filtered = patients
    .filter(p => tab === 'All' || (tab === 'Admitted' ? p.admission_status === 'Active' : tab === 'Discharged' ? p.admission_status === 'Discharged' : !p.admission_status))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search))
    .sort((a, b) => {
      const [av, bv] = [a[sort.key] ?? '', b[sort.key] ?? '']
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })

  return (
    <div className="page">
      <PageHero
        eyebrow="Section 02 · Patients"
        title="Patient"
        accent="register."
        sub={`${stats?.total ?? '—'} active patients. Track admissions, transfers, and discharges in real time. Click any row to open the full chart.`}
        meta={[
          { k: 'Total', v: stats?.total },
          { k: 'Admitted', v: stats?.admitted },
          { k: 'Critical (ICU)', v: stats?.critical },
          { k: 'Outpatient', v: stats?.outpatient },
        ]}
      />

      <div className="tbl-shell">
        <div className="tbl-toolbar">
          {/* Tabs */}
          <div className="seg">
            {TABS.map(t => (
              <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
          {/* Search */}
          <label className="field">
            <Search size={12} color="var(--muted)" />
            <input placeholder="Name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
          </label>
          <div className="right">
            <button className="btn ghost icon-only" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
            <button className="btn primary sm" onClick={() => setShowAdd(true)}>+ Add Patient</button>
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th className="sortable" onClick={() => sortBy('name')}>Name <SortIcon k="name" /></th>
              <th className="sortable" onClick={() => sortBy('dob')}>DOB <SortIcon k="dob" /></th>
              <th>Gender</th>
              <th>Blood Group</th>
              <th className="sortable" onClick={() => sortBy('phone')}>Phone <SortIcon k="phone" /></th>
              <th className="sortable" onClick={() => sortBy('registered_on')}>Registered <SortIcon k="registered_on" /></th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonTable rows={8} cols={7} /> :
             filtered.length === 0 ? (
               <tr><td colSpan={7}>
                 <EmptyState icon={User} title="No patients found" body={search ? 'Try a different search term.' : 'Add your first patient to get started.'} />
               </td></tr>
             ) : filtered.map(p => (
               <tr key={p.patient_id} className="clickable" onClick={() => openDrawer(p)}>
                 <td>
                   <div className="avatar-row">
                     <div className="av" style={{ background: avatarColor(p.name) }}>{initials(p.name)}</div>
                     <div>
                       <div className="nm">{p.name}</div>
                       {p.address && <div className="ml">{p.address.split(',')[0]}</div>}
                     </div>
                   </div>
                 </td>
                 <td className="mono muted" style={{ fontSize: 12 }}>{fmtDate(p.dob)}</td>
                 <td className="muted">{p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}</td>
                 <td><span className="chip info">{p.blood_group || '—'}</span></td>
                 <td className="mono" style={{ fontSize: 12 }}>{p.phone || '—'}</td>
                 <td className="mono muted" style={{ fontSize: 12 }}>{fmtDate(p.registered_on)}</td>
                 <td>{p.admission_status ? <StatusChip status={p.admission_status === 'Active' ? 'Active' : 'Inactive'} /> : <StatusChip status="Inactive" />}</td>
               </tr>
             ))
            }
          </tbody>
        </table>
        {!loading && (
          <div className="tbl-footer">
            <span>{filtered.length} patient{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Patient Drawer */}
      {selected && (
        <Drawer
          title={selected.name}
          subtitle={`Patient ID #${selected.patient_id}`}
          onClose={() => { setSelected(null); setDetail(null) }}
          footer={
            <button className="btn ghost sm" onClick={() => { setSelected(null); setDetail(null) }}>Close</button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            {[
              ['DOB', fmtDate(selected.dob)],
              ['Gender', selected.gender === 'M' ? 'Male' : selected.gender === 'F' ? 'Female' : 'Other'],
              ['Blood Group', selected.blood_group || '—'],
              ['Phone', selected.phone || '—'],
              ['Address', selected.address || '—'],
              ['Registered', fmtDate(selected.registered_on)],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {detail ? (
            <>
              {detail.admissions?.length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>Admissions</div>
                  <div className="tbl-shell" style={{ marginBottom: 20 }}>
                    <table className="tbl">
                      <thead><tr><th>Ward</th><th>Admit</th><th>Discharge</th><th>Doctor</th></tr></thead>
                      <tbody>
                        {detail.admissions.map(a => (
                          <tr key={a.admission_id}>
                            <td>{a.ward_name}</td>
                            <td className="mono muted" style={{ fontSize: 12 }}>{fmtDate(a.admit_date)}</td>
                            <td className="mono muted" style={{ fontSize: 12 }}>{a.discharge_date ? fmtDate(a.discharge_date) : 'Active'}</td>
                            <td className="muted">{a.attending_doctor || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {detail.bills?.length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>Bills</div>
                  <div className="tbl-shell">
                    <table className="tbl">
                      <thead><tr><th>Date</th><th>Total</th><th>Paid</th><th>Status</th></tr></thead>
                      <tbody>
                        {detail.bills.map(b => (
                          <tr key={b.bill_id}>
                            <td className="mono muted" style={{ fontSize: 12 }}>{fmtDate(b.bill_date)}</td>
                            <td className="mono" style={{ fontSize: 12 }}>₹{Number(b.total_amount).toLocaleString()}</td>
                            <td className="mono" style={{ fontSize: 12 }}>₹{Number(b.paid_amount).toLocaleString()}</td>
                            <td><StatusChip status={b.payment_status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 10px' }} />
              Loading history…
            </div>
          )}
        </Drawer>
      )}

      {/* Add Patient Modal */}
      {showAdd && (
        <Modal
          title="Add Patient"
          onClose={() => { setShowAdd(false); reset() }}
          footer={
            <>
              <button className="btn ghost" onClick={() => { setShowAdd(false); reset() }}>Cancel</button>
              <button className="btn primary" form="add-patient-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Add Patient'}
              </button>
            </>
          }
        >
          <form id="add-patient-form" className="form-grid" onSubmit={handleSubmit(onAdd)}>
            <div className="field-block full">
              <label>Full Name *</label>
              <input {...register('name', { required: 'Required' })} placeholder="John Doe" />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="field-block">
              <label>Date of Birth *</label>
              <input type="date" {...register('dob', { required: 'Required' })} />
            </div>
            <div className="field-block">
              <label>Gender *</label>
              <select {...register('gender', { required: 'Required' })}>
                <option value="">Select…</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div className="field-block">
              <label>Phone</label>
              <input {...register('phone')} placeholder="+91 98765 43210" />
            </div>
            <div className="field-block">
              <label>Blood Group</label>
              <select {...register('blood_group')}>
                <option value="">Unknown</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="field-block full">
              <label>Address</label>
              <textarea rows={2} {...register('address')} placeholder="Street, City, State" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
