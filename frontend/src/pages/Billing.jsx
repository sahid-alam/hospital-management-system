import { useState, useEffect, useCallback } from 'react'
import { Receipt, RefreshCw, TrendingUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import api from '../api/axios'
import { fmtDate } from '../utils'
import { SkeletonTable, SkeletonCard } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Modal } from '../components/Modal'
import StatusChip from '../components/StatusChip'
import RevenueChart from '../components/charts/RevenueChart'
import { useToast } from '../components/Toast'
import { KineticHeading, FadeUp } from '../components/Animate'
import PageHero from '../components/PageHero'

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Insurance']

function FinanceTile({ label, value, sub, color = 'var(--primary)', loading, prefix = '₹' }) {
  if (loading) return <SkeletonCard />
  return (
    <div className="panel fade-in" style={{ padding: 22 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--f-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color, fontFeatureSettings: '"tnum"' }}>
        {prefix}{Number(value || 0).toLocaleString()}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default function Billing() {
  const toast = useToast()
  const [bills,    setBills]    = useState([])
  const [revenue,  setRevenue]  = useState([])
  const [summary,  setSummary]  = useState(null)
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [revLoad,  setRevLoad]  = useState(true)
  const [paying,   setPaying]   = useState(null)
  const [creating, setCreating] = useState(false)
  const { register: regPay, handleSubmit: hsPay, reset: resetPay, formState: { isSubmitting: isPaying } } = useForm()
  const { register: regNew, handleSubmit: hsNew, reset: resetNew, formState: { isSubmitting: isCreating } } = useForm()

  const loadBills = useCallback(() => {
    setLoading(true)
    api.get('/billing').then(r => {
      setBills(r.data)
      const paid = r.data.filter(b => b.payment_status === 'Paid').reduce((s, b) => s + +b.paid_amount, 0)
      const due  = r.data.filter(b => b.payment_status !== 'Paid').reduce((s, b) => s + (+b.total_amount - +b.paid_amount), 0)
      const over = r.data.filter(b => b.payment_status !== 'Paid' && new Date(b.bill_date) < new Date(Date.now() - 30*86400*1000)).reduce((s, b) => s + +b.total_amount, 0)
      setSummary({ total_collected: paid, outstanding: due, overdue: over, total_bills: r.data.length })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadBills()
    setRevLoad(true)
    api.get('/billing/revenue').then(r => setRevenue(r.data)).catch(() => {}).finally(() => setRevLoad(false))
    api.get('/patients').then(r => setPatients(r.data?.data ?? r.data ?? [])).catch(() => {})
  }, [loadBills])

  const recordPayment = async (data) => {
    try {
      await api.patch(`/billing/${paying.bill_id}/pay`, data)
      toast('Payment recorded', 'success')
      resetPay(); setPaying(null); loadBills()
    } catch (e) {
      toast(e.response?.data?.error ?? 'Failed', 'error')
    }
  }

  const createBill = async (data) => {
    try {
      await api.post('/billing', data)
      toast('Bill created', 'success')
      resetNew(); setCreating(false); loadBills()
    } catch (e) {
      toast(e.response?.data?.error ?? 'Failed', 'error')
    }
  }

  const fmtK = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Number(n || 0).toLocaleString()}`

  return (
    <div className="page">
      <PageHero
        eyebrow="Section 06 · Finance"
        title="Billing"
        accent="& invoices."
        sub={`${fmtK(summary?.total_collected ?? 0)} collected across ${summary?.total_bills ?? '—'} invoices. ${bills.filter(b => b.payment_status !== 'Paid' && new Date(b.bill_date) < new Date(Date.now() - 30*86400*1000)).length} overdue. Outstanding: ${fmtK(summary?.outstanding ?? 0)}.`}
        meta={[
          { k: 'Collected',   v: fmtK(summary?.total_collected ?? 0) },
          { k: 'Outstanding', v: fmtK(summary?.outstanding ?? 0) },
          { k: 'Overdue',     v: fmtK(summary?.overdue ?? 0) },
          { k: 'Total bills', v: summary?.total_bills ?? '—' },
        ]}
      />

      {/* Finance tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <FinanceTile loading={loading} label="Total Collected" value={summary?.total_collected} color="var(--accent)" />
        <FinanceTile loading={loading} label="Outstanding"     value={summary?.outstanding}      color="var(--warn)" />
        <FinanceTile loading={loading} label="Overdue (>30d)"  value={summary?.overdue}          color="var(--danger)" />
        <FinanceTile loading={loading} label="Total Bills"     value={summary?.total_bills}       color="var(--primary)"
          prefix="" sub="All time" />
      </div>

      {/* Revenue chart */}
      <div className="panel" style={{ padding: 22, marginBottom: 24 }}>
        <div className="panel-head">
          <TrendingUp size={16} color="var(--accent)" />
          <h3>Monthly Revenue</h3>
          <div className="grow" />
          <span className="h-sub">Collected vs Billed</span>
        </div>
        {revLoad ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <RevenueChart data={revenue} />
        )}
      </div>

      {/* Bills table */}
      <div className="tbl-shell">
        <div className="tbl-toolbar">
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Invoices</h3>
          <div className="grow" />
          <button className="btn ghost icon-only" onClick={loadBills}><RefreshCw size={14} /></button>
          <button className="btn primary sm" onClick={() => { resetNew(); setCreating(true) }}>+ Create Bill</button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Bill #</th><th>Patient</th><th>Date</th><th>Total</th>
              <th>Paid</th><th>Outstanding</th><th>Mode</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonTable rows={8} cols={9} /> :
             bills.length === 0 ? (
               <tr><td colSpan={9}>
                 <EmptyState icon={Receipt} title="No bills yet" body="Create a bill to get started." />
               </td></tr>
             ) : bills.map(b => (
               <tr key={b.bill_id}>
                 <td className="mono muted" style={{ fontSize: 11 }}>#{String(b.bill_id).padStart(4,'0')}</td>
                 <td style={{ fontWeight: 500 }}>{b.patient_name}</td>
                 <td className="mono muted" style={{ fontSize: 12 }}>{fmtDate(b.bill_date)}</td>
                 <td className="mono" style={{ fontSize: 13, fontFeatureSettings: '"tnum"' }}>₹{Number(b.total_amount).toLocaleString()}</td>
                 <td className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontFeatureSettings: '"tnum"' }}>₹{Number(b.paid_amount).toLocaleString()}</td>
                 <td className="mono" style={{ fontSize: 13, color: +b.total_amount > +b.paid_amount ? 'var(--danger)' : 'var(--muted)', fontFeatureSettings: '"tnum"' }}>
                   ₹{Number(b.total_amount - b.paid_amount).toLocaleString()}
                 </td>
                 <td className="muted" style={{ fontSize: 12 }}>{b.payment_mode || '—'}</td>
                 <td><StatusChip status={b.payment_status} /></td>
                 <td>
                   {b.payment_status !== 'Paid' && (
                     <button className="btn accent sm" onClick={() => { resetPay(); setPaying(b) }}>Pay</button>
                   )}
                 </td>
               </tr>
             ))
            }
          </tbody>
        </table>
        {!loading && (
          <div className="tbl-footer">
            <span>{bills.length} invoice{bills.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {paying && (
        <Modal
          title="Record Payment"
          onClose={() => { setPaying(null); resetPay() }}
          footer={
            <>
              <button className="btn ghost" onClick={() => { setPaying(null); resetPay() }}>Cancel</button>
              <button className="btn accent" form="pay-form" type="submit" disabled={isPaying}>
                {isPaying ? 'Saving…' : 'Record Payment'}
              </button>
            </>
          }
        >
          <div style={{ padding: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
            Bill #{String(paying.bill_id).padStart(4,'0')} · {paying.patient_name} ·{' '}
            Outstanding: <strong style={{ color: 'var(--danger)' }}>₹{Number(paying.total_amount - paying.paid_amount).toLocaleString()}</strong>
          </div>
          <form id="pay-form" className="form-grid" onSubmit={hsPay(recordPayment)}>
            <div className="field-block full">
              <label>Amount Paid *</label>
              <input type="number" step="0.01" {...regPay('paid_amount', { required: 'Required', min: { value: 1, message: 'Must be > 0' } })}
                placeholder={String(paying.total_amount - paying.paid_amount)} />
            </div>
            <div className="field-block full">
              <label>Payment Mode *</label>
              <select {...regPay('payment_mode', { required: 'Required' })}>
                <option value="">Select…</option>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Bill Modal */}
      {creating && (
        <Modal
          title="Create Bill"
          onClose={() => { setCreating(false); resetNew() }}
          footer={
            <>
              <button className="btn ghost" onClick={() => { setCreating(false); resetNew() }}>Cancel</button>
              <button className="btn primary" form="new-bill-form" type="submit" disabled={isCreating}>
                {isCreating ? 'Creating…' : 'Create Bill'}
              </button>
            </>
          }
        >
          <form id="new-bill-form" className="form-grid" onSubmit={hsNew(createBill)}>
            <div className="field-block full">
              <label>Patient *</label>
              <select {...regNew('patient_id', { required: 'Required' })}>
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field-block">
              <label>Total Amount *</label>
              <input type="number" step="0.01" {...regNew('total_amount', { required: 'Required', min: { value: 0, message: 'Must be ≥ 0' } })} placeholder="5000" />
            </div>
            <div className="field-block">
              <label>Bill Date</label>
              <input type="date" {...regNew('bill_date')} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="field-block">
              <label>Initial Payment</label>
              <input type="number" step="0.01" {...regNew('paid_amount')} placeholder="0" />
            </div>
            <div className="field-block">
              <label>Payment Mode</label>
              <select {...regNew('payment_mode')}>
                <option value="">Select…</option>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
