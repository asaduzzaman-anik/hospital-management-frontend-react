export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Alert({ type = 'error', children }) {
  const styles =
    type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-teal-200 bg-teal-50 text-teal-900'
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>
}

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}
