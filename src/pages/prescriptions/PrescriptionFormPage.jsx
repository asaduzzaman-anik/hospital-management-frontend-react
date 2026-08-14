import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { prescriptionsApi } from '../../api/prescriptions'
import { appointmentsApi } from '../../api/appointments'
import { medicinesApi } from '../../api/medicines'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getApiError, getFieldErrors } from '../../utils/errors'
import { doctorName, formatDateTime, isOwnDoctorAppointment, patientName } from '../../utils/format'

const emptyRow = () => ({ medicine: '', dosage: '', duration: '' })

function medicineRowsFromPrescription(prescription) {
  const rows = (prescription.medicines || []).map((row) => ({
    medicine: String(row.medicine || row.medicine_detail?.id || ''),
    dosage: row.dosage || '',
    duration: row.duration || '',
  }))
  return rows.length ? rows : [emptyRow()]
}

export function PrescriptionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { user, doctorProfile } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [existing, setExisting] = useState([])
  const [medicines, setMedicines] = useState([])
  const [linkedAppointment, setLinkedAppointment] = useState(null)
  const [values, setValues] = useState({
    appointment: location.state?.appointmentId || '',
    diagnosis: '',
    notes: '',
    medicines: [emptyRow()],
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (isEdit) {
          const [prescription, medicineList] = await Promise.all([
            prescriptionsApi.get(id),
            fetchAllPages(medicinesApi.list),
          ])
          if (cancelled) return
          const appointment = prescription.appointment
            ? await appointmentsApi.get(prescription.appointment).catch(() => null)
            : null
          if (cancelled) return
          setLinkedAppointment(appointment)
          setMedicines(medicineList)
          setValues({
            appointment: prescription.appointment || '',
            diagnosis: prescription.diagnosis || '',
            notes: prescription.notes || '',
            medicines: medicineRowsFromPrescription(prescription),
          })
        } else {
          const [completed, prescriptions, medicineList] = await Promise.all([
            fetchAllPages(appointmentsApi.list, { status: 'completed' }),
            fetchAllPages(prescriptionsApi.list),
            fetchAllPages(medicinesApi.list),
          ])
          if (cancelled) return
          setAppointments(completed)
          setExisting(prescriptions)
          setMedicines(medicineList)
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
  }, [id, isEdit])

  const usedAppointmentIds = useMemo(
    () => new Set(existing.map((item) => item.appointment)),
    [existing],
  )

  const eligibleAppointments = appointments.filter((item) => !usedAppointmentIds.has(item.id))
  const ownsPrescription = isOwnDoctorAppointment(linkedAppointment, user, doctorProfile)

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updateRow(index, event) {
    const { name, value } = event.target
    setValues((current) => ({
      ...current,
      medicines: current.medicines.map((row, rowIndex) => (
        rowIndex === index ? { ...row, [name]: value } : row
      )),
    }))
  }

  function addRow() {
    setValues((current) => ({ ...current, medicines: [...current.medicines, emptyRow()] }))
  }

  function removeRow(index) {
    setValues((current) => ({
      ...current,
      medicines: current.medicines.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.appointment) nextErrors.appointment = 'Completed appointment is required.'
    if (!values.diagnosis.trim()) nextErrors.diagnosis = 'Diagnosis is required.'
    if (!values.notes.trim()) nextErrors.notes = 'Notes are required.'
    if (!values.medicines.length) nextErrors.medicines = 'At least one medicine is required.'
    values.medicines.forEach((row, index) => {
      if (!row.medicine) nextErrors[`medicine_${index}`] = 'Medicine is required.'
      if (!row.dosage.trim()) nextErrors[`dosage_${index}`] = 'Dosage is required.'
      if (!row.duration.trim()) nextErrors[`duration_${index}`] = 'Duration is required.'
    })
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const payload = {
        appointment: Number(values.appointment),
        diagnosis: values.diagnosis.trim(),
        notes: values.notes.trim(),
        medicines: values.medicines.map((row) => ({
          medicine: Number(row.medicine),
          dosage: row.dosage.trim(),
          duration: row.duration.trim(),
        })),
      }
      if (isEdit) {
        await prescriptionsApi.update(id, payload)
        toast.success('Prescription updated.')
        navigate(`/prescriptions/${id}`)
      } else {
        await prescriptionsApi.create(payload)
        toast.success('Prescription created.')
        navigate('/prescriptions')
      }
    } catch (error) {
      setErrors(getFieldErrors(error))
      setFormError(getApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />
  if (isEdit && formError && !linkedAppointment) return <Alert>{formError}</Alert>
  if (isEdit && !linkedAppointment) {
    return <Alert>Could not load the linked appointment for this prescription.</Alert>
  }
  if (isEdit && !ownsPrescription) {
    return <Navigate to="/forbidden" replace />
  }

  const appointmentOptions = isEdit && linkedAppointment ? [linkedAppointment] : eligibleAppointments
  const cannotCreate = !isEdit && eligibleAppointments.length === 0

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit prescription' : 'New prescription'}
        breadcrumb={[{ label: 'Prescriptions', to: '/prescriptions' }, { label: isEdit ? 'Edit' : 'New' }]}
        description={
          isEdit
            ? 'Update diagnosis, notes, and medicines. The linked appointment cannot be changed.'
            : 'A prescription can only be created for a completed appointment that does not already have one.'
        }
      />
      <Card className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          {cannotCreate && (
            <Alert>No eligible completed appointments are available. Complete an appointment first, and ensure it does not already have a prescription.</Alert>
          )}
          <Select
            label="Completed appointment"
            name="appointment"
            required
            value={values.appointment}
            onChange={updateField}
            error={errors.appointment}
            disabled={isEdit}
          >
            <option value="">Select appointment</option>
            {appointmentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} · {patientName(item.patient_detail)} · {doctorName(item.doctor_detail)} · {formatDateTime(item.appointment_date)}
              </option>
            ))}
          </Select>
          <Textarea label="Diagnosis" name="diagnosis" required value={values.diagnosis} onChange={updateField} error={errors.diagnosis} />
          <Textarea label="Notes" name="notes" required value={values.notes} onChange={updateField} error={errors.notes} />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Medicines</h2>
              <Button variant="secondary" size="sm" onClick={addRow}>Add medicine</Button>
            </div>
            {errors.medicines && <p className="mb-2 text-xs text-rose-600">{errors.medicines}</p>}
            <div className="space-y-3">
              {values.medicines.map((row, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <Select label="Medicine" name="medicine" required value={row.medicine} onChange={(event) => updateRow(index, event)} error={errors[`medicine_${index}`]}>
                      <option value="">Select medicine</option>
                      {medicines.map((item) => (
                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                      ))}
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Input label="Dosage" name="dosage" required value={row.dosage} onChange={(event) => updateRow(index, event)} error={errors[`dosage_${index}`]} placeholder="500mg" />
                  </div>
                  <div className="md:col-span-3">
                    <Input label="Duration" name="duration" required value={row.duration} onChange={(event) => updateRow(index, event)} error={errors[`duration_${index}`]} placeholder="5 days" />
                  </div>
                  <div className="flex items-end md:col-span-1">
                    <Button
                      variant="ghost"
                      className="w-full text-rose-600"
                      disabled={values.medicines.length === 1}
                      onClick={() => removeRow(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || cannotCreate}>
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create prescription'}
            </Button>
            <Button variant="secondary" onClick={() => navigate(isEdit ? `/prescriptions/${id}` : '/prescriptions')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
