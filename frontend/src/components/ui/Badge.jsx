// Enterprise badge system
// variant: 'dot' (default — green dot + label), 'subtle', 'solid', 'outlined'
export default function Badge({ status, children, variant = 'dot' }) {
  const label = children || status

  // Dot variant — minimal dot + label, no background fill
  const dotStyles = {
    Active:  { dot: 'bg-emerald-500', text: 'text-emerald-700' },
    Expired: { dot: 'bg-slate-400',   text: 'text-slate-500'   },
    Pending: { dot: 'bg-amber-400',   text: 'text-amber-700'   },
    Revoked: { dot: 'bg-red-500',     text: 'text-red-600'     },
    Warning: { dot: 'bg-orange-400',  text: 'text-orange-700'  },
    default: { dot: 'bg-navy-500',    text: 'text-navy-700'    },
  }

  const subtle = {
    Active:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
    Expired: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
    Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',
    Revoked: 'bg-red-50 text-red-700 ring-1 ring-red-200/80',
    Warning: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/80',
    default: 'bg-navy-50 text-navy-700 ring-1 ring-navy-200',
  }

  const solid = {
    Active:  'bg-emerald-600 text-white',
    Expired: 'bg-slate-500 text-white',
    Pending: 'bg-amber-500 text-white',
    Revoked: 'bg-red-600 text-white',
    Warning: 'bg-orange-500 text-white',
    default: 'bg-navy-700 text-white',
  }

  const outlined = {
    Active:  'text-emerald-700 ring-1 ring-emerald-400',
    Expired: 'text-slate-500 ring-1 ring-slate-300',
    Pending: 'text-amber-700 ring-1 ring-amber-400',
    Revoked: 'text-red-600 ring-1 ring-red-400',
    Warning: 'text-orange-700 ring-1 ring-orange-400',
    default: 'text-navy-700 ring-1 ring-navy-300',
  }

  if (variant === 'dot') {
    const d = dotStyles[status] || dotStyles.default
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${d.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.dot} ${status === 'Active' ? 'shadow-[0_0_0_2px_rgba(16,185,129,0.2)]' : ''}`} />
        {label}
      </span>
    )
  }

  const variantMap = { subtle, solid, outlined }
  const map = variantMap[variant] || subtle
  const cls = map[status] || map.default

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide ${cls}`}>
      {label}
    </span>
  )
}
