import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal${wide ? ' wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <div className="grow" />
          <button className="btn ghost icon-only" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <div style={{ padding: '20px 22px 0', borderBottom: '1px solid var(--line)', paddingBottom: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h3>
              {subtitle && <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{subtitle}</div>}
            </div>
            <button className="btn ghost icon-only" onClick={onClose}><X size={15} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, background: 'var(--surface-2)', flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </aside>
    </>
  )
}

export function ConfirmModal({ title, body, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={() => { onConfirm(); onClose() }}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{body}</p>
    </Modal>
  )
}
