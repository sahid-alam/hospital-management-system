import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'default') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <CheckCircle size={15} color="#00C49F" />}
            {t.type === 'error'   && <XCircle size={15} color="#e0526b" />}
            {t.type === 'default' && <div className="t-dot" style={{ background: '#6b7588' }} />}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              style={{ background: 'none', border: 0, color: 'rgba(255,255,255,0.5)', padding: 2, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
