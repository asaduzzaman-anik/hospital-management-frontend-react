import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { billsApi } from '../../api/bills'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { formatDateTime, formatMoney, patientName } from '../../utils/format'

export function BillDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const canMarkPaid = STAFF_ROLES.includes(user.role)
  const [bill, setBill] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    let cancelled = false
    billsApi
      .get(id)
      .then((data) => {
        if (!cancelled) setBill(data)
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

  async function markPaid() {
    setWorking(true)
    try {
      const updated = await billsApi.markAsPaid(id)
      setBill(updated)
      toast.success('Bill marked as paid.')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setWorking(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return <Alert>{error}</Alert>
  if (!bill) return null

  return (
    <div>
      <PageHeader
        title={`Bill #${bill.id}`}
        breadcrumb={[{ label: 'Billing', to: '/bills' }, { label: 'Details' }]}
        actions={
          canMarkPaid && !bill.paid && (
            <Button disabled={working} onClick={markPaid}>
              {working ? 'Updating...' : 'Mark as paid'}
            </Button>
          )
        }
      />
      <Card className="max-w-2xl p-6">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div><dt className="text-slate-500">Patient</dt><dd className="font-medium">{patientName(bill.patient_detail)}</dd></div>
          <div><dt className="text-slate-500">Amount</dt><dd className="font-medium">{formatMoney(bill.amount)}</dd></div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-1"><Badge tone={bill.paid ? 'paid' : 'unpaid'}>{bill.paid ? 'Paid' : 'Unpaid'}</Badge></dd>
          </div>
          <div><dt className="text-slate-500">Created</dt><dd className="font-medium">{formatDateTime(bill.created_at)}</dd></div>
        </dl>
      </Card>
    </div>
  )
}
