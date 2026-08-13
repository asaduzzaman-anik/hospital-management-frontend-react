import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doctorsApi } from '../../api/doctors'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { doctorName, fullName } from '../../utils/format'

export function DoctorDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const canWrite = STAFF_ROLES.includes(user.role)
  const [doctor, setDoctor] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    doctorsApi
      .get(id)
      .then((data) => {
        if (!cancelled) setDoctor(data)
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <Spinner />
  if (error) return <Alert>{error}</Alert>
  if (!doctor) return null

  return (
    <div>
      <PageHeader
        title={doctorName(doctor)}
        breadcrumb={[{ label: 'Doctors', to: '/doctors' }, { label: 'Details' }]}
        actions={
          canWrite && (
            <Link to={`/doctors/${doctor.id}/edit`}>
              <Button>Edit</Button>
            </Link>
          )
        }
      />
      <Card className="max-w-3xl p-6">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div><dt className="text-slate-500">Full name</dt><dd className="font-medium">{fullName(doctor.user_detail)}</dd></div>
          <div><dt className="text-slate-500">Username</dt><dd className="font-medium">{doctor.user_detail?.username}</dd></div>
          <div><dt className="text-slate-500">Department</dt><dd className="font-medium">{doctor.department_detail?.name}</dd></div>
          <div><dt className="text-slate-500">Specialization</dt><dd className="font-medium">{doctor.specialization}</dd></div>
          <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{doctor.phone}</dd></div>
          <div><dt className="text-slate-500">Experience</dt><dd className="font-medium">{doctor.experience} years</dd></div>
          <div>
            <dt className="text-slate-500">Availability</dt>
            <dd className="mt-1">
              <Badge tone={doctor.is_available ? 'available' : 'unavailable'}>
                {doctor.is_available ? 'Available' : 'Unavailable'}
              </Badge>
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
