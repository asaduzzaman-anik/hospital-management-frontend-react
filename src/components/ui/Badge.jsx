const styles = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-sky-50 text-sky-800 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  unpaid: 'bg-rose-50 text-rose-800 border-rose-200',
  available: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  unavailable: 'bg-slate-100 text-slate-600 border-slate-200',
  admin: 'bg-violet-50 text-violet-800 border-violet-200',
  doctor: 'bg-teal-50 text-teal-800 border-teal-200',
  patient: 'bg-sky-50 text-sky-800 border-sky-200',
  receptionist: 'bg-amber-50 text-amber-800 border-amber-200',
  'A+': 'bg-rose-50 text-rose-700 border-rose-200',
  'A-': 'bg-rose-50 text-rose-800 border-rose-200',
  'B+': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'B-': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'AB+': 'bg-sky-50 text-sky-700 border-sky-200',
  'AB-': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'O+': 'bg-orange-50 text-orange-700 border-orange-200',
  'O-': 'bg-amber-50 text-amber-800 border-amber-200',
}

export function Badge({ children, tone = 'pending', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[tone] || styles.pending
      } ${className}`}
    >
      {children}
    </span>
  )
}
