import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usersApi } from '../../api/users'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { ROLE_LABELS, ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { fullName } from '../../utils/format'

export function ReceptionistDetailPage() {
  const { id } = useParams()
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    usersApi
      .getById(id)
      .then((data) => {
        if (cancelled) return
        if (data.role !== ROLES.RECEPTIONIST) {
          setError('This account is not a receptionist.')
          return
        }
        setAccount(data)
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
  if (!account) return null

  return (
    <div>
      <PageHeader
        title={fullName(account)}
        breadcrumb={[{ label: 'Receptionists', to: '/receptionists' }, { label: 'Details' }]}
        actions={
          <Link to={`/receptionists/${account.id}/edit`}>
            <Button>Edit</Button>
          </Link>
        }
      />
      <Card className="max-w-3xl p-6">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div><dt className="text-slate-500">Full name</dt><dd className="font-medium">{fullName(account)}</dd></div>
          <div><dt className="text-slate-500">Username</dt><dd className="font-medium">{account.username || '—'}</dd></div>
          <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{account.email || '—'}</dd></div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="mt-1"><Badge tone={account.role}>{ROLE_LABELS[account.role]}</Badge></dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
