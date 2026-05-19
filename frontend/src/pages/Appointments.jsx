import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, RefreshCw } from 'lucide-react'
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

const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-Show']

export default function Appointments() {
  const toast = useToast()
  const [appts,    setAppts]    = useState([])
  const [doctors,  setDoctors]  = useState([])
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filters,  setFilters]  = useState({ date: '', doctor_id: '', status: '' })
  const [showBook, setShowBook] = useState(false)
  const [confirm,  setConfirm]  = useState(null)
  const [apptMeta, setApptMeta] = useState(null)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const load = useCallback(() => {
    setLoading(true)
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    api.get('/appointments', { params }).then(r => setAppts(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/appointments/stats').then(r => setApptMeta(r.data)).catch(() => {})
    Promise.all([
      api.get('/doctors').catch(() => ({ data: [] })),
      api.get('/patients').catch(() => ({ data: [] })),
    ]).then(([d, p]) => { setDoctors(d.data); setPatients(p.data?.data ?? p.data ?? []) })
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}`, { status })
      toast(`Marked as ${status}`, 'success')
      load()
    } catch (e) {
      toast(e.response?.data?.error ?? 'Failed', 'error')
    }
  }

  const onBook = async (data) => {
    try {
      await api.post('/appointments', data)
      toast('Appointment booked', 'success')
      reset(); setShowBook(false); load()
    } catch (e) {
      toast(e.response?.data?.error ?? 'Failed to book', 'error')
    }
  }

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  return (
    <div className="page">
      <PageHero
        eyebrow="Section 04 · Scheduling"
        title="Appointments"
        accent="& calendar."
        sub={`${apptMeta?.today ?? '—'} appointments today across ${doctors.length} attending physicians. Filter by date, doctor, or status, or click + Book to schedule a new appointment.`}
        meta={[
          { k: 'Today',     v: apptMeta?.today },
          { k: 'Tomorrow',  v: apptMeta?.tomorrow },
          { k: 'Confirmed', v: apptMeta?.confirmed },
          { k: 'Cancelled', v: apptMeta?.cancelled },
        ]}
      />

      <div className="tbl-shell">
        <div className="tbl-toolbar">
          <label className="field">
            <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)} style={{ width: 130 }} />
          </label>
          <label className="field">
            <select value={filters.doctor_id} onChange={e => setFilter('doctor_id', e.target.value)} style={{ width: 160 }}>
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name}</option>)}
            </select>
          </label>
          <label className="field">
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ width: 130 }}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="right">
            <button className="btn ghost sm" onClick={() => setFilters({ date: '', doctor_id: '', status: '' })}>Clear</button>
            <button className="btn ghost icon-only" onClick={load}><RefreshCw size={14} /></button>
            <button className="btn primary sm" onClick={() => { reset(); setShowBook(true) }}>+ Book</button>
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th>
              <th>Speciality</th><th>Status</th><th>Notes</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonTable rows={8} cols={8} /> :
             appts.length === 0 ? (
               <tr><td colSpan={8}>
                 <EmptyState icon={CalendarDays} title="No appointments" body="Adjust filters or book a new appointment." />
               </td></tr>
             ) : appts.map(a => (
               <tr key={a.appt_id}>
                 <td className="mono muted" style={{ fontSize: 12 }}>{fmtDate(a.appt_date)}</td>
                 <td className="mono" style={{ fontSize: 12 }}>{a.appt_time?.slice(0,5)}</td>
                 <td style={{ fontWeight: 500 }}>{a.patient_name}</td>
                 <td>{a.doctor_name}</td>
                 <td className="muted">{a.speciality}</td>
                 <td><StatusChip status={a.status} /></td>
                 <td className="muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.notes || '—'}</td>
                 <td>
                   {a.status === 'Scheduled' && (
                     <div style={{ display: 'flex', gap: 4 }}>
                       <button className="btn ghost sm" onClick={() => updateStatus(a.appt_id, 'Completed')}>✓</button>
                       <button className="btn ghost sm" onClick={() => updateStatus(a.appt_id, 'No-Show')}>NS</button>
                       <button className="btn ghost sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirm(a)}>✕</button>
                     </div>
                   )}
                 </td>
               </tr>
             ))
            }
          </tbody>
        </table>
        {!loading && (
          <div className="tbl-footer">
            <span>{appts.length} appointment{appts.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {showBook && (
        <Modal
          title="Book Appointment"
          onClose={() => { setShowBook(false); reset() }}
          footer={
            <>
              <button className="btn ghost" onClick={() => { setShowBook(false); reset() }}>Cancel</button>
              <button className="btn primary" form="book-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Booking…' : 'Book Appointment'}
              </button>
            </>
          }
        >
          <form id="book-form" className="form-grid" onSubmit={handleSubmit(onBook)}>
            <div className="field-block full">
              <label>Patient *</label>
              <select {...register('patient_id', { required: 'Required' })}>
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field-block full">
              <label>Doctor *</label>
              <select {...register('doctor_id', { required: 'Required' })}>
                <option value="">Select doctor…</option>
                {doctors.map(d => <option key={d.doctor_id} value={d.doctor_id}>{d.name} – {d.speciality}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label>Date *</label>
              <input type="date" {...register('appt_date', { required: 'Required' })} />
            </div>
            <div className="field-block">
              <label>Time *</label>
              <input type="time" {...register('appt_time', { required: 'Required' })} />
            </div>
            <div className="field-block full">
              <label>Notes</label>
              <textarea rows={2} {...register('notes')} placeholder="Reason for visit…" />
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirm */}
      {confirm && (
        <ConfirmModal
          title="Cancel Appointment"
          body={`Cancel the appointment for ${confirm.patient_name} with ${confirm.doctor_name} on ${fmtDate(confirm.appt_date)}?`}
          confirmLabel="Cancel Appointment"
          danger
          onConfirm={() => updateStatus(confirm.appt_id, 'Cancelled')}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
