// Card with surface hierarchy and elevation levels
// layer prop: 1 = subtle tinted surface | 2 = white card
export default function Card({ children, className = '', hover = false, padding = 'md', layer = 2 }) {
  const paddings = {
    none: '',
    sm:   'p-4',
    md:   'p-5',
    lg:   'p-6',
  }
  const layers = {
    1: 'bg-surface-1',
    2: 'bg-surface-2',
  }
  return (
    <div
      className={`
        ${layers[layer] || layers[2]}
        rounded-xl border border-slate-100 shadow-elev-2
        ${paddings[padding]}
        ${hover ? 'transition-all duration-200 hover:shadow-elev-3 hover:-translate-y-px' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
