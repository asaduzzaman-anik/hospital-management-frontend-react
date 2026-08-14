const variants = {
  primary:
    'bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-700/50',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-600/50',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 disabled:opacity-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
