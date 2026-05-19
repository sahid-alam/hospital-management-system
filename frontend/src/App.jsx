import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Cursor  from './components/Cursor'
import { ToastProvider } from './components/Toast'
import Dashboard    from './pages/Dashboard'
import Patients     from './pages/Patients'
import Doctors      from './pages/Doctors'
import Appointments from './pages/Appointments'
import Wards        from './pages/Wards'
import Billing      from './pages/Billing'
import Schema       from './pages/Schema'

// ─── Veil Transition Context ─────────────────────────────────────────────────
export const VeilContext = createContext(null)

export function useVeil() { return useContext(VeilContext) }

function VeilProvider({ children }) {
  const [veil, setVeil] = useState({ visible: false, phase: 'idle', label: '', num: '' })

  const transition = useCallback((label, num, callback) => {
    setVeil({ visible: true, phase: 'enter', label, num })
    setTimeout(() => {
      if (callback) callback()
      setTimeout(() => {
        setVeil(v => ({ ...v, phase: 'exit' }))
        setTimeout(() => {
          setVeil({ visible: false, phase: 'idle', label: '', num: '' })
        }, 700)
      }, 180)
    }, 700)
  }, [])

  return (
    <VeilContext.Provider value={{ veil, transition }}>
      {children}
      {veil.visible && (
        <div className={`transition-veil ${veil.phase}`} aria-hidden="true">
          <div className="veil-halftone" />
          <div className="veil-grain" />
          <div className="veil-label">
            <span className="num">{veil.num}</span>
            <span>{veil.label}</span>
          </div>
        </div>
      )}
    </VeilContext.Provider>
  )
}

// ─── ECG Boot Screen ─────────────────────────────────────────────────────────
const ECG_PATH = "M0,60 L60,60 L80,60 L90,20 L100,100 L115,10 L130,110 L145,60 L160,60 L200,60 L210,30 L220,90 L230,60 L560,60"

function BootScreen({ onDone }) {
  const [pct, setPct] = useState(0)
  const [exiting, setExiting] = useState(false)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduceMotion) { onDone(); return }

    const start = performance.now()
    const duration = 1700

    const tick = (now) => {
      const elapsed = now - start
      const p = Math.min(100, Math.round((elapsed / duration) * 100))
      setPct(p)
      if (p < 100) {
        requestAnimationFrame(tick)
      } else {
        setExiting(true)
        setTimeout(onDone, 820)
      }
    }
    requestAnimationFrame(tick)
  }, [])

  return (
    <div className={`boot-veil${exiting ? ' exit' : ''}`} role="status" aria-label="Loading MediCore">
      <div className="boot-brand">
        <div className="mark">M</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>MediCore</div>
          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hospital OS</div>
        </div>
      </div>

      <div className="boot-ecg">
        <svg viewBox="0 0 560 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="ecgGlow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {[20, 40, 60, 80, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="560" y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          ))}
          <path d={ECG_PATH} fill="none" stroke="rgba(0,196,159,0.35)"
            strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
            filter="url(#ecgGlow)"/>
          <path className="ecg-path" d={ECG_PATH} fill="none"
            stroke="#00C49F" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="boot-status-line">
        <div className="dot"/>
        <span>Initializing</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
        <span className="pct">{pct}%</span>
      </div>
    </div>
  )
}

// ─── App Shell ───────────────────────────────────────────────────────────────
export default function App() {
  const [booted, setBooted] = useState(false)

  return (
    <ToastProvider>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}
      <BrowserRouter>
        <VeilProvider>
          <Cursor />
          <div className="app">
            <Sidebar />
            <main className="main-area">
              <Routes>
                <Route path="/"             element={<Dashboard />} />
                <Route path="/patients"     element={<Patients />} />
                <Route path="/doctors"      element={<Doctors />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/wards"        element={<Wards />} />
                <Route path="/billing"      element={<Billing />} />
                <Route path="/schema"       element={<Schema />} />
                <Route path="*"             element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </VeilProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}
