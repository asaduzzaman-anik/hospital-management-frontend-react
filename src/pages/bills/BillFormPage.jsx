import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { billsApi } from '../../api/bills'
import { appointmentsApi } from '../../api/appointments'
import { doctorsApi } from '../../api/doctors'
import { patientsApi } from '../../api/patients'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiError, getFieldErrors } from '../../utils/errors'
import { doctorName, formatDateTime, patientName, relatedId } from '../../utils/format'

export function BillFormPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState({ doctor: '', patient: '', appointment: '', amount: '' })
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [existingBills, setExistingBills] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [doctorList, patientList, completed, bills] = await Promise.all([
          fetchAllPages(doctorsApi.list),
          fetchAllPages(patientsApi.list),
          fetchAllPages(appointmentsApi.list, { status: 'completed' }),
          fetchAllPages(billsApi.list),
        ])
        if (cancelled) return
        setDoctors(doctorList)
        setPatients(patientList)
        setAppointments(completed)
        setExistingBills(bills)
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
  }, [])

  const usedAppointmentIds = useMemo(
    () => new Set(
      existingBills
        .map((bill) => Number(relatedId(bill.appointment)))
        .filter(Boolean),
    ),
    [existingBills],
  )

  const eligibleAppointments = useMemo(
    () => appointments.filter((item) => !usedAppointmentIds.has(Number(item.id))),
    [appointments, usedAppointmentIds],
  )

  const doctorIdsWithVisits = useMemo(
    () => new Set(
      eligibleAppointments
        .map((item) => Number(relatedId(item.doctor) ?? item.doctor_detail?.id))
        .filter(Boolean),
    ),
    [eligibleAppointments],
  )

  const doctorOptions = doctors.filter((item) => doctorIdsWithVisits.has(Number(item.id)))

  const patientIdsForDoctor = useMemo(
    () => new Set(
      eligibleAppointments
        .filter((item) => Number(relatedId(item.doctor) ?? item.doctor_detail?.id) === Number(values.doctor))
        .map((item) => Number(relatedId(item.patient) ?? item.patient_detail?.id))
        .filter(Boolean),
    ),
    [eligibleAppointments, values.doctor],
  )

  const patientOptions = values.doctor
    ? patients.filter((item) => patientIdsForDoctor.has(Number(item.id)))
    : []

  const appointmentOptions = eligibleAppointments.filter((item) => {
    if (!values.doctor || !values.patient) return false
    return (
      Number(relatedId(item.doctor) ?? item.doctor_detail?.id) === Number(values.doctor)
      && Number(relatedId(item.patient) ?? item.patient_detail?.id) === Number(values.patient)
    )
  })

  function update(event) {
    const { name, value } = event.target
    setValues((current) => {
      if (name === 'doctor') return { ...current, doctor: value, patient: '', appointment: '' }
      if (name === 'patient') return { ...current, patient: value, appointment: '' }
      return { ...current, [name]: value }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.doctor) nextErrors.doctor = 'Doctor is required.'
    if (!values.patient) nextErrors.patient = 'Patient is required.'
    if (!values.appointment) nextErrors.appointment = 'Completed appointment is required.'
    if (!values.amount || Number(values.amount) <= 0) nextErrors.amount = 'Amount must be greater than zero.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      await billsApi.create({
        doctor: Number(values.doctor),
        patient: Number(values.patient),
        appointment: Number(values.appointment),
        amount: values.amount,
      })
      toast.success('Bill generated.')
      navigate('/bills')
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
        title="Generate bill"
        breadcrumb={[{ label: 'Billing', to: '/bills' }, { label: 'New' }]}
        description="Link the bill to a doctor and patient through a completed appointment. New bills start as unpaid."
      />
      <Card className="max-w-xl p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          {eligibleAppointments.length === 0 && (
            <Alert>No completed appointments are available to bill. Complete a visit first, and ensure it does not already have a bill.</Alert>
          )}
          <Select
            label="Doctor"
            name="doctor"
            required
            value={values.doctor}
            onChange={update}
            error={errors.doctor}
          >
            <option value="">Select doctor</option>
            {doctorOptions.map((item) => (
              <option key={item.id} value={item.id}>{doctorName(item)}</option>
            ))}
          </Select>
          <Select
            label="Patient"
            name="patient"
            required
            value={values.patient}
            onChange={update}
            error={errors.patient}
            disabled={!values.doctor}
          >
            <option value="">{values.doctor ? 'Select patient' : 'Select a doctor first'}</option>
            {patientOptions.map((item) => (
              <option key={item.id} value={item.id}>{patientName(item)}</option>
            ))}
          </Select>
          <Select
            label="Completed appointment"
            name="appointment"
            required
            value={values.appointment}
            onChange={update}
            error={errors.appointment}
            disabled={!values.patient}
          >
            <option value="">{values.patient ? 'Select appointment' : 'Select a patient first'}</option>
            {appointmentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} · {formatDateTime(item.appointment_date)}
              </option>
            ))}
          </Select>
          <Input label="Amount" name="amount" type="number" min="0.01" step="0.01" required value={values.amount} onChange={update} error={errors.amount} />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || eligibleAppointments.length === 0}>
              {submitting ? 'Saving...' : 'Generate bill'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/bills')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
