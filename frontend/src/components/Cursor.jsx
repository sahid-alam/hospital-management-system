import { useEffect } from 'react'

const HOVER_SEL = 'button, a, .sb-link, .clickable, [data-cursor="hover"], .btn, label, select, .sortable, .iconbtn'
const TEXT_SEL  = 'input[type="text"], input[type="search"], input[type="email"], input[type="password"], input:not([type]), textarea, [contenteditable], .text-cursor'

export default function Cursor() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const blob = document.createElement('div')
    blob.className = 'cursor'
    const dot = document.createElement('div')
    dot.className = 'cursor-dot'
    document.body.appendChild(blob)
    document.body.appendChild(dot)

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx, ry = my
    let raf

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      // dot snaps immediately
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`

      const t = e.target
      const isText     = !!t.closest(TEXT_SEL)
      const isHover    = !!t.closest(HOVER_SEL)
      if (isText) {
        blob.className = 'cursor text'
      } else if (isHover) {
        blob.className = 'cursor hover'
      } else {
        blob.className = 'cursor'
      }
    }

    const onDown = () => blob.classList.add('press')
    const onUp   = () => blob.classList.remove('press')

    const tick = () => {
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      blob.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
      blob.remove()
      dot.remove()
    }
  }, [])

  return null
}
