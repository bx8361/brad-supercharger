import { useRef } from 'react'
import { GripHorizontal, GripVertical } from 'lucide-react'

export default function ResizeHandle({ axis, value, min, max, onChange, onReset, label }) {
  const drag = useRef(null)
  const horizontal = axis === 'x'
  const dimension = horizontal ? 'width' : 'height'
  const coordinate = horizontal ? 'clientX' : 'clientY'
  const clamp = next => Math.round(Math.max(min, Math.min(max, next)))
  const Grip = horizontal ? GripVertical : GripHorizontal
  return <button type="button" role="separator" className={`resize-handle resize-${axis}`} aria-label={label}
    aria-valuemin={min} aria-valuemax={max} aria-valuenow={value ?? clamp(window.innerHeight - 150)} aria-orientation={horizontal ? 'vertical' : 'horizontal'}
    title={`${label} · Drag or use arrow keys · Double-click to reset`}
    onPointerDown={e => {
      if (e.button !== 0) return
      e.preventDefault()
      drag.current = { origin: e[coordinate], size: e.currentTarget.parentElement.getBoundingClientRect()[dimension] }
      e.currentTarget.setPointerCapture(e.pointerId)
    }}
    onPointerMove={e => {
      if (drag.current) onChange(clamp(drag.current.size + e[coordinate] - drag.current.origin))
    }}
    onPointerUp={e => { drag.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }}
    onPointerCancel={() => { drag.current = null }}
    onLostPointerCapture={() => { drag.current = null }}
    onKeyDown={e => {
      const grow = e.key === (horizontal ? 'ArrowRight' : 'ArrowDown')
      const shrink = e.key === (horizontal ? 'ArrowLeft' : 'ArrowUp')
      if (grow || shrink) {
        e.preventDefault()
        onChange(clamp(e.currentTarget.parentElement.getBoundingClientRect()[dimension] + (grow ? 20 : -20)))
      } else if (e.key === 'Home') { e.preventDefault(); onReset() }
    }} onDoubleClick={onReset}><Grip size={14} /></button>
}
