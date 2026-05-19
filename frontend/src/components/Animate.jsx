import { useState, useEffect, useRef } from 'react'

export function KineticHeading({ text, delay = 0, stagger = 70, className = '', as: Tag = 'h1' }) {
  const words = text.split(' ')
  const [shown, setShown] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay)
    // Force final state if CSS transitions are frozen (e.g. screenshot environments)
    const t2 = setTimeout(() => {
      if (ref.current) {
        ref.current.querySelectorAll('.k-word > span').forEach(s => {
          s.style.transition = 'none'
          s.style.transform = 'translateY(0%)'
          s.style.opacity = '1'
        })
      }
    }, delay + 1600)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [delay])

  return (
    <Tag className={className} ref={ref}>
      {words.map((w, i) => (
        <span key={i}>
          <span className={`k-word${shown ? ' in' : ''}`} style={{ '--d': `${i * stagger}ms` }}>
            <span>{w}</span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  )
}

export function FadeUp({ children, delay = 0, className = '' }) {
  const [shown, setShown] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay)
    const t2 = setTimeout(() => {
      if (ref.current) {
        ref.current.style.transition = 'none'
        ref.current.style.opacity = '1'
        ref.current.style.transform = 'translateY(0)'
      }
    }, delay + 1600)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [delay])

  return (
    <div
      ref={ref}
      className={`fade-up${shown ? ' in' : ''}${className ? ' ' + className : ''}`}
    >
      {children}
    </div>
  )
}
