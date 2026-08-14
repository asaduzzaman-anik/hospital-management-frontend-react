import { appointmentsApi } from '../api/appointments'
import { doctorsApi } from '../api/doctors'
import { patientsApi } from '../api/patients'
import { fetchAllPages } from '../api/client'
import {
  billAppointmentId,
  billDoctorDetail,
  billDoctorId,
  billPatientDetail,
  billPatientId,
  hasPersonName,
  relatedId,
} from './format'

function byIdMap(items) {
  return Object.fromEntries((items || []).filter(Boolean).map((item) => [Number(item.id), item]))
}

function lookup(map, id) {
  if (id == null || id === '') return null
  return map[Number(id)] || null
}

async function loadLookups() {
  const [doctors, patients, appointments] = await Promise.all([
    fetchAllPages(doctorsApi.list).catch(() => []),
    fetchAllPages(patientsApi.list).catch(() => []),
    fetchAllPages(appointmentsApi.list).catch(() => []),
  ])
  return {
    doctors,
    patients,
    appointments,
    doctorsById: byIdMap(doctors),
    patientsById: byIdMap(patients),
    appointmentsById: byIdMap(appointments),
  }
}

function inferAppointment(row, appointmentsById) {
  return row.appointment_detail
    || (row.appointment && typeof row.appointment === 'object' ? row.appointment : null)
    || lookup(appointmentsById, billAppointmentId(row))
    || null
}

function inferDoctorFromAppointments(patientId, appointments, doctorsById) {
  if (patientId == null) return null
  const related = appointments.filter((item) => {
    const id = relatedId(item.patient) ?? item.patient_detail?.id
    return Number(id) === Number(patientId)
  })
  if (!related.length) return null
  const completed = related.filter((item) => item.status === 'completed')
  const pool = (completed.length ? completed : related).slice().sort(
    (a, b) => new Date(b.appointment_date || 0) - new Date(a.appointment_date || 0),
  )
  const inferredId = relatedId(pool[0].doctor) ?? pool[0].doctor_detail?.id
  return lookup(doctorsById, inferredId) || pool[0].doctor_detail || null
}

async function resolvePatient(merged, patientsById) {
  const existing = billPatientDetail(merged)
  if (hasPersonName(existing)) return existing
  const patientId = billPatientId(merged)
  const fromList = lookup(patientsById, patientId)
  if (hasPersonName(fromList)) return fromList
  if (patientId != null) {
    const fetched = await patientsApi.get(patientId).catch(() => null)
    if (hasPersonName(fetched)) return fetched
  }
  return fromList || existing
}

async function resolveDoctor(merged, appointments, doctorsById) {
  const existing = billDoctorDetail(merged)
  if (hasPersonName(existing)) return existing
  const doctorId = billDoctorId(merged)
  const fromList = lookup(doctorsById, doctorId)
  if (hasPersonName(fromList)) return fromList
  if (doctorId != null) {
    const fetched = await doctorsApi.get(doctorId).catch(() => null)
    if (hasPersonName(fetched)) return fetched
  }
  const inferred = inferDoctorFromAppointments(billPatientId(merged), appointments, doctorsById)
  if (hasPersonName(inferred)) return inferred
  return fromList || inferred || existing
}

function attachRelations(row, lookups) {
  const appointment = inferAppointment(row, lookups.appointmentsById)
  return { ...row, appointment_detail: appointment }
}

export async function hydrateBill(data) {
  if (!data) return data
  const lookups = await loadLookups()
  const merged = attachRelations(data, lookups)
  const [patient, doctor] = await Promise.all([
    resolvePatient(merged, lookups.patientsById),
    resolveDoctor(merged, lookups.appointments, lookups.doctorsById),
  ])
  return {
    ...merged,
    patient_detail: patient,
    doctor_detail: doctor,
  }
}

export async function hydrateBills(result) {
  const rows = result.results || []
  const lookups = await loadLookups()
  const mergedRows = rows.map((row) => attachRelations(row, lookups))
  const resolved = await Promise.all(
    mergedRows.map(async (row) => ({
      ...row,
      patient_detail: await resolvePatient(row, lookups.patientsById),
      doctor_detail: await resolveDoctor(row, lookups.appointments, lookups.doctorsById),
    })),
  )
  return { ...result, results: resolved }
}
