import { useEffect, useRef, useState } from 'react'

// Count-up animation hook
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const run = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(run)
    }
    raf.current = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}

// Accent color map — only border / icon, never background fill
const colorMap = {
  navy:    { border: 'border-l-navy-700',    icon: 'text-navy-600',    dot: 'bg-navy-600' },
  teal:    { border: 'border-l-teal-600',    icon: 'text-teal-600',    dot: 'bg-teal-500' },
  emerald: { border: 'border-l-emerald-500', icon: 'text-emerald-600', dot: 'bg-emerald-500' },
  amber:   { border: 'border-l-amber-500',   icon: 'text-amber-600',   dot: 'bg-amber-500' },
  violet:  { border: 'border-l-violet-500',  icon: 'text-violet-600',  dot: 'bg-violet-500' },
}

export default function StatCard({ label, value, icon, color = 'navy', meta }) {
  const c = colorMap[color] || colorMap.navy
  const count = useCountUp(typeof value === 'number' ? value : 0)

  return (
    <div
      className={`
        group bg-white rounded-xl border border-slate-100 border-l-2 ${c.border}
        shadow-elev-1 hover:shadow-elev-3 hover:-translate-y-0.5
        transition-all duration-200 ease-out
        flex items-center gap-4 px-5 py-4
      `}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 ${c.icon} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] leading-none mb-2">
          {label}
        </p>
        <p className="text-3xl font-bold text-slate-900 leading-none tracking-tight tabular-nums">
          {typeof value === 'number' ? count : value}
        </p>
        {meta && (
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-none">
            {meta}
          </p>
        )}
      </div>
    </div>
  )
}
