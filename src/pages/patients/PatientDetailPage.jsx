import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { patientsApi } from '../../api/patients'
import { appointmentsApi } from '../../api/appointments'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { fullName, patientName, relatedId } from '../../utils/format'

export function PatientDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const canWrite = STAFF_ROLES.includes(user.role)
  const [patient, setPatient] = useState(null)
  const [allowed, setAllowed] = useState(user.role !== 'doctor')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await patientsApi.get(id)
        if (cancelled) return
        setPatient(data)
        if (user.role === 'doctor') {
          const appointments = await fetchAllPages(appointmentsApi.list)
          if (cancelled) return
          const linkedIds = new Set(
            appointments
              .map((item) => Number(relatedId(item.patient) ?? item.patient_detail?.id))
              .filter(Boolean),
          )
          setAllowed(linkedIds.has(Number(id)) || linkedIds.has(Number(data.id)))
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
  }, [id, user.role])

  if (loading) return <Spinner />
  if (error) return <Alert>{error}</Alert>
  if (!patient) return null
  if (!allowed) return <Navigate to="/forbidden" replace />

  return (
    <div>
      <PageHeader
        title={patientName(patient)}
        breadcrumb={[{ label: 'Patients', to: '/patients' }, { label: 'Details' }]}
        actions={
          canWrite && (
            <Link to={`/patients/${patient.id}/edit`}>
              <Button>Edit</Button>
            </Link>
          )
        }
      />
      <Card className="max-w-3xl p-6">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div><dt className="text-slate-500">Full name</dt><dd className="font-medium">{fullName(patient.user_detail)}</dd></div>
          <div><dt className="text-slate-500">Username</dt><dd className="font-medium">{patient.user_detail?.username}</dd></div>
          <div><dt className="text-slate-500">Age</dt><dd className="font-medium">{patient.age}</dd></div>
          <div><dt className="text-slate-500">Gender</dt><dd className="font-medium">{patient.gender}</dd></div>
          <div><dt className="text-slate-500">Blood group</dt><dd className="font-medium">{patient.blood_group}</dd></div>
          <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{patient.phone}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-500">Address</dt><dd className="font-medium">{patient.address}</dd></div>
        </dl>
      </Card>
    </div>
  )
}
