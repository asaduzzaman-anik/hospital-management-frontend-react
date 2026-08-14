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

export function isOwnDoctorAppointment(appointment, user, doctorProfile) {
  if (user?.role !== 'doctor' || !doctorProfile || !appointment) return false
  const doctorId = appointment.doctor ?? appointment.doctor_detail?.id
  if (doctorId != null && Number(doctorId) === Number(doctorProfile.id)) return true
  const doctor = appointment.doctor_detail
  return doctor?.user === user.id || doctor?.user_detail?.id === user.id
}

export function relatedId(value) {
  if (value == null) return null
  if (typeof value === 'object') return value.id ?? null
  return value
}

export function isDoctorRelatedBill(bill, { user, doctorProfile, appointmentIds, patientIds }) {
  if (user?.role !== 'doctor') return true
  const appointmentId = relatedId(bill?.appointment) ?? bill?.appointment_detail?.id
  if (appointmentId != null) return appointmentIds.has(Number(appointmentId))
  if (bill?.appointment_detail) return isOwnDoctorAppointment(bill.appointment_detail, user, doctorProfile)
  const patientId = relatedId(bill?.patient) ?? bill?.patient_detail?.id
  return patientId != null && patientIds.has(Number(patientId))
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

export function toDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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
