import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { prescriptionsApi } from '../../api/prescriptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Table, Pagination } from '../../components/ui/Table'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { getApiError } from '../../utils/errors'
import { doctorName, formatDateTime, patientName } from '../../utils/format'

export function PrescriptionListPage() {
  const { user } = useAuth()
  const canCreate = user.role === 'doctor' || user.role === 'admin'
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const result = await prescriptionsApi.list({ page })
        if (!cancelled) setData(result)
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
  }, [page])

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        breadcrumb={[{ label: 'Prescriptions' }]}
        description={user.role === 'patient' || user.role === 'doctor' ? 'Showing records scoped to your account by the API.' : undefined}
        actions={
          canCreate && (
            <Link to="/prescriptions/new">
              <Button>New prescription</Button>
            </Link>
          )
        }
      />
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : data.results.length === 0 ? (
        <EmptyState title="No prescriptions found." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'id', header: 'ID', render: (row) => `#${row.id}` },
              {
                key: 'patient',
                header: 'Patient',
                render: (row) => patientName(row.appointment_detail?.patient_detail) || `Appointment #${row.appointment}`,
              },
              {
                key: 'doctor',
                header: 'Doctor',
                render: (row) => doctorName(row.appointment_detail?.doctor_detail) || '—',
              },
              { key: 'diagnosis', header: 'Diagnosis' },
              { key: 'created_at', header: 'Created', render: (row) => formatDateTime(row.created_at) },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <Link to={`/prescriptions/${row.id}`} className="text-sm font-medium text-teal-700 hover:underline">
                    View
                  </Link>
                ),
              },
            ]}
            rows={data.results}
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
