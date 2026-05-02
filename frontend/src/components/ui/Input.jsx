import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, id, error, helpText, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`
          w-full px-3.5 py-2.5 text-sm rounded-lg border bg-surface-1 text-slate-800
          placeholder-slate-400 transition-all duration-150 outline-none
          ${error
            ? 'border-red-400 ring-2 ring-red-100 focus:border-red-500'
            : 'border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'
          } ${className}
        `}
        {...props}
      />
      {error    && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {helpText && !error && <p className="text-xs text-slate-400">{helpText}</p>}
    </div>
  )
})

export default Input
