import { useState, useEffect, useCallback } from 'react'
import { Stethoscope, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../api/axios'
import { fmtDate } from '../utils'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Modal } from '../components/Modal'
import StatusChip from '../components/StatusChip'
import { useToast } from '../components/Toast'
import { KineticHeading, FadeUp } from '../components/Animate'
import PageHero from '../components/PageHero'

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
function avatarColor(name = '') {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${h},55%,38%)`
}

export default function Doctors() {
  const toast = useToast()
  const [doctors, setDoctors]   = useState([])
  const [depts,   setDepts]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [deptFilter, setDeptFilter] = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm()

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/doctors'),
      api.get('/doctors/departments').catch(() => ({ data: [] })),
    ]).then(([d, dep]) => {
      setDoctors(d.data)
      setDepts(dep.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (doc) => {
    setEditing(doc)
    Object.entries(doc).forEach(([k, v]) => setValue(k, v))
    setShowAdd(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await api.put(`/doctors/${editing.doctor_id}`, data)
        toast('Doctor updated', 'success')
      } else {
        await api.post('/doctors', data)
        toast('Doctor added', 'success')
      }
      reset(); setShowAdd(false); setEditing(null); load()
    } catch (e) {
      toast(e.response?.data?.error ?? 'Failed to save', 'error')
    }
  }

  const filtered = deptFilter
    ? doctors.filter(d => String(d.dept_id) === deptFilter)
    : doctors

  return (
    <div className="page">
      <PageHero
        eyebrow="Section 03 · Medical staff"
        title="Care"
        accent="team."
        sub={`${doctors.length} attending physicians on roster across ${depts.length} department${depts.length !== 1 ? 's' : ''}. Filter by specialty or click a row to view the profile and schedule.`}
        meta={[
          { k: 'Total staff', v: doctors.length || '—' },
          { k: 'Departments', v: depts.length || '—' },
        ]}
      />

      <div className="tbl-shell">
        <div className="tbl-toolbar">
          {/* Department filter */}
          <label className="field">
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width: 170 }}>
              <option value="">All Departments</option>
              {depts.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
            </select>
          </label>
          <div className="right">
            <button className="btn ghost icon-only" onClick={load}><RefreshCw size={14} /></button>
            <button className="btn primary sm" onClick={() => { setEditing(null); reset(); setShowAdd(true) }}>+ Add Doctor</button>
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th><th>Speciality</th><th>Department</th><th>Phone</th>
              <th>Email</th><th>Join Date</th><th>Salary</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonTable rows={8} cols={8} /> :
             filtered.length === 0 ? (
               <tr><td colSpan={8}>
                 <EmptyState icon={Stethoscope} title="No doctors found" body="Add a doctor to get started." />
               </td></tr>
             ) : filtered.map(d => (
               <tr key={d.doctor_id}>
                 <td>
                   <div className="avatar-row">
                     <div className="av" style={{ background: avatarColor(d.name) }}>{initials(d.name)}</div>
                     <div>
                       <div className="nm">{d.name}</div>
                       <div className="ml">ID #{d.doctor_id}</div>
                     </div>
                   </div>
                 </td>
                 <td>{d.speciality}</td>
                 <td>{d.dept_name || '—'}</td>
                 <td className="mono muted" style={{ fontSize: 12 }}>{d.phone || '—'}</td>
                 <td className="muted" style={{ fontSize: 12 }}>{d.email || '—'}</td>
                 <td className="mono muted" style={{ fontSize: 12 }}>{fmtDate(d.join_date)}</td>
                 <td className="mono" style={{ fontSize: 12 }}>₹{Number(d.salary || 0).toLocaleString()}</td>
                 <td>
                   <button className="btn ghost sm" onClick={() => openEdit(d)}>Edit</button>
                 </td>
               </tr>
             ))
            }
          </tbody>
        </table>
        {!loading && (
          <div className="tbl-footer">
            <span>{filtered.length} doctor{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal
          title={editing ? 'Edit Doctor' : 'Add Doctor'}
          onClose={() => { setShowAdd(false); setEditing(null); reset() }}
          footer={
            <>
              <button className="btn ghost" onClick={() => { setShowAdd(false); setEditing(null); reset() }}>Cancel</button>
              <button className="btn primary" form="doctor-form" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Doctor'}
              </button>
            </>
          }
        >
          <form id="doctor-form" className="form-grid" onSubmit={handleSubmit(onSubmit)}>
            <div className="field-block full">
              <label>Full Name *</label>
              <input {...register('name', { required: 'Required' })} placeholder="Dr. Jane Smith" />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="field-block">
              <label>Speciality *</label>
              <input {...register('speciality', { required: 'Required' })} placeholder="Cardiology" />
            </div>
            <div className="field-block">
              <label>Department</label>
              <select {...register('dept_id')}>
                <option value="">None</option>
                {depts.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label>Phone</label>
              <input {...register('phone')} placeholder="+91 98765 43210" />
            </div>
            <div className="field-block">
              <label>Email</label>
              <input type="email" {...register('email')} placeholder="doctor@hospital.com" />
            </div>
            <div className="field-block">
              <label>Join Date</label>
              <input type="date" {...register('join_date')} />
            </div>
            <div className="field-block">
              <label>Salary (₹)</label>
              <input type="number" {...register('salary')} placeholder="750000" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
