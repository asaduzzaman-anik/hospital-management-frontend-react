export function fullName(user) {
  if (!user) return '—'
  if (typeof user !== 'object') return '—'
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return name || user.username || user.name || '—'
}

export function personName(record) {
  if (!record) return '—'
  if (typeof record !== 'object') return '—'
  const nestedUser = record.user_detail || (record.user && typeof record.user === 'object' ? record.user : null)
  const fromNested = fullName(nestedUser)
  if (fromNested !== '—') return fromNested
  return fullName(record)
}

export function doctorName(doctor) {
  if (!doctor) return '—'
  const name = personName(doctor)
  if (name === '—') return '—'
  return name.startsWith('Dr.') ? name : `Dr. ${name}`
}

export function patientName(patient) {
  return personName(patient)
}

export function hasPersonName(record) {
  return personName(record) !== '—'
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
  if (typeof value === 'object') return value.id ?? value.pk ?? null
  return value
}

export function entityId(record, keys) {
  if (!record) return null
  for (const key of keys) {
    const fromField = relatedId(record[key])
    if (fromField != null) return fromField
    const fromIdField = record[`${key}_id`]
    if (fromIdField != null && typeof fromIdField !== 'object') return fromIdField
    const fromDetail = record[`${key}_detail`]?.id
    if (fromDetail != null) return fromDetail
  }
  return null
}

export function billAppointmentId(bill) {
  return entityId(bill, ['appointment']) ?? bill?.appointment_detail?.id ?? null
}

export function billPatientId(bill) {
  return entityId(bill, ['patient'])
    ?? entityId(bill?.appointment_detail, ['patient'])
    ?? bill?.appointment_detail?.patient_detail?.id
    ?? null
}

export function billDoctorId(bill) {
  return entityId(bill, ['doctor'])
    ?? entityId(bill?.appointment_detail, ['doctor'])
    ?? bill?.appointment_detail?.doctor_detail?.id
    ?? null
}

export function isDoctorRelatedBill(bill, { user, doctorProfile, appointmentIds, patientIds }) {
  if (user?.role !== 'doctor') return true
  const billDoctorIdValue = billDoctorId(bill)
  if (billDoctorIdValue != null && doctorProfile) return Number(billDoctorIdValue) === Number(doctorProfile.id)
  const appointmentId = billAppointmentId(bill)
  if (appointmentId != null) return appointmentIds.has(Number(appointmentId))
  if (bill?.appointment_detail) return isOwnDoctorAppointment(bill.appointment_detail, user, doctorProfile)
  const patientId = billPatientId(bill)
  return patientId != null && patientIds.has(Number(patientId))
}

export function billPatientDetail(bill) {
  if (!bill) return null
  if (hasPersonName(bill.patient_detail)) return bill.patient_detail
  if (hasPersonName(bill.appointment_detail?.patient_detail)) return bill.appointment_detail.patient_detail
  if (bill.patient && typeof bill.patient === 'object' && hasPersonName(bill.patient)) return bill.patient
  return bill.patient_detail || bill.appointment_detail?.patient_detail || null
}

export function billDoctorDetail(bill) {
  if (!bill) return null
  if (hasPersonName(bill.doctor_detail)) return bill.doctor_detail
  if (hasPersonName(bill.appointment_detail?.doctor_detail)) return bill.appointment_detail.doctor_detail
  if (bill.doctor && typeof bill.doctor === 'object' && hasPersonName(bill.doctor)) return bill.doctor
  return bill.doctor_detail || bill.appointment_detail?.doctor_detail || null
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
