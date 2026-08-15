import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { appointmentsApi } from '../../api/appointments'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { doctorName, formatDateTime, patientName } from '../../utils/format'

export function AppointmentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setAppointment(await appointmentsApi.get(id))
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function runAction(action, label) {
    setWorking(label)
    try {
      const updated = await appointmentsApi[action](id)
      setAppointment(updated)
      toast.success(`Appointment ${label}.`)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setWorking('')
    }
  }

  if (loading) return <Spinner />
  if (error) return <Alert>{error}</Alert>
  if (!appointment) return null

  const canApprove = STAFF_ROLES.includes(user.role) && appointment.status === 'pending'
  const canComplete = (user.role === 'doctor' || user.role === 'admin') && appointment.status === 'approved'
  const canCancel = appointment.status === 'pending' || appointment.status === 'approved'
  const canPrescribe = (user.role === 'doctor' || user.role === 'admin') && appointment.status === 'completed'
  const canMutate = appointment.status === 'pending' && (STAFF_ROLES.includes(user.role) || user.role === 'patient')

  async function handleDelete() {
    setDeleting(true)
    try {
      await appointmentsApi.remove(appointment.id)
      toast.success('Appointment deleted.')
      navigate('/appointments')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={`Appointment #${appointment.id}`}
        breadcrumb={[{ label: 'Appointments', to: '/appointments' }, { label: 'Details' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            {canMutate && (
              <>
                <Link to={`/appointments/${appointment.id}/edit`}>
                  <Button variant="secondary">Edit</Button>
                </Link>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
              </>
            )}
            {canApprove && (
              <Button disabled={Boolean(working)} onClick={() => runAction('approve', 'approved')}>
                {working === 'approved' ? 'Approving...' : 'Approve'}
              </Button>
            )}
            {canComplete && (
              <Button disabled={Boolean(working)} onClick={() => runAction('complete', 'completed')}>
                {working === 'completed' ? 'Completing...' : 'Complete'}
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" disabled={Boolean(working)} onClick={() => runAction('cancel', 'cancelled')}>
                {working === 'cancelled' ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
            {canPrescribe && (
              <Link to="/prescriptions/new" state={{ appointmentId: appointment.id }}>
                <Button variant="secondary">Create prescription</Button>
              </Link>
            )}
          </div>
        }
      />
      <Card className="max-w-3xl p-6">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div><dt className="text-slate-500">Patient</dt><dd className="font-medium">{patientName(appointment.patient_detail)}</dd></div>
          <div><dt className="text-slate-500">Doctor</dt><dd className="font-medium">{doctorName(appointment.doctor_detail)}</dd></div>
          <div><dt className="text-slate-500">Date</dt><dd className="font-medium">{formatDateTime(appointment.appointment_date)}</dd></div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1"><Badge tone={appointment.status}>{appointment.status}</Badge></dd>
          </div>
          <div><dt className="text-slate-500">Created</dt><dd className="font-medium">{formatDateTime(appointment.created_at)}</dd></div>
        </dl>
      </Card>
      <div className="mt-4">
        <Button variant="ghost" onClick={() => navigate('/appointments')}>Back to list</Button>
      </div>

      <Modal
        open={confirmDelete}
        title="Delete appointment"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        Remove appointment #{appointment.id}? Only pending appointments can be deleted.
      </Modal>
    </div>
  )
}
