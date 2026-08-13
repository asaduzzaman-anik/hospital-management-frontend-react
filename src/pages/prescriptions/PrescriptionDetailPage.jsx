import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { prescriptionsApi } from '../../api/prescriptions'
import { appointmentsApi } from '../../api/appointments'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table } from '../../components/ui/Table'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { getApiError } from '../../utils/errors'
import { doctorName, formatDateTime, patientName } from '../../utils/format'

export function PrescriptionDetailPage() {
  const { id } = useParams()
  const [prescription, setPrescription] = useState(null)
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await prescriptionsApi.get(id)
        if (cancelled) return
        setPrescription(data)
        if (data.appointment) {
          try {
            setAppointment(await appointmentsApi.get(data.appointment))
          } catch {
            setAppointment(null)
          }
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <Spinner />
  if (error) return <Alert>{error}</Alert>
  if (!prescription) return null

  return (
    <div>
      <PageHeader
        title={`Prescription #${prescription.id}`}
        breadcrumb={[{ label: 'Prescriptions', to: '/prescriptions' }, { label: 'Details' }]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Clinical details</h2>
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-slate-500">Appointment</dt><dd className="font-medium">#{prescription.appointment}</dd></div>
            {appointment && (
              <>
                <div><dt className="text-slate-500">Patient</dt><dd className="font-medium">{patientName(appointment.patient_detail)}</dd></div>
                <div><dt className="text-slate-500">Doctor</dt><dd className="font-medium">{doctorName(appointment.doctor_detail)}</dd></div>
                <div><dt className="text-slate-500">Visit date</dt><dd className="font-medium">{formatDateTime(appointment.appointment_date)}</dd></div>
              </>
            )}
            <div><dt className="text-slate-500">Diagnosis</dt><dd className="font-medium">{prescription.diagnosis}</dd></div>
            <div><dt className="text-slate-500">Notes</dt><dd className="font-medium">{prescription.notes}</dd></div>
            <div><dt className="text-slate-500">Created</dt><dd className="font-medium">{formatDateTime(prescription.created_at)}</dd></div>
          </dl>
        </Card>
        <div>
          <h2 className="mb-3 font-semibold">Medicines</h2>
          <Table
            columns={[
              { key: 'medicine', header: 'Medicine', render: (row) => row.medicine_detail?.name || row.medicine },
              { key: 'dosage', header: 'Dosage' },
              { key: 'duration', header: 'Duration' },
            ]}
            rows={prescription.medicines || []}
          />
        </div>
      </div>
    </div>
  )
}
