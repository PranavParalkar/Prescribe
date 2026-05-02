// Refined Button system — primary | secondary | ghost | destructive | outline
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg ' +
    'transition-all duration-150 cursor-pointer select-none ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3.5 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  }

  const variants = {
    // Deep navy — primary action
    primary:
      'bg-navy-700 text-white hover:bg-navy-800 active:bg-navy-900 ' +
      'shadow-elev-1 hover:shadow-elev-2 focus-visible:ring-navy-500',

    // Teal accent — secondary action
    secondary:
      'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 ' +
      'shadow-elev-1 hover:shadow-elev-2 focus-visible:ring-teal-500',

    // Ghost — tertiary / inline
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 ' +
      'active:bg-slate-200 focus-visible:ring-slate-400',

    // Destructive — delete / danger
    destructive:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
      'shadow-elev-1 hover:shadow-elev-2 focus-visible:ring-red-500',

    // Outline — neutral, bordered
    outline:
      'bg-white border border-slate-200 text-slate-700 ' +
      'hover:border-navy-300 hover:text-navy-700 hover:bg-navy-50 ' +
      'focus-visible:ring-navy-400',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
