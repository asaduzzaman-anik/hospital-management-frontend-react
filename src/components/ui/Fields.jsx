export function Input({
  label,
  error,
  required,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${
          error ? 'border-rose-400' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-rose-600">{error}</span>}
    </label>
  )
}

export function Select({
  label,
  error,
  required,
  children,
  className = '',
  ...props
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
      )}
      <select
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${
          error ? 'border-rose-400' : 'border-slate-200'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="block text-xs text-rose-600">{error}</span>}
    </label>
  )
}

export function Textarea({
  label,
  error,
  required,
  className = '',
  ...props
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
      )}
      <textarea
        className={`min-h-24 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${
          error ? 'border-rose-400' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error && <span className="block text-xs text-rose-600">{error}</span>}
    </label>
  )
}
