import { useState, useEffect, useCallback } from 'react'
import { BedDouble, RefreshCw, LayoutGrid, Table2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../api/axios'
import { fmtDate } from '../utils'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Modal, ConfirmModal } from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useToast } from '../components/Toast'
import { KineticHeading, FadeUp } from '../components/Animate'
import PageHero from '../components/PageHero'

const TYPE_COLORS = { ICU: 'var(--danger)', General: 'var(--info)', Private: 'var(--primary)', 'Semi-Private': 'var(--warn)' }

function WardCard({ ward, onAdmit }) {
  const pct = Math.round(((ward.total_beds - ward.available_beds) / ward.total_beds) * 100)
  const color = TYPE_COLORS[ward.ward_type] ?? 'var(--primary)'
  return (
    <div className="panel fade-in" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{ward.ward_name}</div>
          <StatusChip status={ward.ward_type} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', color }}>{ward.available_beds}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>beds free</div>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--f-mono)' }}>
        <span>{ward.total_beds - ward.available_beds} occupied</span>
        <span>{pct}%</span>
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>₹{Number(ward.charge_per_day).toLocaleString()}/day</span>
        <button className="btn sm primary" onClick={() => onAdmit(ward)} disabled={ward.available_beds === 0}>
          Admit
        </button>
      </div>
    </div>
  )
}

export default function Wards() {
  const toast = useToast()
  const [wards,      setWards]      = useState([])
  const [admissions, setAdmissions] = useState([])
  const [doctors,    setDoctors]    = useState([])
  const [patients,   setPatients]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [admLoading, setAdmLoading] = useState(true)
  const [view,       setView]       = useState('cards')
  const [admitWard,  setAdmitWard]  = useState(null)
  const [discharge,  setDischarge]  = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm()

  const loadWards = useCallback(() => {
    setLoading(true)
    api.get('/wards').then(r => setWards(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadAdmissions = useCallback(() => {
    setAdmLoading(true)
    api.get('/wards/admissions').catch(() => ({ data: [] })).then(r => setAdmissions(r.data)).finally(() => setAdmLoading(false))
  }, [])

  useEffect(() => {
    loadWards(); loadAdmissions()
    Promise.all([
      api.get('/doctors').catch(() => ({ data: [] })),
      api.get('/patients').catch(() => ({ data: [] })),
    ]).then(([d, p]) => { setDoctors(d.data); setPatients(p.data?.data ?? p.data ?? []) })
  }, [loadWards, loadAdmissions])

  const openAdmit = (ward) => {
    setAdmitWard(ward)
    setValue('ward_id', ward.ward_id)
  }

  const onAdmit = async (data) => {
    try {
      await api.post('/wards/admit', data)
      toast('Patient admitted', 'success')
      reset(); setAdmitWard(null); loadWards(); loadAdmissions()
    } catch (e) {
      toast(e.response?.data?.error ?? 'Failed to admit', 'error')
    }
  }

  const doDischarge = async (admission_id) => {
    try {
      await api.patch(`/wards/discharge/${admission_id}`)
      toast('Patient discharged', 'success')
      setDischarge(null); loadWards(); loadAdmissions()
    } catch (e) {
      toast(e.response?.data?.error ?? 'Failed to discharge', 'error')
    }
  }

  const totalBeds = wards.reduce((s, w) => s + w.total_beds, 0)
  const occupied  = wards.reduce((s, w) => s + (w.total_beds - w.available_beds), 0)
  const critical  = admissions.filter(a => a.ward_type === 'ICU').length
  const utilization = totalBeds ? Math.round(occupied / totalBeds * 100) : 0

  return (
    <div className="page">
      <PageHero
        eyebrow="Section 05 · Wards"
        title="Bed"
        accent="capacity."
        sub={`${occupied} of ${totalBeds} beds occupied across ${wards.length} ward${wards.length !== 1 ? 's' : ''} (${utilization}% utilization). ${critical} critical patient${critical !== 1 ? 's' : ''} monitored in ICU.`}
        meta={[
          { k: 'Total beds',  v: totalBeds || '—' },
          { k: 'Occupied',    v: occupied || '—' },
          { k: 'Critical',    v: critical },
          { k: 'Utilization', v: totalBeds ? utilization + '%' : '—' },
        ]}
      />

      {/* View toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
        <div className="seg" style={{ border: '1px solid var(--line)', background: 'var(--surface)', padding: 3, borderRadius: 999 }}>
          <button className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}
            style={{ border: 0, padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              background: view === 'cards' ? 'var(--ink)' : 'transparent', color: view === 'cards' ? 'white' : 'var(--muted)' }}>
            <LayoutGrid size={13} style={{ verticalAlign: 'middle' }} /> Cards
          </button>
          <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}
            style={{ border: 0, padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              background: view === 'table' ? 'var(--ink)' : 'transparent', color: view === 'table' ? 'white' : 'var(--muted)' }}>
            <Table2 size={13} style={{ verticalAlign: 'middle' }} /> Table
          </button>
        </div>
        <button className="btn ghost icon-only" onClick={() => { loadWards(); loadAdmissions() }}><RefreshCw size={14} /></button>
      </div>

      {/* Cards view */}
      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
          {loading
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="panel" style={{ padding: 22, height: 160 }}>
                  <div className="skel" style={{ width: '60%', height: 14, display: 'block', marginBottom: 16 }} />
                  <div className="skel" style={{ width: '100%', height: 7, display: 'block', marginBottom: 8 }} />
                  <div className="skel" style={{ width: '40%', height: 10, display: 'block' }} />
                </div>
              ))
            : wards.map(w => <WardCard key={w.ward_id} ward={w} onAdmit={openAdmit} />)
          }
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="tbl-shell" style={{ marginBottom: 28 }}>
          <table className="tbl">
            <thead>
              <tr><th>Ward</th><th>Type</th><th>Total Beds</th><th>Occupied</th><th>Available</th><th>Occupancy</th><th>Rate/day</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonTable rows={6} cols={8} /> :
               wards.map(w => {
                 const pct = Math.round(((w.total_beds - w.available_beds) / w.total_beds) * 100)
                 return (
                   <tr key={w.ward_id}>
                     <td style={{ fontWeight: 500 }}>{w.ward_name}</td>
                     <td><StatusChip status={w.ward_type} /></td>
                     <td className="mono">{w.total_beds}</td>
                     <td className="mono">{w.total_beds - w.available_beds}</td>
                     <td className="mono">{w.available_beds}</td>
                     <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                         <div className="progress-bar" style={{ width: 80 }}>
                           <div className="progress-fill" style={{ width: `${pct}%`, background: TYPE_COLORS[w.ward_type] ?? 'var(--primary)' }} />
                         </div>
                         <span className="mono muted" style={{ fontSize: 11 }}>{pct}%</span>
                       </div>
                     </td>
                     <td className="mono" style={{ fontSize: 12 }}>₹{Number(w.charge_per_day).toLocaleString()}</td>
                     <td><button className="btn primary sm" onClick={() => openAdmit(w)} disabled={w.available_beds === 0}>Admit</button></td>
                   </tr>
                 )
               })
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Active Admissions */}
      <div className="tbl-shell">
        <div className="tbl-toolbar">
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Active Admissions</h3>
          <div className="grow" />
          <span className="eyebrow">{admissions.length} active</span>
        </div>
        <table className="tbl">
          <thead>
            <tr><th>Patient</th><th>Ward</th><th>Type</th><th>Doctor</th><th>Admitted</th><th>Days</th><th></th></tr>
          </thead>
          <tbody>
            {admLoading ? <SkeletonTable rows={5} cols={7} /> :
             admissions.length === 0 ? (
               <tr><td colSpan={7}>
                 <EmptyState icon={BedDouble} title="No active admissions" body="Admit a patient using the ward cards above." />
               </td></tr>
             ) : admissions.map(a => (
               <tr key={a.admission_id}>
                 <td style={{ fontWeight: 500 }}>{a.patient_name}</td>
                 <td>{a.ward_name}</td>
                 <td><StatusChip status={a.ward_type} /></td>
                 <td className="muted">{a.attending_doctor || '—'}</td>
                 <td className="mono muted" style={{ fontSize: 12 }}>{fmtDate(a.admit_date)}</td>
                 <td className="mono" style={{ fontSize: 12 }}>{a.days_admitted ?? '—'}</td>
                 <td>
                   <button className="btn ghost sm" style={{ color: 'var(--danger)' }} onClick={() => setDischarge(a)}>Discharge</button>
                 </td>
               </tr>
             ))
            }
          </tbody>
        </table>
      </div>

      {/* Admit Modal */}
      {admitWard && (
        <Modal
          title={`Admit to ${admitWard.ward_name}`}
          onClose={() => { setAdmitWard(null); reset() }}
          footer={
            <>
              <button className="btn ghost" onClick={() => { setAdmitWard(null); reset() }}>Cancel</button>
              <button className="btn primary" form="admit-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Admitting…' : 'Admit Patient'}
              </button>
            </>
          }
        >
          <form id="admit-form" className="form-grid" onSubmit={handleSubmit(onAdmit)}>
            <input type="hidden" {...register('ward_id')} />
            <div className="field-block full">
              <label>Patient *</label>
              <select {...register('patient_id', { required: 'Required' })}>
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field-block full">
              <label>Attending Doctor</label>
              <select {...register('attending_doctor')}>
                <option value="">Select doctor…</option>
                {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field-block full">
              <label>Admit Date</label>
              <input type="date" {...register('admit_date')} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </form>
        </Modal>
      )}

      {/* Discharge Confirm */}
      {discharge && (
        <ConfirmModal
          title="Discharge Patient"
          body={`Discharge ${discharge.patient_name} from ${discharge.ward_name}? This will free up 1 bed.`}
          confirmLabel="Discharge"
          danger
          onConfirm={() => doDischarge(discharge.admission_id)}
          onClose={() => setDischarge(null)}
        />
      )}
    </div>
  )
}
