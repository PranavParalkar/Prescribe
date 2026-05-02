// Avatar — refined with navy/teal palette, square with rounded corners
const colorMap = {
  navy:    'bg-navy-100 text-navy-700',
  teal:    'bg-teal-100 text-teal-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  violet:  'bg-violet-100 text-violet-700',
  slate:   'bg-slate-100 text-slate-600',
  blue:    'bg-navy-100 text-navy-700', // alias
}

export default function Avatar({ initials = '?', color = 'navy', size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  }
  return (
    <div
      className={`
        rounded-lg flex items-center justify-center font-bold select-none shrink-0
        ${sizes[size]} ${colorMap[color] || colorMap.navy} ${className}
      `}
    >
      {initials}
    </div>
  )
}
