import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { medicinesApi } from '../../api/medicines'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'

export function MedicineDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const canManage = user.role === ROLES.ADMIN
  const [medicine, setMedicine] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    medicinesApi
      .get(id)
      .then((data) => {
        if (!cancelled) setMedicine(data)
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
  if (!medicine) return null

  return (
    <div>
      <PageHeader
        title={medicine.name}
        breadcrumb={[{ label: 'Medicines', to: '/medicines' }, { label: 'Details' }]}
        actions={
          canManage && (
            <Link to={`/medicines/${medicine.id}/edit`}>
              <Button>Edit</Button>
            </Link>
          )
        }
      />
      <Card className="max-w-2xl p-6">
        <dl className="grid gap-4 text-sm">
          <div><dt className="text-slate-500">Unit</dt><dd className="font-medium">{medicine.unit}</dd></div>
          <div><dt className="text-slate-500">Description</dt><dd className="font-medium">{medicine.description}</dd></div>
        </dl>
      </Card>
    </div>
  )
}
