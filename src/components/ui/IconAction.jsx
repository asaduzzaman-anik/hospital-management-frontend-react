import { Link } from 'react-router-dom'
import { Icon } from './Icon'

const TONES = {
  teal: 'text-teal-600 hover:bg-teal-50 hover:text-teal-800',
  slate: 'text-slate-800 hover:bg-slate-100',
  rose: 'text-red-500 hover:bg-red-50 hover:text-red-600',
}

export function IconAction({ to, onClick, icon, label, tone = 'slate' }) {
  const className = `inline-flex h-9 w-9 items-center justify-center rounded-md transition ${TONES[tone]}`
  const iconEl = <Icon name={icon} className="h-[18px] w-[18px]" />

  if (to) {
    return (
      <Link to={to} className={className} aria-label={label} title={label}>
        {iconEl}
      </Link>
    )
  }

  return (
    <button type="button" className={className} aria-label={label} title={label} onClick={onClick}>
      {iconEl}
    </button>
  )
}

export function IconActions({ children }) {
  return <div className="flex items-center gap-1.5">{children}</div>
}
