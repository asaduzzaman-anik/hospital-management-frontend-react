export function fullName(user) {
  if (!user) return '—'
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return name || user.username || '—'
}

export function doctorName(doctor) {
  if (!doctor) return '—'
  const name = fullName(doctor.user_detail)
  return name === '—' ? 'Doctor' : `Dr. ${name}`
}

export function patientName(patient) {
  if (!patient) return '—'
  return fullName(patient.user_detail)
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export function formatMoney(amount) {
  const number = Number(amount)
  if (Number.isNaN(number)) return amount ?? '—'
  return number.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

export function toDateTimeLocal(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeLocal(value) {
  if (!value) return ''
  return new Date(value).toISOString()
}

export function pageCount(total, pageSize = 10) {
  return Math.max(1, Math.ceil((total || 0) / pageSize))
}
