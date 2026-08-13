import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { appointmentsApi } from '../../api/appointments'
import { doctorsApi } from '../../api/doctors'
import { patientsApi } from '../../api/patients'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { STAFF_ROLES } from '../../utils/constants'
import { getApiError, getFieldErrors } from '../../utils/errors'
import { doctorName, fromDateTimeLocal, patientName, toDateTimeLocal } from '../../utils/format'

export function AppointmentFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user, patientProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({ patient: '', doctor: '', appointment_date: '' })
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const isStaff = STAFF_ROLES.includes(user.role)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const available = await doctorsApi.available()
        const doctorList = Array.isArray(available) ? available : available.results || []
        if (!cancelled) setDoctors(doctorList)
        if (isStaff) {
          const patientList = await fetchAllPages(patientsApi.list)
          if (!cancelled) setPatients(patientList)
        }
        if (isEdit) {
          const appointment = await appointmentsApi.get(id)
          if (!cancelled) {
            setValues({
              patient: appointment.patient || '',
              doctor: appointment.doctor || '',
              appointment_date: toDateTimeLocal(appointment.appointment_date),
            })
          }
        }
      } catch (error) {
        if (!cancelled) setFormError(getApiError(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, isEdit, isStaff])

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (isStaff && !values.patient) nextErrors.patient = 'Patient is required.'
    if (user.role === 'patient' && !patientProfile) {
      setFormError('Complete your medical profile before booking an appointment.')
      return
    }
    if (!values.doctor) nextErrors.doctor = 'Doctor is required.'
    if (!values.appointment_date) nextErrors.appointment_date = 'Appointment date is required.'
    else if (new Date(values.appointment_date) < new Date()) {
      nextErrors.appointment_date = 'Appointment date cannot be in the past.'
    }
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const payload = {
        doctor: Number(values.doctor),
        appointment_date: fromDateTimeLocal(values.appointment_date),
      }
      if (isStaff) {
        payload.patient = Number(values.patient)
      } else if (user.role === 'patient' && patientProfile?.id) {
        payload.patient = patientProfile.id
      }
      if (isEdit) await appointmentsApi.update(id, payload)
      else await appointmentsApi.create(payload)
      toast.success(isEdit ? 'Appointment updated.' : 'Appointment booked.')
      navigate('/appointments')
    } catch (error) {
      setErrors(getFieldErrors(error))
      setFormError(getApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit appointment' : 'Book appointment'}
        breadcrumb={[{ label: 'Appointments', to: '/appointments' }, { label: isEdit ? 'Edit' : 'New' }]}
        description="Only currently available doctors are listed. The backend also rejects past dates and unavailable doctors."
      />
      <Card className="max-w-2xl p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          {user.role === 'patient' && !patientProfile && (
            <Alert>Complete your medical profile on the Profile page before booking.</Alert>
          )}
          {isStaff && (
            <Select label="Patient" name="patient" required value={values.patient} onChange={update} error={errors.patient}>
              <option value="">Select patient</option>
              {patients.map((item) => (
                <option key={item.id} value={item.id}>{patientName(item)}</option>
              ))}
            </Select>
          )}
          <Select label="Doctor" name="doctor" required value={values.doctor} onChange={update} error={errors.doctor}>
            <option value="">Select an available doctor</option>
            {doctors.map((item) => (
              <option key={item.id} value={item.id}>
                {doctorName(item)} — {item.specialization}
              </option>
            ))}
          </Select>
          {doctors.length === 0 && <Alert>No available doctors were returned by /doctors/available/.</Alert>}
          <Input
            label="Appointment date"
            name="appointment_date"
            type="datetime-local"
            required
            value={values.appointment_date}
            onChange={update}
            error={errors.appointment_date}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || (user.role === 'patient' && !patientProfile)}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/appointments')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
